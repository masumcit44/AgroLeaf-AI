#!/usr/bin/env python3
"""
Evaluate trained model on internal test split and optional external datasets.
Generates metrics-v1.json, confusion_internal.png, and reports selective prediction
metrics (coverage, selective accuracy, unseen class rejection rate).
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader

from calibrate import compute_ece
from common import (
    CLASS_KEYS,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    RiceLeafDataset,
    get_eval_transforms,
    set_seed,
)
from train import build_model

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def parse_external_spec(spec: str) -> Tuple[str, Path, Path]:
    r"""
    Parse external spec formatted as 'name=root:mapfile'.
    Uses rsplit(':', 1) for Windows drive-letter safety (e.g. D:\path).
    """
    if "=" not in spec:
        raise ValueError(f"Invalid external spec (missing '='): {spec}")
    name_part, path_part = spec.split("=", 1)
    if ":" not in path_part:
        raise ValueError(f"Invalid external spec path part (missing ':'): {path_part}")
    ext_root_str, map_file_str = path_part.rsplit(":", 1)
    return name_part.strip(), Path(ext_root_str.strip()), Path(map_file_str.strip())


def plot_confusion_matrix(cm: np.ndarray, class_names: List[str], out_path: Path) -> None:
    plt.figure(figsize=(7, 6))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Greens)
    plt.title("Confusion Matrix (Internal Test)")
    plt.colorbar()

    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=45, ha="right")
    plt.yticks(tick_marks, class_names)

    thresh = cm.max() / 2.0 if cm.max() > 0 else 1.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(
                j,
                i,
                f"{cm[i, j]}",
                horizontalalignment="center",
                color="white" if cm[i, j] > thresh else "black",
            )

    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def evaluate(
    run_dir: Path,
    data_root: Path,
    splits_csv: Path,
    external_specs: Optional[List[str]] = None,
    seed: int = 42,
) -> None:
    set_seed(seed)
    device = torch.device("cpu")

    # Load model
    best_pt = run_dir / "best.pt"
    if not best_pt.exists():
        raise FileNotFoundError(f"Checkpoint not found: {best_pt}")

    checkpoint = torch.load(best_pt, map_location=device)
    arch = checkpoint.get("arch", "mnv3_large")
    model = build_model(arch, num_classes=len(CLASS_KEYS), pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Load calibration
    calib_path = run_dir / "calibration.json"
    temp = 1.0
    threshold = 0.60
    target_prec = 0.90
    calib_warning = None
    if calib_path.exists():
        with open(calib_path, "r", encoding="utf-8") as f:
            calib_data = json.load(f)
            temp = float(calib_data.get("temperature", 1.0))
            threshold = float(calib_data.get("threshold", 0.60))
            target_prec = float(calib_data.get("target_precision", 0.90))
            calib_warning = calib_data.get("warning")

    # Evaluate internal test
    test_dataset = RiceLeafDataset(
        data_root=str(data_root),
        splits_csv=str(splits_csv),
        split="test",
        transform=get_eval_transforms(),
    )
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    print(f"Evaluating on {len(test_dataset)} internal test images (T={temp:.4f}, t={threshold:.4f})...")
    test_logits = []
    test_labels = []

    with torch.no_grad():
        for images, labels, _ in test_loader:
            logits = model(images)
            test_logits.append(logits)
            test_labels.append(labels)

    logits_t = torch.cat(test_logits, dim=0)
    labels_t = torch.cat(test_labels, dim=0).numpy()

    # Scaled probabilities
    probs = torch.softmax(logits_t / temp, dim=1).numpy()
    preds = np.argmax(probs, axis=1)
    max_probs = np.max(probs, axis=1)

    raw_acc = float(np.mean(preds == labels_t)) if len(labels_t) > 0 else 0.0
    macro_f1 = float(f1_score(labels_t, preds, average="macro", zero_division=0))
    ece, _, _, _ = compute_ece(probs, labels_t)

    # Selective metrics
    accepted = max_probs >= threshold
    cov = float(np.mean(accepted)) if len(accepted) > 0 else 0.0
    sel_acc = float(np.mean(preds[accepted] == labels_t[accepted])) if np.sum(accepted) > 0 else 0.0

    print(
        f"Internal Test: Accuracy={raw_acc:.4f}, Macro-F1={macro_f1:.4f}, "
        f"Coverage={cov:.2%}, Selective Acc={sel_acc:.2%}, ECE={ece:.4f}"
    )

    # Per-class metrics
    report = classification_report(
        labels_t,
        preds,
        labels=list(range(len(CLASS_KEYS))),
        target_names=CLASS_KEYS,
        output_dict=True,
        zero_division=0,
    )

    per_class_metrics = {}
    for k in CLASS_KEYS:
        metrics = report.get(k, {})
        per_class_metrics[k] = {
            "precision": round(float(metrics.get("precision", 0.0)), 4),
            "recall": round(float(metrics.get("recall", 0.0)), 4),
            "f1": round(float(metrics.get("f1-score", 0.0)), 4),
            "support": int(metrics.get("support", 0)),
        }

    # Confusion matrix
    cm = confusion_matrix(labels_t, preds, labels=list(range(len(CLASS_KEYS))))
    cm_path = run_dir / "confusion_internal.png"
    plot_confusion_matrix(cm, CLASS_KEYS, cm_path)
    print(f"Saved confusion matrix to {cm_path}")

    # Process external sets if provided
    external_results = []
    if external_specs:
        transform = get_eval_transforms()
        for spec in external_specs:
            name_part, ext_root, map_file = parse_external_spec(spec)

            if not ext_root.exists():
                sys.stderr.write(f"\nERROR: External dataset root not found: {ext_root}\n")
                sys.exit(1)
            if not map_file.exists():
                sys.stderr.write(f"\nERROR: External class map not found: {map_file}\n")
                sys.exit(1)

            with open(map_file, "r", encoding="utf-8") as f:
                class_mapping = json.load(f)

            doi_val = class_mapping.get("__doi__", "")

            # Discover all valid image files
            ext_images = sorted(
                [p for p in ext_root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
            )

            # Strict check: Never ignore folders silently
            found_folders = sorted(list({p.relative_to(ext_root).parts[0] for p in ext_images}))
            unmapped_folders = [
                f for f in found_folders if f not in class_mapping and not f.startswith("__")
            ]
            if unmapped_folders:
                sys.stderr.write(
                    f"\nERROR: External dataset '{ext_root}' contains unmapped class folder(s): {unmapped_folders}\n"
                    f"Known keys in {map_file}: {sorted(k for k in class_mapping.keys() if not k.startswith('__'))}\n"
                    f"Please update the mapping file or fix the folder structure.\n"
                )
                sys.exit(1)

            mapped_labels = []
            mapped_preds = []
            unseen_total = 0
            unseen_rejected = 0

            with torch.no_grad():
                for imp in ext_images:
                    rel_dir = imp.relative_to(ext_root).parts[0]
                    target_k = class_mapping.get(rel_dir, "__ignore__")
                    if target_k == "__ignore__":
                        continue

                    with Image.open(imp) as im:
                        tensor = transform(im.convert("RGB")).unsqueeze(0).to(device)
                    out_logits = model(tensor)
                    out_probs = torch.softmax(out_logits / temp, dim=1).numpy()[0]
                    p_max = float(np.max(out_probs))
                    p_cls = int(np.argmax(out_probs))

                    if target_k == "__unseen__":
                        unseen_total += 1
                        if p_max < threshold:
                            unseen_rejected += 1
                    elif target_k in CLASS_TO_IDX:
                        true_idx = CLASS_TO_IDX[target_k]
                        mapped_labels.append(true_idx)
                        mapped_preds.append((p_cls, p_max))

            mapped_n = len(mapped_labels)
            total_eval_images = mapped_n + unseen_total
            if total_eval_images == 0:
                sys.stderr.write(
                    f"\nERROR: External dataset '{ext_root}' contains 0 matching images mapped to classes or __unseen__!\n"
                )
                sys.exit(1)

            ext_per_class = {}
            if mapped_n > 0:
                p_classes = np.array([p[0] for p in mapped_preds])
                p_confs = np.array([p[1] for p in mapped_preds])
                t_labels = np.array(mapped_labels)
                unique_labels = sorted(list(set(mapped_labels)))

                ext_raw_acc = float(np.mean(p_classes == t_labels))
                # Macro-F1 computed ONLY over the classes this set actually contains
                ext_f1 = float(
                    f1_score(t_labels, p_classes, labels=unique_labels, average="macro", zero_division=0)
                )

                acc_mask = p_confs >= threshold
                ext_cov = float(np.mean(acc_mask))
                ext_sel_acc = (
                    float(np.mean(p_classes[acc_mask] == t_labels[acc_mask]))
                    if np.sum(acc_mask) > 0
                    else 0.0
                )

                # Per-class metrics for mapped classes
                for lbl in unique_labels:
                    ck = IDX_TO_CLASS[lbl]
                    prec = float(
                        precision_score(
                            t_labels == lbl,
                            p_classes == lbl,
                            zero_division=0,
                        )
                    )
                    rec = float(
                        recall_score(
                            t_labels == lbl,
                            p_classes == lbl,
                            zero_division=0,
                        )
                    )
                    f1_val = float(
                        f1_score(
                            t_labels == lbl,
                            p_classes == lbl,
                            zero_division=0,
                        )
                    )
                    supp = int(np.sum(t_labels == lbl))
                    ext_per_class[ck] = {
                        "precision": round(prec, 4),
                        "recall": round(rec, 4),
                        "f1": round(f1_val, 4),
                        "support": supp,
                    }

                accuracy_mapped = round(ext_raw_acc, 4)
                macro_f1_mapped = round(ext_f1, 4)
                coverage_val = round(ext_cov, 4)
                selective_acc_val = round(ext_sel_acc, 4)
            else:
                # No fake zeros: report null (None) when 0 mapped images present
                accuracy_mapped = None
                macro_f1_mapped = None
                coverage_val = None
                selective_acc_val = None

            # Unseen rejection rate: report null (None) when 0 unseen images present
            if unseen_total > 0:
                unseen_rate = round(float(unseen_rejected / unseen_total), 4)
            else:
                unseen_rate = None

            classes_tested = sorted(
                list({v for k, v in class_mapping.items() if not k.startswith("__") and v != "__unseen__"})
            )

            external_results.append(
                {
                    "name": name_part,
                    "doi": doi_val,
                    "classes_tested": classes_tested,
                    "n": total_eval_images,
                    "accuracy_mapped": accuracy_mapped,
                    "macro_f1_mapped": macro_f1_mapped,
                    "coverage": coverage_val,
                    "selective_accuracy": selective_acc_val,
                    "unseen_rejection_rate": unseen_rate,
                    "per_class": ext_per_class,
                }
            )

    # ONNX size if present
    onnx_file = run_dir / "model.onnx"
    onnx_mb = round(os.path.getsize(onnx_file) / (1024 * 1024), 2) if onnx_file.exists() else 0.0

    calibration_info: Dict = {
        "temperature": round(temp, 4),
        "threshold": round(threshold, 4),
        "target_precision": float(target_prec),
    }
    limitations_list = [
        "Leaf Smut has no external test data.",
        "Training images come from one district (Gazipur) and one season.",
    ]
    if calib_warning:
        calibration_info["warning"] = calib_warning
        if calib_warning not in limitations_list:
            limitations_list.append(calib_warning)

    metrics_doc = {
        "model": {
            "arch": arch,
            "onnx_mb": onnx_mb,
            "trained_on": "RiceLeafDiseaseBD v3 (DOI 10.17632/86s4jzj2m4.3)",
            "date": datetime.now().strftime("%Y-%m-%d"),
        },
        "calibration": calibration_info,
        "internal_test": {
            "n": len(labels_t),
            "accuracy": round(raw_acc, 4),
            "macro_f1": round(macro_f1, 4),
            "coverage": round(cov, 4),
            "selective_accuracy": round(sel_acc, 4),
            "ece_after": round(ece, 4),
            "per_class": per_class_metrics,
        },
        "external": external_results,
        "limitations": limitations_list,
    }

    metrics_path = run_dir / "metrics-v1.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_doc, f, indent=2)
    print(f"Saved metrics to {metrics_path}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate model on internal test and external sets")
    parser.add_argument("--run", type=Path, required=True, help="Directory containing best.pt and calibration.json")
    parser.add_argument("--data-root", type=Path, required=True, help="Root folder of image dataset")
    parser.add_argument("--splits", type=Path, required=True, help="Path to splits.csv")
    parser.add_argument("--external", action="append", help="External dataset spec: name=root:mapfile")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    evaluate(
        run_dir=args.run,
        data_root=args.data_root,
        splits_csv=args.splits,
        external_specs=args.external,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
