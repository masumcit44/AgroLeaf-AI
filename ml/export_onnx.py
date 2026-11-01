#!/usr/bin/env python3
"""
Export PyTorch MobileNetV3 checkpoint to ONNX format.
Prefers stable TorchScript exporter (dynamo=False), strictly forbids external data
(ensuring a single self-contained file), validates with onnx.checker, prints opset
and operators, and enforces < 24 MiB size limit for Cloudflare Pages.
"""

import argparse
import glob
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

    # 1. Prefer stable TorchScript-based exporter (dynamo=False) to ensure single-file export
    exported = False
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
            dynamo=False,
        )
        exported = True
        print("Successfully exported via TorchScript exporter (dynamo=False).")
    except Exception as e:
        print(f"TorchScript exporter failed ({e}); falling back to dynamo exporter with external_data=False...")

    if not exported:
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
                dynamic_axes=None,
                external_data=False,
            )
            print("Successfully exported via dynamo exporter.")
        except Exception as e:
            sys.stderr.write(f"\nERROR: Both ONNX export routes failed: {e}\n")
            sys.exit(1)

    # 2. Check for external data files
    data_files = list(output_file.parent.glob("*.data"))
    if data_files:
        sys.stderr.write(
            f"\nERROR: External data file(s) detected: {[p.name for p in data_files]}!\n"
            f"The browser requires a single self-contained ONNX file.\n"
        )
        sys.exit(1)

    # 3. Validate ONNX model with onnx.checker
    onnx_model = onnx.load(str(output_file))
    onnx.checker.check_model(onnx_model)
    print("ONNX model structure verified via onnx.checker.check_model().")

    # 4. Check initializers for external data location
    for init in onnx_model.graph.initializer:
        if init.data_location == onnx.TensorProto.EXTERNAL:
            sys.stderr.write(
                f"\nERROR: Initializer '{init.name}' is stored as EXTERNAL data!\n"
                f"Model must be completely self-contained in a single file.\n"
            )
            sys.exit(1)

    # 5. Print opset version and used operator types
    opset_ver = onnx_model.opset_import[0].version if onnx_model.opset_import else "unknown"
    op_types = sorted(list({node.op_type for node in onnx_model.graph.node}))
    print(f"ONNX Opset version: {opset_ver}")
    print(f"ONNX Operators used ({len(op_types)}): {', '.join(op_types)}")

    # 6. Check file size
    file_bytes = os.path.getsize(output_file)
    file_mb = file_bytes / (1024 * 1024)
    print(f"Exported ONNX file size: {file_mb:.2f} MiB ({file_bytes:,} bytes)")

    if file_bytes >= MAX_ALLOWED_BYTES:
        sys.stderr.write(
            f"\nERROR: Exported ONNX file size ({file_mb:.2f} MiB) exceeds the 24 MiB limit!\n"
            f"Cloudflare Pages has a strict 25 MiB asset limit. Consider MobileNetV3-Small.\n"
        )
        sys.exit(1)

    print("File size check passed: < 24 MiB (single self-contained file).")

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
