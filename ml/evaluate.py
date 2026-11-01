#!/usr/bin/env python3
"""
Evaluate trained model on internal test split and optional external datasets.
Generates metrics-v1.json, confusion_internal.png, and reports selective prediction
metrics (coverage, selective accuracy, unseen class rejection rate).
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix, f1_score
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


def evaluate(run_dir: Path, data_root: Path, splits_csv: Path, external_specs: Optional[List[str]] = None, seed: int = 42) -> None:
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
    if calib_path.exists():
        with open(calib_path, "r", encoding="utf-8") as f:
            calib_data = json.load(f)
            temp = float(calib_data.get("temperature", 1.0))
            threshold = float(calib_data.get("threshold", 0.60))
            target_prec = float(calib_data.get("target_precision", 0.90))

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

    print(f"Internal Test: Accuracy={raw_acc:.4f}, Macro-F1={macro_f1:.4f}, Coverage={cov:.2%}, Selective Acc={sel_acc:.2%}, ECE={ece:.4f}")

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
            # spec format: "Name=root:mapfile"
            name_part, path_part = spec.split("=", 1)
            ext_root_str, map_file_str = path_part.split(":", 1)
            ext_root = Path(ext_root_str)
            map_file = Path(map_file_str)

            with open(map_file, "r", encoding="utf-8") as f:
                class_mapping = json.load(f)

            # Discover images
            ext_images = sorted([p for p in ext_root.rglob("*") if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}])

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
            if mapped_n > 0:
                p_classes = np.array([p[0] for p in mapped_preds])
                p_confs = np.array([p[1] for p in mapped_preds])
                t_labels = np.array(mapped_labels)
                acc_mask = p_confs >= threshold
                ext_cov = float(np.mean(acc_mask))
                ext_sel_acc = float(np.mean(p_classes[acc_mask] == t_labels[acc_mask])) if np.sum(acc_mask) > 0 else 0.0
                ext_f1 = float(f1_score(t_labels, p_classes, average="macro", zero_division=0))
            else:
                ext_cov = 0.0
                ext_sel_acc = 0.0
                ext_f1 = 0.0

            unseen_rate = float(unseen_rejected / unseen_total) if unseen_total > 0 else 0.0

            external_results.append(
                {
                    "name": name_part,
                    "doi": "",
                    "classes_tested": [k for k, v in class_mapping.items() if v != "__unseen__"],
                    "n": mapped_n + unseen_total,
                    "macro_f1_mapped": round(ext_f1, 4),
                    "coverage": round(ext_cov, 4),
                    "selective_accuracy": round(ext_sel_acc, 4),
                    "unseen_rejection_rate": round(unseen_rate, 4),
                    "per_class": {},
                }
            )

    # ONNX size if present
    onnx_file = run_dir / "model.onnx"
    onnx_mb = round(os.path.getsize(onnx_file) / (1024 * 1024), 2) if onnx_file.exists() else 0.0

    # Build final metrics-v1.json matching contract exactly
    metrics_doc = {
        "model": {
            "arch": arch,
            "onnx_mb": onnx_mb,
            "trained_on": "RiceLeafDiseaseBD v3 (DOI 10.17632/86s4jzj2m4.3)",
            "date": datetime.now().strftime("%Y-%m-%d"),
        },
        "calibration": {
            "temperature": round(temp, 4),
            "threshold": round(threshold, 4),
            "target_precision": float(target_prec),
        },
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
        "limitations": [
            "Leaf Smut has no external test data.",
            "Training images come from one district (Gazipur) and one season.",
        ],
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
