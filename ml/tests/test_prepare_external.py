#!/usr/bin/env python3
"""Smoke test for ml/prepare_external.py (CSV layout).

Run from anywhere:
    python ml/tests/test_prepare_external.py
"""

import csv
import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
ML_DIR = REPO_ROOT / "ml"
TOY_DIR = ML_DIR / "toy_data" / "external_csv"
OUT_DIR = ML_DIR / "toy_data" / "external_out"
MAP_PATH = ML_DIR / "external_maps" / "riceleafbd_sylhet.json"
BD5_MAP_PATH = ML_DIR / "external_maps" / "riceleafdisease_bd5.json"
FOLDERS_DIR = ML_DIR / "toy_data" / "external_folders"
FOLDERS_OUT = ML_DIR / "toy_data" / "external_folders_out"
BD5_LABELS = ["Normal Leaf", "Blast", "Sheath Blight", "Tungro", "Narrow Brown Spot"]

ROWS = [
    ("Healthy", 2),
    ("Brown Spot", 2),
    ("Tungro Virus", 2),
    ("Bacterial Leaf Blight", 2),
    ("Leaf Rust", 2),
]


def snapshot(root):
    return {
        p.relative_to(root).as_posix(): hashlib.md5(p.read_bytes()).hexdigest()
        for p in sorted(root.rglob("*"))
        if p.is_file()
    }


def main():
    if TOY_DIR.exists():
        shutil.rmtree(TOY_DIR)
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    images_dir = TOY_DIR / "images"
    images_dir.mkdir(parents=True)
    rng = np.random.RandomState(7)
    rows = []
    for label, count in ROWS:
        for i in range(count):
            name = f"{label.replace(' ', '_').lower()}_{i}.jpg"
            arr = rng.randint(0, 255, size=(300, 400, 3), dtype=np.uint8)
            Image.fromarray(arr).save(images_dir / name, format="JPEG", quality=90)
            rows.append({"image": f"images/{name}", "label": label})

    csv_path = TOY_DIR / "labels.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["image", "label"])
        writer.writeheader()
        writer.writerows(rows)

    before = snapshot(TOY_DIR)

    proc = subprocess.run(
        [sys.executable, str(ML_DIR / "prepare_external.py"),
         "--layout", "csv",
         "--csv", str(csv_path),
         "--image-col", "image",
         "--label-col", "label",
         "--out", str(OUT_DIR),
         "--map", str(MAP_PATH)],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    assert proc.returncode == 0, f"prepare_external failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"

    for label in ("Healthy", "Brown Spot", "Tungro Virus", "Bacterial Leaf Blight"):
        copied = sorted((OUT_DIR / label).glob("*.jpg"))
        assert len(copied) == 2, f"{label}: expected 2 images, found {len(copied)}"
        with Image.open(copied[0]) as img:
            assert img.size == (320, 320), f"{label}: expected 320x320, got {img.size}"

    assert not (OUT_DIR / "Leaf Rust").exists(), "unmapped label must not be copied"
    assert "Leaf Rust" in proc.stdout and "not in map" in proc.stdout, proc.stdout

    provenance = (OUT_DIR / "PROVENANCE.md").read_text(encoding="utf-8")
    assert "10.17632/kx9rx8p2mz.1" in provenance
    assert str(csv_path) in provenance
    assert "Bacterial Leaf Blight" in provenance

    after = snapshot(TOY_DIR)
    assert before == after, "source files were moved or modified"

    if FOLDERS_DIR.exists():
        shutil.rmtree(FOLDERS_DIR)
    if FOLDERS_OUT.exists():
        shutil.rmtree(FOLDERS_OUT)
    class_root = FOLDERS_DIR / "nested" / "extra" / "RiceLeafDisease-BD5"
    for label in BD5_LABELS + ["Unknown Disease"]:
        (class_root / label).mkdir(parents=True)
        Image.fromarray(rng.randint(0, 255, size=(300, 400, 3), dtype=np.uint8)).save(
            class_root / label / "photo.jpg", format="JPEG", quality=90
        )
    folder_before = snapshot(FOLDERS_DIR)

    proc = subprocess.run(
        [sys.executable, str(ML_DIR / "prepare_external.py"),
         "--layout", "folders",
         "--raw", str(FOLDERS_DIR),
         "--out", str(FOLDERS_OUT),
         "--map", str(BD5_MAP_PATH)],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    assert proc.returncode == 0, f"folders mode failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
    assert "Class root found" in proc.stdout
    for label in BD5_LABELS:
        copied = sorted((FOLDERS_OUT / label).glob("*.jpg"))
        assert len(copied) == 1, f"{label}: expected 1 image, found {len(copied)}"
        with Image.open(copied[0]) as img:
            assert img.size == (320, 320)
    assert not (FOLDERS_OUT / "Unknown Disease").exists()
    assert "Unknown Disease" in proc.stdout
    assert folder_before == snapshot(FOLDERS_DIR), "folder-mode source was modified"

    print("PASS: prepare_external.py handled CSV and nested folder layouts, resized images, and warned about unmapped labels.")


if __name__ == "__main__":
    main()
