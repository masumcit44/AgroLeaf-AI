#!/usr/bin/env python3
"""Smoke test for ml/prepare_dataset.py using a nested synthetic dataset.

Run from anywhere:
    python ml/tests/test_prepare_dataset.py
"""

import hashlib
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
ML_DIR = REPO_ROOT / "ml"
TOY_DIR = ML_DIR / "toy_data"
NESTED = TOY_DIR / "nested"
WORK = TOY_DIR / "work"
DATA_DIR = TOY_DIR / "data"

EXPECTED_CLASSES = {
    "Healthy",
    "Blast",
    "Brown Spot",
    "Leaf Smut",
    "Rice Tungro",
    "Sheath Blight",
}


def snapshot(root):
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            result[path.relative_to(root).as_posix()] = hashlib.md5(path.read_bytes()).hexdigest()
    return result


def main():
    for folder in (NESTED, WORK, DATA_DIR):
        if folder.exists():
            shutil.rmtree(folder)

    subprocess.run(
        [sys.executable, str(ML_DIR / "tests" / "make_toy_dataset.py"),
         "--out", str(NESTED / "extra" / "raw")],
        check=True,
        cwd=str(REPO_ROOT),
    )

    raw_class_root = NESTED / "extra" / "raw"
    before = snapshot(NESTED)
    assert len(before) == 72, f"expected 72 toy files, found {len(before)}"

    proc = subprocess.run(
        [sys.executable, str(ML_DIR / "prepare_dataset.py"),
         "--raw", str(NESTED),
         "--work", str(WORK),
         "--data-dir", str(DATA_DIR)],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    assert proc.returncode == 0, f"prepare_dataset failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"

    assert f"Class root found" in proc.stdout, proc.stdout
    assert str(raw_class_root) in proc.stdout, "nested class root was not reported"
    assert "upload kaggle_upload.zip as a private Kaggle Dataset named riceleafdiseasebd-v3-320" in proc.stdout

    after = snapshot(NESTED)
    assert before == after, "raw dataset was modified"

    assert (DATA_DIR / "audit_output" / "images.csv").exists()
    assert (DATA_DIR / "splits.csv").exists()
    assert (DATA_DIR / "split_summary.md").exists()

    zip_path = WORK / "kaggle_upload.zip"
    assert zip_path.exists(), "kaggle_upload.zip missing"
    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
    assert "splits.csv" in names
    image_names = [n for n in names if n.lower().endswith(".jpg")]
    assert len(image_names) == 72, f"expected 72 resized images in zip, found {len(image_names)}"
    for name in image_names:
        assert name.startswith("RiceLeafDiseaseBD_v3_320/"), name
        assert name.split("/")[1] in EXPECTED_CLASSES, name

    with zipfile.ZipFile(zip_path) as zf:
        with zf.open(image_names[0]) as fh:
            with Image.open(fh) as img:
                assert img.size == (320, 320), f"expected 320x320, got {img.size}"

    assert (WORK / "splits.csv").exists(), "splits.csv was not copied into the work folder"

    inside_raw = subprocess.run(
        [sys.executable, str(ML_DIR / "prepare_dataset.py"),
         "--raw", str(NESTED),
         "--work", str(raw_class_root / "work"),
         "--data-dir", str(DATA_DIR)],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    assert inside_raw.returncode != 0, "prepare_dataset must refuse a work folder inside --raw"
    assert "--work must be outside --raw" in (inside_raw.stdout + inside_raw.stderr)

    print("PASS: prepare_dataset.py found the nested classes, kept raw intact, and built the zip.")


if __name__ == "__main__":
    main()
