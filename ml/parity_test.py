#!/usr/bin/env python3
"""
Verify numerical parity between PyTorch and ONNX Runtime logits on validation images.
Ensures max absolute difference is < 1e-3, outputs parity_samples.json for browser
verification tests, and copies sample images to <run>/samples/.
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

from common import (
    CLASS_KEYS,
    RiceLeafDataset,
    get_eval_transforms,
)
from train import build_model


def run_parity_test(run_dir: Path, data_root: Path, splits_csv: Path, max_samples: int = 20) -> None:
    best_pt = run_dir / "best.pt"
    onnx_file = run_dir / "model.onnx"

    if not best_pt.exists():
        raise FileNotFoundError(f"Checkpoint not found: {best_pt}")
    if not onnx_file.exists():
        raise FileNotFoundError(f"ONNX model not found: {onnx_file}")

    # Load temperature
    temp = 1.0
    calib_path = run_dir / "calibration.json"
    if calib_path.exists():
        with open(calib_path, "r", encoding="utf-8") as f:
            calib = json.load(f)
            temp = float(calib.get("temperature", 1.0))

    # Load PyTorch model
    checkpoint = torch.load(best_pt, map_location="cpu")
    arch = checkpoint.get("arch", "mnv3_large")
    pt_model = build_model(arch, num_classes=len(CLASS_KEYS), pretrained=False)
    pt_model.load_state_dict(checkpoint["model_state_dict"])
    pt_model.eval()

    # Load ONNX Runtime session
    ort_session = ort.InferenceSession(str(onnx_file), providers=["CPUExecutionProvider"])

    # Load validation dataset
    val_dataset = RiceLeafDataset(
        data_root=str(data_root),
        splits_csv=str(splits_csv),
        split="val",
        transform=get_eval_transforms(),
    )

    n_test = min(len(val_dataset), max_samples)
    if n_test == 0:
        raise ValueError("No validation samples available to test parity.")

    print(f"Testing parity on {n_test} validation images (arch: {arch}, temp: {temp:.4f})...")

    max_observed_diff = 0.0
    samples_dir = run_dir / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    sample_records = []

    for idx in range(n_test):
        tensor, label_idx, rel_path = val_dataset[idx]
        input_tensor = tensor.unsqueeze(0)

        # PyTorch forward
        with torch.no_grad():
            pt_logits = pt_model(input_tensor).numpy()[0]

        # ORT forward
        ort_inputs = {ort_session.get_inputs()[0].name: input_tensor.numpy()}
        ort_logits = ort_session.run(None, ort_inputs)[0][0]

        diff = float(np.max(np.abs(pt_logits - ort_logits)))
        if diff > max_observed_diff:
            max_observed_diff = diff

        if diff >= 1e-3:
            sys.stderr.write(
                f"\nERROR: Parity check failed on image '{rel_path}'!\n"
                f"Max absolute diff: {diff:.6f} >= 1e-3\n"
                f"PyTorch logits: {pt_logits.tolist()}\n"
                f"ONNX logits:    {ort_logits.tolist()}\n"
            )
            sys.exit(1)

        # Collect top 5 samples for frontend verification
        if idx < 5:
            # Scaled probabilities
            scaled_logits = pt_logits / temp
            exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
            probs = exp_logits / np.sum(exp_logits)
            pred_class = CLASS_KEYS[int(np.argmax(probs))]

            sample_filename = Path(rel_path).name
            sample_dest = samples_dir / sample_filename
            src_full_path = data_root / rel_path
            shutil.copy2(src_full_path, sample_dest)

            sample_records.append(
                {
                    "filename": sample_filename,
                    "rel_path": rel_path,
                    "preprocessed_first_10": [round(float(v), 6) for v in tensor.flatten()[:10]],
                    "expected_probabilities": [round(float(p), 6) for p in probs],
                    "predicted_class": pred_class,
                }
            )

    print(f"Parity test PASSED across {n_test} samples. Max absolute difference: {max_observed_diff:.6e} (< 1e-3).")

    # Save parity_samples.json
    parity_json_path = run_dir / "parity_samples.json"
    with open(parity_json_path, "w", encoding="utf-8") as f:
        json.dump(sample_records, f, indent=2)
    print(f"Saved {len(sample_records)} parity verification samples to {parity_json_path}")
    print(f"Copied sample images to {samples_dir}")


def main():
    parser = argparse.ArgumentParser(description="Test numerical parity between PyTorch and ONNX")
    parser.add_argument("--run", type=Path, required=True, help="Directory containing best.pt and model.onnx")
    parser.add_argument("--data-root", type=Path, required=True, help="Root folder of image dataset")
    parser.add_argument("--splits", type=Path, required=True, help="Path to splits.csv")
    parser.add_argument("--samples", type=int, default=20, help="Number of validation images to test")
    args = parser.parse_args()

    run_parity_test(
        run_dir=args.run,
        data_root=args.data_root,
        splits_csv=args.splits,
        max_samples=args.samples,
    )


if __name__ == "__main__":
    main()
