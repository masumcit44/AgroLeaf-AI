#!/usr/bin/env python3
"""
Export PyTorch MobileNetV3 checkpoint to ONNX format.
Enforces: opset 17, input 'input' [1,3,224,224], output 'logits' [1,6],
validation via onnx.checker, and hard failure if file >= 24 MiB.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import onnx
import torch

from common import CLASS_KEYS
from train import build_model

MAX_ALLOWED_BYTES = 24 * 1024 * 1024  # 24 MiB strict ceiling for Cloudflare Pages (< 25 MiB limit)


def export_onnx(run_dir: Path, output_file: Path) -> None:
    best_pt = run_dir / "best.pt"
    if not best_pt.exists():
        raise FileNotFoundError(f"Checkpoint not found: {best_pt}")

    checkpoint = torch.load(best_pt, map_location="cpu")
    arch = checkpoint.get("arch", "mnv3_large")
    num_classes = len(CLASS_KEYS)

    model = build_model(arch, num_classes=num_classes, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    print(f"Exporting {arch} checkpoint to ONNX: {output_file}")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Export to ONNX
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(output_file),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes=None,  # Fixed shape [1,3,224,224] per contract
        )
    except Exception as e:
        print(f"Standard export failed ({e}); falling back to dynamo=False...")
        torch.onnx.export(
            model,
            dummy_input,
            str(output_file),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes=None,
            dynamo=False,
        )

    # Validate ONNX model with onnx.checker
    onnx_model = onnx.load(str(output_file))
    onnx.checker.check_model(onnx_model)
    print("ONNX model structure verified via onnx.checker.check_model().")

    # Check file size
    file_bytes = os.path.getsize(output_file)
    file_mb = file_bytes / (1024 * 1024)
    print(f"Exported ONNX file size: {file_mb:.2f} MiB ({file_bytes:,} bytes)")

    if file_bytes >= MAX_ALLOWED_BYTES:
        sys.stderr.write(
            f"\nERROR: Exported ONNX file size ({file_mb:.2f} MiB) exceeds the 24 MiB limit!\n"
            f"Cloudflare Pages has a strict 25 MiB asset limit. Consider MobileNetV3-Small.\n"
        )
        sys.exit(1)

    print("File size check passed: < 24 MiB.")

    # Update metrics-v1.json if it exists
    metrics_path = run_dir / "metrics-v1.json"
    if metrics_path.exists():
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["model"]["onnx_mb"] = round(file_mb, 2)
            with open(metrics_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Updated onnx_mb in {metrics_path}")
        except Exception as e:
            print(f"Could not update metrics file: {e}")


def main():
    parser = argparse.ArgumentParser(description="Export trained PyTorch model to ONNX")
    parser.add_argument("--run", type=Path, required=True, help="Directory containing best.pt")
    parser.add_argument("--out", type=Path, default=None, help="Output ONNX file path (default: <run>/model.onnx)")
    args = parser.parse_args()

    out_file = args.out or (args.run / "model.onnx")
    export_onnx(args.run, out_file)


if __name__ == "__main__":
    main()
