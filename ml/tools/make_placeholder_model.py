#!/usr/bin/env python3
"""
Generate a lightweight placeholder MobileNetV3-Small ONNX model with the exact
production I/O contract for frontend development and offline browser testing.
"""

import json
import os
import sys
from pathlib import Path

import onnx
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small

# Set fixed seed for reproducibility
torch.manual_seed(42)

CLASS_KEYS = [
    "healthy",
    "blast",
    "brown_spot",
    "leaf_smut",
    "tungro",
    "sheath_blight",
]

PREPROCESS_CONFIG = {
    "resize_shorter": 256,
    "crop": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "color": "RGB",
    "layout": "NCHW",
}


def make_placeholder(
    output_model_path: Path,
    output_data_dir: Path,
) -> None:
    output_model_path.parent.mkdir(parents=True, exist_ok=True)
    output_data_dir.mkdir(parents=True, exist_ok=True)

    print("Building placeholder MobileNetV3-Small model...")
    model = mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(CLASS_KEYS))
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    print(f"Exporting ONNX model to {output_model_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        str(output_model_path),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes=None,  # Fixed shape [1,3,224,224] per contract
        dynamo=False,
    )

    # Validate ONNX structure
    onnx_model = onnx.load(str(output_model_path))
    onnx.checker.check_model(onnx_model)
    file_bytes = os.path.getsize(output_model_path)
    file_mb = file_bytes / (1024 * 1024)
    print(f"Exported placeholder model size: {file_mb:.2f} MiB ({file_bytes:,} bytes)")

    # Write class_index.json
    class_index_path = output_data_dir / "class_index.json"
    with open(class_index_path, "w", encoding="utf-8") as f:
        json.dump({"classes": CLASS_KEYS, "version": "v1"}, f, indent=2)
    print(f"Wrote {class_index_path}")

    # Write preprocess.json
    preprocess_path = output_data_dir / "preprocess.json"
    with open(preprocess_path, "w", encoding="utf-8") as f:
        json.dump(PREPROCESS_CONFIG, f, indent=2)
    print(f"Wrote {preprocess_path}")

    # Write calibration.json
    calib_path = output_data_dir / "calibration.json"
    calib_data = {
        "temperature": 1.0,
        "threshold": 0.6,
        "target_precision": 0.90,
        "placeholder": True,
        "warning": "Demo model — not trained yet",
    }
    with open(calib_path, "w", encoding="utf-8") as f:
        json.dump(calib_data, f, indent=2)
    print(f"Wrote {calib_path}")


def main():
    root = Path(__file__).resolve().parent.parent.parent
    model_path = root / "frontend" / "public" / "models" / "rice-placeholder.onnx"
    data_dir = root / "frontend" / "public" / "data"
    make_placeholder(model_path, data_dir)


if __name__ == "__main__":
    main()
