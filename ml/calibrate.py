#!/usr/bin/env python3
"""
Post-hoc temperature scaling and selective prediction threshold calibration.
Fits a single scalar temperature via LBFGS on validation NLL and selects
the minimum confidence threshold achieving target precision.
"""

import argparse
import json
from pathlib import Path
from typing import Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from common import (
    CLASS_KEYS,
    RiceLeafDataset,
    get_eval_transforms,
    set_seed,
)
from train import build_model


def compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> Tuple[float, np.ndarray, np.ndarray, np.ndarray]:
    """Compute Expected Calibration Error (ECE) and bin statistics."""
    confidences = np.max(probs, axis=1)
    predictions = np.argmax(probs, axis=1)
    accuracies = (predictions == labels).astype(float)

    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    bin_confs = []
    bin_accs = []
    bin_counts = []

    for i in range(n_bins):
        in_bin = (confidences > bin_boundaries[i]) & (confidences <= bin_boundaries[i + 1])
        prop_in_bin = np.mean(in_bin)
        bin_count = np.sum(in_bin)
        bin_counts.append(bin_count)

        if bin_count > 0:
            avg_acc = np.mean(accuracies[in_bin])
            avg_conf = np.mean(confidences[in_bin])
            ece += np.abs(avg_acc - avg_conf) * prop_in_bin
            bin_accs.append(avg_acc)
            bin_confs.append(avg_conf)
        else:
            bin_accs.append(0.0)
            bin_confs.append((bin_boundaries[i] + bin_boundaries[i + 1]) / 2)

    return float(ece), np.array(bin_accs), np.array(bin_confs), np.array(bin_counts)


def calibrate(run_dir: Path, data_root: Path, splits_csv: Path, target_precision: float = 0.90, seed: int = 42) -> None:
    set_seed(seed)
    device = torch.device("cpu")  # Calibrate easily on CPU

    best_pt = run_dir / "best.pt"
    if not best_pt.exists():
        raise FileNotFoundError(f"Checkpoint not found: {best_pt}")

    checkpoint = torch.load(best_pt, map_location=device)
    arch = checkpoint.get("arch", "mnv3_large")

    model = build_model(arch, num_classes=len(CLASS_KEYS), pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Load validation split
    val_dataset = RiceLeafDataset(
        data_root=str(data_root),
        splits_csv=str(splits_csv),
        split="val",
        transform=get_eval_transforms(),
    )
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

    print(f"Collecting validation logits for {len(val_dataset)} images...")
    logits_list = []
    labels_list = []

    with torch.no_grad():
        for images, labels, _ in val_loader:
            images = images.to(device)
            logits = model(images)
            logits_list.append(logits)
            labels_list.append(labels)

    val_logits = torch.cat(logits_list, dim=0)
    val_labels = torch.cat(labels_list, dim=0)

    # 1. Temperature scaling via LBFGS on NLL
    temperature = nn.Parameter(torch.ones(1) * 1.5)
    nll_criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.LBFGS([temperature], lr=0.01, max_iter=50)

    def eval_loss():
        optimizer.zero_grad()
        loss = nll_criterion(val_logits / temperature, val_labels)
        loss.backward()
        return loss

    optimizer.step(eval_loss)
    opt_temp = float(torch.clamp(temperature, min=0.05, max=5.0).item())
    print(f"Optimised temperature T = {opt_temp:.4f}")

    # Probabilities before and after
    probs_before = torch.softmax(val_logits, dim=1).numpy()
    probs_after = torch.softmax(val_logits / opt_temp, dim=1).numpy()
    labels_np = val_labels.numpy()

    ece_before, _, _, _ = compute_ece(probs_before, labels_np)
    ece_after, bin_accs, bin_confs, _ = compute_ece(probs_after, labels_np)
    print(f"Validation ECE before: {ece_before:.4f} -> after: {ece_after:.4f}")

    # 2. Threshold selection for target precision
    max_probs = np.max(probs_after, axis=1)
    preds = np.argmax(probs_after, axis=1)

    threshold_candidates = np.linspace(0.40, 0.99, 60)
    selected_threshold = None
    best_cov = 0.0
    best_acc = 0.0
    warning_msg = None

    for th in threshold_candidates:
        accepted = max_probs >= th
        if np.sum(accepted) == 0:
            continue
        prec = float(np.mean(preds[accepted] == labels_np[accepted]))
        cov = float(np.mean(accepted))

        if prec >= target_precision:
            selected_threshold = float(th)
            best_cov = cov
            best_acc = prec
            break

    if selected_threshold is None:
        # Fall back to threshold maximizing precision
        precisions = [
            float(np.mean(preds[max_probs >= th] == labels_np[max_probs >= th]))
            if np.sum(max_probs >= th) > 0 else 0.0
            for th in threshold_candidates
        ]
        best_idx = int(np.argmax(precisions))
        selected_threshold = float(threshold_candidates[best_idx])
        accepted = max_probs >= selected_threshold
        best_cov = float(np.mean(accepted)) if np.sum(accepted) > 0 else 0.0
        best_acc = float(precisions[best_idx])
        warning_msg = (
            f"Validation precision did not reach target {target_precision:.2f}. "
            f"Fell back to best threshold {selected_threshold:.2f} with precision {best_acc:.2f}."
        )
        print(f"Warning: {warning_msg}")

    print(
        f"Selected threshold t = {selected_threshold:.4f} "
        f"(coverage: {best_cov:.2%}, selective accuracy: {best_acc:.2%})"
    )

    # 3. Write calibration.json
    calib_dict: Dict = {
        "temperature": round(opt_temp, 4),
        "threshold": round(selected_threshold, 4),
        "target_precision": float(target_precision),
        "val_coverage": round(best_cov, 4),
        "val_selective_accuracy": round(best_acc, 4),
        "ece_before": round(ece_before, 4),
        "ece_after": round(ece_after, 4),
    }
    if warning_msg:
        calib_dict["warning"] = warning_msg

    calib_path = run_dir / "calibration.json"
    with open(calib_path, "w", encoding="utf-8") as f:
        json.dump(calib_dict, f, indent=2)
    print(f"Saved calibration config to {calib_path}")

    # 4. Save reliability diagram
    plt.figure(figsize=(6, 5))
    plt.plot([0, 1], [0, 1], "k--", label="Perfect Calibration")
    plt.plot(bin_confs, bin_accs, "s-", color="#16a34a", label=f"Calibrated (ECE={ece_after:.3f})")
    plt.xlabel("Confidence")
    plt.ylabel("Accuracy")
    plt.title(f"Reliability Diagram (Validation, T={opt_temp:.2f})")
    plt.legend()
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()

    fig_path = run_dir / "reliability_val.png"
    plt.savefig(fig_path, dpi=150)
    plt.close()
    print(f"Saved reliability diagram to {fig_path}")


def main():
    parser = argparse.ArgumentParser(description="Calibrate temperature and confidence threshold")
    parser.add_argument("--run", type=Path, required=True, help="Directory containing best.pt")
    parser.add_argument("--data-root", type=Path, required=True, help="Root folder of image dataset")
    parser.add_argument("--splits", type=Path, required=True, help="Path to splits.csv")
    parser.add_argument("--target-precision", type=float, default=0.90, help="Target precision on accepted predictions")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    calibrate(
        run_dir=args.run,
        data_root=args.data_root,
        splits_csv=args.splits,
        target_precision=args.target_precision,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
