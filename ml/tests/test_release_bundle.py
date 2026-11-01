#!/usr/bin/env python3
"""Smoke test for ml/tools/make_release_bundle.py.

Run from anywhere:
    python ml/tests/test_release_bundle.py

Builds a synthetic run folder (tiny valid ONNX + FIXTURE_NOT_REAL metrics),
points --repo at a temporary repo copy, and checks that validation failures copy
nothing.
"""

import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import warnings
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "ml" / "tools" / "make_release_bundle.py"

CLASS_KEYS = [
    "healthy",
    "blast",
    "brown_spot",
    "leaf_smut",
    "tungro",
    "sheath_blight",
]
PREPROCESS = {
    "resize_shorter": 256,
    "crop": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "color": "RGB",
    "layout": "NCHW",
}
CONFIG_TEXT = "export const MODEL_URL = '/models/rice-placeholder.onnx';\n"


def write_tiny_onnx(path):
    """Export a tiny model with the same torch.onnx.export settings as the placeholder."""
    import torch
    import torch.nn as nn

    class Tiny(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc = nn.Linear(3, 6)

        def forward(self, x):
            return self.fc(x.mean(dim=(2, 3)))

    torch.manual_seed(42)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        torch.onnx.export(
            Tiny().eval(),
            torch.randn(1, 3, 224, 224, dtype=torch.float32),
            str(path),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["logits"],
            dynamic_axes=None,
            dynamo=False,
        )
    with open(path, "rb") as handle:
        assert handle.read(1) == b"\x08", "test ONNX must start with 0x08"


def metrics_fixture():
    per_class = {
        key: {"precision": 0.9, "recall": 0.9, "f1": 0.9, "support": 100}
        for key in CLASS_KEYS
    }
    return {
        "model": {
            "arch": "mnv3_large",
            "onnx_mb": 0.01,
            "trained_on": "RiceLeafDiseaseBD v3 (DOI 10.17632/86s4jzj2m4.3)",
            "date": "2026-11-01",
            "FIXTURE_NOT_REAL": True,
        },
        "calibration": {
            "temperature": 1.2,
            "threshold": 0.6,
            "target_precision": 0.9,
            "warning": "Fixture warning: not a real calibration.",
        },
        "internal_test": {
            "n": 120,
            "accuracy": 0.9,
            "macro_f1": 0.89,
            "coverage": 0.8,
            "selective_accuracy": 0.95,
            "ece_after": 0.04,
            "per_class": per_class,
        },
        "external": [
            {
                "name": "Synthetic external",
                "doi": "10.0000/fixture",
                "classes_tested": ["blast", "healthy"],
                "n": 40,
                "accuracy_mapped": 0.7,
                "macro_f1_mapped": 0.68,
                "coverage": 0.6,
                "selective_accuracy": 0.85,
                "unseen_rejection_rate": 0.5,
                "per_class": {
                    "blast": {"precision": 0.7, "recall": 0.7, "f1": 0.7, "support": 20}
                },
            }
        ],
        "limitations": ["FIXTURE_NOT_REAL: synthetic test data only."],
    }


def make_run_folder(root):
    root.mkdir(parents=True, exist_ok=True)
    write_tiny_onnx(root / "model.onnx")
    (root / "class_index.json").write_text(
        json.dumps({"classes": CLASS_KEYS, "version": "v1"}, indent=2), encoding="utf-8"
    )
    (root / "preprocess.json").write_text(json.dumps(PREPROCESS, indent=2), encoding="utf-8")
    (root / "calibration.json").write_text(
        json.dumps({"temperature": 1.2, "threshold": 0.6, "target_precision": 0.9}, indent=2),
        encoding="utf-8",
    )
    metrics = metrics_fixture()
    (root / "metrics-v1.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (root / "parity_samples.json").write_text(
        json.dumps(
            [
                {
                    "filename": "fixture.jpg",
                    "rel_path": "Blast/fixture.jpg",
                    "preprocessed_first_10": [0.0] * 10,
                    "expected_probabilities": [0.1] * 6,
                    "predicted_class": "blast",
                    "FIXTURE_NOT_REAL": True,
                }
            ],
            indent=2,
        ),
        encoding="utf-8",
    )
    (root / "confusion_internal.png").write_bytes(b"\x89PNG\r\n\x1a\nFIXTURE")
    (root / "reliability_val.png").write_bytes(b"\x89PNG\r\n\x1a\nFIXTURE")
    return metrics


def make_repo(root):
    for rel in (
        "frontend/public/models",
        "frontend/public/data",
        "frontend/public/accuracy",
        "frontend/src/ml",
        "model/experiments/run1",
    ):
        (root / rel).mkdir(parents=True, exist_ok=True)
    (root / "frontend/public/models/rice-placeholder.onnx").write_bytes(b"placeholder")
    (root / "frontend/src/ml/config.js").write_text(CONFIG_TEXT, encoding="utf-8")


def snapshot(root):
    return {
        p.relative_to(root).as_posix(): hashlib.md5(p.read_bytes()).hexdigest()
        for p in sorted(root.rglob("*"))
        if p.is_file()
    }


def run_script(run_path, repo, *extra):
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--run-zip", str(run_path), "--repo", str(repo), *extra],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )


def assert_copied(repo, expected_metrics):
    model_dest = repo / "frontend/public/models/rice-mnv3l-v1.onnx"
    assert model_dest.exists(), "trained ONNX was not copied"
    assert model_dest.read_bytes()[:1] == b"\x08"

    data_dir = repo / "frontend/public/data"
    for name in (
        "class_index.json",
        "preprocess.json",
        "calibration.json",
        "metrics-v1.json",
        "parity_samples.json",
    ):
        assert (data_dir / name).exists(), f"{name} was not copied"

    assert (repo / "frontend/public/accuracy/confusion_internal.png").exists()
    assert (repo / "frontend/public/accuracy/reliability_val.png").exists()
    assert (repo / "model/experiments/run1/metrics-v1.json").exists()
    assert (repo / "model/experiments/run1/confusion_internal.png").exists()

    copied_metrics = json.loads((data_dir / "metrics-v1.json").read_text(encoding="utf-8"))
    assert copied_metrics["external"][0]["name"] == expected_metrics["external"][0]["name"]

    assert (repo / "frontend/public/models/rice-placeholder.onnx").exists(), (
        "the release tool must not delete the placeholder model"
    )
    assert (repo / "frontend/src/ml/config.js").read_text(encoding="utf-8") == CONFIG_TEXT, (
        "the release tool must not edit config.js"
    )


def main():
    with tempfile.TemporaryDirectory(prefix="agroleaf_bundle_test_") as temp:
        temp = Path(temp)
        run_dir = temp / "run1"
        metrics = make_run_folder(run_dir)
        before = snapshot(run_dir)

        repo = temp / "repo"
        make_repo(repo)
        proc = run_script(run_dir, repo)
        assert proc.returncode == 0, f"good bundle failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        assert "Validation passed" in proc.stdout, proc.stdout
        assert "MEASURED (from metrics-v1.json)" in proc.stdout, proc.stdout
        assert "Fixture warning" in proc.stdout, proc.stdout
        assert "export const MODEL_URL = '/models/rice-mnv3l-v1.onnx';" in proc.stdout
        assert_copied(repo, metrics)
        assert snapshot(run_dir) == before, "the source run folder was modified"

        # Dry run: plan printed, nothing copied.
        dry_repo = temp / "dry_repo"
        make_repo(dry_repo)
        dry = run_script(run_dir, dry_repo, "--dry-run")
        assert dry.returncode == 0, f"dry run failed:\n{dry.stdout}\n{dry.stderr}"
        assert "DRY RUN" in dry.stdout, dry.stdout
        assert not (dry_repo / "frontend/public/models/rice-mnv3l-v1.onnx").exists()
        assert not (dry_repo / "frontend/public/data/class_index.json").exists()

        # Zip input with the notebook's run1/ prefix.
        zip_repo = temp / "zip_repo"
        make_repo(zip_repo)
        zip_path = temp / "run1_for_app.zip"
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for path in sorted(run_dir.rglob("*")):
                if path.is_file():
                    zf.write(path, Path("run1") / path.relative_to(run_dir))
        zipped = run_script(zip_path, zip_repo)
        assert zipped.returncode == 0, f"zip bundle failed:\n{zipped.stdout}\n{zipped.stderr}"
        assert "Extracted run1_for_app.zip" in zipped.stdout
        assert (zip_repo / "frontend/public/models/rice-mnv3l-v1.onnx").exists()

        # Bad class order: fail, report it, copy nothing.
        bad_run = temp / "bad_run"
        shutil.copytree(run_dir, bad_run)
        bad_index = json.loads((bad_run / "class_index.json").read_text(encoding="utf-8"))
        bad_index["classes"][0], bad_index["classes"][1] = bad_index["classes"][1], bad_index["classes"][0]
        (bad_run / "class_index.json").write_text(json.dumps(bad_index), encoding="utf-8")

        bad_repo = temp / "bad_repo"
        make_repo(bad_repo)
        bad = run_script(bad_run, bad_repo)
        assert bad.returncode == 1, f"bad class order should fail:\n{bad.stdout}\n{bad.stderr}"
        assert "class order does not match" in bad.stdout, bad.stdout
        assert "nothing was copied" in bad.stdout, bad.stdout
        assert not (bad_repo / "frontend/public/models/rice-mnv3l-v1.onnx").exists()
        assert not (bad_repo / "frontend/public/data/class_index.json").exists()

        # Several problems are all printed, and still nothing is copied.
        multi_run = temp / "multi_run"
        shutil.copytree(bad_run, multi_run)
        (multi_run / "parity_samples.json").unlink()
        multi_repo = temp / "multi_repo"
        make_repo(multi_repo)
        multi = run_script(multi_run, multi_repo)
        assert multi.returncode == 1
        assert "class order does not match" in multi.stdout
        assert "parity_samples.json: missing" in multi.stdout, multi.stdout
        assert not (multi_repo / "frontend/public/data/metrics-v1.json").exists()

    print("PASS: release bundle validates, copies, dry-runs, and copies nothing on failure.")


if __name__ == "__main__":
    main()
