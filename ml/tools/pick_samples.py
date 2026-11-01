#!/usr/bin/env python3
"""Pick real, correctly labelled test-split images for the app's sample strip.

Reads ``splits.csv``, chooses images deterministically from ``split == "test"``,
resizes each to 480 px on the long side, writes
``frontend/public/samples/<key>_<n>.jpg`` and a ``manifest.json`` with the
Bangla/English labels from ``disease_knowledge/``. The dataset is only read.

Usage:
    python ml/tools/pick_samples.py --data-root "D:\\...\\RiceLeafDiseaseBD_v3_320"
    python ml/tools/pick_samples.py --data-root "D:\\...\\dataset" \
        --splits data/splits.csv --per-class 1 \
        --classes healthy,blast,brown_spot,tungro --seed 42
"""

import argparse
import csv
import json
import random
import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common import CLASS_KEYS  # noqa: E402

CREDIT = "RiceLeafDiseaseBD v3, CC BY 4.0, DOI 10.17632/86s4jzj2m4.3"
LONG_SIDE = 480
JPEG_QUALITY = 85
DEFAULT_CLASSES = "healthy,blast,brown_spot,tungro"


def load_labels(repo):
    bn_path = repo / "disease_knowledge" / "disease_information_bn.json"
    en_path = repo / "disease_knowledge" / "disease_information_en.json"
    with open(bn_path, "r", encoding="utf-8") as handle:
        bn = json.load(handle)
    with open(en_path, "r", encoding="utf-8") as handle:
        en = json.load(handle)
    labels = {}
    for key in CLASS_KEYS:
        bn_entry = (bn.get("classes") or {}).get(key) or {}
        en_entry = (en.get("classes") or {}).get(key) or {}
        name_bn = bn_entry.get("name_bn")
        name_en = en_entry.get("name_en")
        if not name_bn or not name_en:
            raise ValueError(
                f"disease_knowledge is missing name_bn/name_en for class {key!r}"
            )
        labels[key] = (name_bn, name_en)
    return labels


def parse_classes(raw):
    classes = [part.strip() for part in raw.split(",") if part.strip()]
    if not classes:
        raise ValueError("--classes is empty")
    unknown = [key for key in classes if key not in CLASS_KEYS]
    if unknown:
        raise ValueError(
            f"unknown class key(s) {unknown}; expected one of {CLASS_KEYS}"
        )
    duplicates = sorted({key for key in classes if classes.count(key) > 1})
    if duplicates:
        raise ValueError(f"duplicate class key(s): {duplicates}")
    return classes


def load_test_rows(splits_path, data_root, wanted):
    rows = []
    with open(splits_path, "r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        missing_columns = {"path", "class_key", "split"} - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(
                f"{splits_path} is missing column(s): {sorted(missing_columns)}"
            )
        for row in reader:
            if row.get("split") != "test" or row.get("class_key") not in wanted:
                continue
            path = Path(row["path"])
            full_path = path if path.is_absolute() else data_root / path
            rows.append({"class_key": row["class_key"], "path": path, "full_path": full_path})
    return rows


def resize_long_side(src, dest, long_side=LONG_SIDE, quality=JPEG_QUALITY):
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as image:
        rgb = image.convert("RGB")
        width, height = rgb.size
        if width == 0 or height == 0:
            raise ValueError(f"image has zero size: {src}")
        scale = long_side / max(width, height)
        new_width = max(1, round(width * scale))
        new_height = max(1, round(height * scale))
        if (new_width, new_height) != (width, height):
            rgb = rgb.resize((new_width, new_height), Image.Resampling.LANCZOS)
        rgb.save(dest, format="JPEG", quality=quality)


def pick_samples(data_root, splits_path, repo, per_class, classes, seed):
    data_root = Path(data_root).resolve()
    repo = Path(repo).resolve()
    splits_path = Path(splits_path).resolve()

    try:
        data_root.relative_to(repo)
    except ValueError:
        pass
    else:
        raise ValueError(
            f"--data-root must be outside --repo (refusing to write near the dataset): {data_root}"
        )

    if not data_root.is_dir():
        raise ValueError(f"--data-root is not a directory: {data_root}")
    if not splits_path.is_file():
        raise ValueError(f"--splits file not found: {splits_path}")
    if per_class < 1:
        raise ValueError("--per-class must be at least 1")

    labels = load_labels(repo)
    rows = load_test_rows(splits_path, data_root, set(classes))

    by_class = {key: [] for key in classes}
    for row in rows:
        by_class[row["class_key"]].append(row)

    missing = [row["full_path"] for row in rows if not row["full_path"].is_file()]
    if missing:
        preview = "\n".join(f"  - {path}" for path in missing[:5])
        raise ValueError(
            f"{len(missing)} split image(s) do not exist under --data-root "
            f"({data_root}); is the right dataset selected?\n{preview}"
        )

    rng = random.Random(seed)
    chosen = []
    for key in classes:
        candidates = sorted(by_class[key], key=lambda row: row["path"].as_posix())
        if not candidates:
            raise ValueError(f"no test-split images for class {key!r} in {splits_path}")
        wanted = min(per_class, len(candidates))
        if wanted < per_class:
            print(f"WARNING: only {wanted} test image(s) for {key!r}; wanted {per_class}")
        for index, row in enumerate(rng.sample(candidates, wanted), start=1):
            chosen.append((key, index, row))

    out_dir = repo / "frontend" / "public" / "samples"
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    for key, index, row in chosen:
        sample_id = f"{key}_{index}"
        filename = f"{sample_id}.jpg"
        dest = out_dir / filename
        resize_long_side(row["full_path"], dest)
        name_bn, name_en = labels[key]
        manifest.append(
            {
                "id": sample_id,
                "labelBn": name_bn,
                "labelEn": name_en,
                "src": f"/samples/{filename}",
                "credit": CREDIT,
            }
        )
        print(f"  {row['full_path']} -> {dest}")

    manifest_path = out_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Wrote {len(manifest)} sample(s) and {manifest_path}")
    return manifest


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Pick real test-split images for the app's sample strip"
    )
    parser.add_argument("--data-root", type=Path, required=True, help="Resized or raw dataset root")
    parser.add_argument(
        "--splits",
        type=Path,
        default=REPO_ROOT / "data" / "splits.csv",
        help="Path to splits.csv",
    )
    parser.add_argument("--per-class", type=int, default=1, help="Images per class (default: 1)")
    parser.add_argument(
        "--classes",
        default=DEFAULT_CLASSES,
        help=f"Comma-separated class keys (default: {DEFAULT_CLASSES})",
    )
    parser.add_argument(
        "--repo",
        type=Path,
        default=REPO_ROOT,
        help=f"Repository root for output and labels (default: {REPO_ROOT})",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    args = parser.parse_args(argv)

    try:
        classes = parse_classes(args.classes)
        pick_samples(args.data_root, args.splits, args.repo, args.per_class, classes, args.seed)
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
