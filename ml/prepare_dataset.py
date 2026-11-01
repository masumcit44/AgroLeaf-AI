#!/usr/bin/env python3
"""One-command local preparation of the rice-leaf training data.

Finds the folder that directly contains the six RiceLeafDiseaseBD v3 class
folders, then runs the existing audit, split and resize scripts and builds a
Kaggle-ready zip. The raw dataset is never modified.

Usage:
    python ml/prepare_dataset.py --raw "D:\\...\\RiceLeafDiseaseBD_v3" \
        --work "D:\\...\\datasets_work" --phash-dist 6
"""

import argparse
import csv
import json
import re
import shutil
import subprocess
import sys
import zipfile
from collections import Counter
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
REPO_ROOT = ML_DIR.parent
DATASET_KEY = "rice_leaf_disease_bd_v3"
RESIZED_DIR_NAME = "RiceLeafDiseaseBD_v3_320"
ZIP_NAME = "kaggle_upload.zip"
MAX_SEARCH_DEPTH = 3


def load_expected_classes(class_map_path):
    with open(class_map_path, "r", encoding="utf-8") as f:
        class_map = json.load(f)
    if DATASET_KEY not in class_map:
        raise SystemExit(f"ERROR: '{DATASET_KEY}' missing from {class_map_path}")
    return sorted(k for k in class_map[DATASET_KEY] if not k.startswith("__"))


def find_class_root(raw_root, expected_classes, max_depth=MAX_SEARCH_DEPTH):
    """Return folders (up to max_depth below raw_root) whose direct children include all classes."""
    expected = set(expected_classes)
    candidates = []

    def walk(path, depth):
        try:
            subdirs = sorted((p for p in path.iterdir() if p.is_dir()), key=lambda p: p.name.lower())
        except OSError:
            return
        if expected.issubset({p.name for p in subdirs}):
            candidates.append((depth, path))
        if depth < max_depth:
            for sub in subdirs:
                walk(sub, depth + 1)

    walk(raw_root, 0)
    return candidates


def print_tree(root, max_depth=2):
    def walk(path, prefix, depth):
        try:
            entries = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        except OSError as exc:
            print(f"{prefix}[unreadable: {exc}]")
            return
        dirs = [p for p in entries if p.is_dir()]
        files = [p for p in entries if p.is_file()]
        for d in dirs:
            print(f"{prefix}{d.name}/")
            if depth < max_depth:
                walk(d, prefix + "  ", depth + 1)
        if depth == 0 and files:
            print(f"{prefix}({len(files)} file(s) directly here)")

    print(f"Folder tree of {root} (2 levels):")
    walk(root, "  ", 0)


def run_step(label, cmd):
    print(f"\n=== {label} ===")
    print("$ " + " ".join(str(c) for c in cmd))
    proc = subprocess.run(cmd, cwd=str(REPO_ROOT), text=True, capture_output=True)
    if proc.stdout:
        print(proc.stdout.rstrip())
    if proc.stderr:
        print(proc.stderr.rstrip(), file=sys.stderr)
    return proc


def count_csv_rows(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        return sum(1 for _ in csv.DictReader(f))


def class_counts(splits_csv):
    counts = Counter()
    with open(splits_csv, "r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            counts[row["class_key"]] += 1
    return counts


def largest_group_from_summary(summary_path):
    if not summary_path.exists():
        return None
    text = summary_path.read_text(encoding="utf-8")
    match = re.search(r"Largest group size:\s*(\d+)", text)
    return int(match.group(1)) if match else None


def build_zip(work_dir, resized_dir, splits_csv, zip_path):
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(resized_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(work_dir))
        zf.write(splits_csv, "splits.csv")


def main():
    parser = argparse.ArgumentParser(description="Prepare the rice-leaf dataset for Kaggle upload")
    parser.add_argument("--raw", type=Path, required=True, help="Downloaded raw dataset folder")
    parser.add_argument("--work", type=Path, required=True, help="Output work folder")
    parser.add_argument("--phash-dist", type=int, default=6, help="Perceptual-hash distance for duplicate groups (default: 6)")
    parser.add_argument("--data-dir", type=Path, default=REPO_ROOT / "data",
                        help="Where audit_output/ and splits.csv are written (default: <repo>/data; override for smoke tests)")
    args = parser.parse_args()

    raw_root = args.raw.resolve()
    work_dir = args.work.resolve()
    data_dir = args.data_dir.resolve()

    if not raw_root.is_dir():
        raise SystemExit(f"ERROR: --raw is not a directory: {raw_root}")
    if work_dir == raw_root or work_dir.is_relative_to(raw_root):
        raise SystemExit(f"ERROR: --work must be outside --raw (raw is read-only): {work_dir}")
    if data_dir == raw_root or data_dir.is_relative_to(raw_root):
        raise SystemExit(f"ERROR: --data-dir must be outside --raw (raw is read-only): {data_dir}")

    class_map_path = ML_DIR / "class_map.json"
    expected_classes = load_expected_classes(class_map_path)

    candidates = find_class_root(raw_root, expected_classes)
    if not candidates:
        print(f"ERROR: no folder within {MAX_SEARCH_DEPTH} level(s) of {raw_root} contains all expected class folders.")
        print(f"Expected class folders: {', '.join(expected_classes)}")
        print_tree(raw_root)
        sys.exit(1)
    if len(candidates) > 1:
        print("ERROR: more than one candidate class root found:")
        for depth, path in candidates:
            print(f"  (depth {depth}) {path}")
        print("Keep only one copy of the dataset and retry.")
        sys.exit(1)

    class_root = candidates[0][1]
    print(f"Class root found at depth {candidates[0][0]}: {class_root}")

    audit_dir = data_dir / "audit_output"
    splits_csv = data_dir / "splits.csv"
    summary_path = data_dir / "split_summary.md"
    exclusions_csv = data_dir / "exclusions.csv"

    proc = run_step(
        "1/5 Audit dataset",
        [sys.executable, str(ML_DIR / "audit_dataset.py"), str(class_root),
         "--out", str(audit_dir), "--phash-dist", str(args.phash_dist)],
    )
    if proc.returncode != 0:
        print("ERROR: audit_dataset.py failed.", file=sys.stderr)
        sys.exit(proc.returncode)

    proc = run_step(
        "2/5 Create leakage-safe splits",
        [sys.executable, str(ML_DIR / "make_splits.py"),
         "--images", str(audit_dir / "images.csv"),
         "--class-map", str(class_map_path),
         "--dataset", DATASET_KEY,
         "--out-dir", str(data_dir)],
    )
    if proc.returncode != 0:
        guard_failed = any(
            token in (proc.stderr or "")
            for token in ("Largest perceptual hash group", "exceed allowed threshold")
        )
        if guard_failed:
            print(
                "\nThe split guard failed. Re-run with --phash-dist 4:\n"
                f'  python ml/prepare_dataset.py --raw "{args.raw}" --work "{args.work}" --phash-dist 4',
                file=sys.stderr,
            )
        else:
            print("ERROR: make_splits.py failed (see output above).", file=sys.stderr)
        sys.exit(proc.returncode)

    resized_dir = work_dir / RESIZED_DIR_NAME
    if resized_dir.exists():
        shutil.rmtree(resized_dir)
    proc = run_step(
        "3/5 Resize images to 320 px",
        [sys.executable, str(ML_DIR / "resize_for_upload.py"),
         "--src", str(class_root), "--out", str(resized_dir), "--size", "320", "--quality", "92"],
    )
    if proc.returncode != 0:
        print("ERROR: resize_for_upload.py failed.", file=sys.stderr)
        sys.exit(proc.returncode)

    work_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(splits_csv, work_dir / "splits.csv")
    zip_path = work_dir / ZIP_NAME
    print(f"\n=== 4/5 Build {zip_path.name} ===")
    build_zip(work_dir, resized_dir, work_dir / "splits.csv", zip_path)

    counts = class_counts(splits_csv)
    exclusions = count_csv_rows(exclusions_csv) if exclusions_csv.exists() else 0
    total = sum(counts.values())
    largest_group = largest_group_from_summary(summary_path)
    zip_mb = zip_path.stat().st_size / (1024 * 1024)

    print("\n=== 5/5 Summary ===")
    print(f"Retained images: {total}")
    print("Images per class (retained):")
    for name, n in sorted(counts.items()):
        print(f"  {name}: {n}")
    print(f"Exclusions: {exclusions}")
    print(f"Largest perceptual-hash group: {largest_group if largest_group is not None else 'unknown'}")
    print(f"Zip: {zip_path} ({zip_mb:.2f} MB)")
    print("\nNext step: upload kaggle_upload.zip as a private Kaggle Dataset named riceleafdiseasebd-v3-320")


if __name__ == "__main__":
    main()
