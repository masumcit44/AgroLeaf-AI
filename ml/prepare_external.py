#!/usr/bin/env python3
"""Prepare external test sets for ml/evaluate.py.

Supports two source layouts and always writes `<out>/<label>/<image>.jpg` at
320 px, because evaluate.py reads the first folder level as the class name.

Folder layout:
    python ml/prepare_external.py --layout folders --raw <download> \
        --out <prepared> --map ml/external_maps/riceleafdisease_bd5.json

CSV layout (images + a label CSV, e.g. RiceLeafBD):
    python ml/prepare_external.py --layout csv --csv labels.csv \
        --image-col "Image" --label-col "Class" \
        --out <prepared> --map ml/external_maps/riceleafbd_sylhet.json

Images are copied and resized, never moved. Source files are never modified.
"""

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from prepare_dataset import find_class_root, print_tree  # noqa: E402
from resize_for_upload import IMAGE_EXTS, resize_image  # noqa: E402

MAX_SEARCH_DEPTH = 3


def load_map(map_path):
    with open(map_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    labels = {k: v for k, v in mapping.items() if not k.startswith("__")}
    return labels, mapping.get("__doi__", "")


def rel_files(folder):
    return sorted(p for p in folder.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS)


def prepare_from_folders(raw_root, out_root, mapping, size=320):
    candidates = find_class_root(raw_root, list(mapping.keys()), MAX_SEARCH_DEPTH)
    if not candidates:
        print(f"ERROR: no folder within {MAX_SEARCH_DEPTH} level(s) of {raw_root} contains the mapped class folders.")
        print(f"Expected folders (from the map): {', '.join(mapping.keys())}")
        print_tree(raw_root)
        sys.exit(1)
    if len(candidates) > 1:
        print("ERROR: more than one candidate class root found:")
        for depth, path in candidates:
            print(f"  (depth {depth}) {path}")
        sys.exit(1)

    class_root = candidates[0][1]
    print(f"Class root found at depth {candidates[0][0]}: {class_root}")

    counts = Counter()
    skipped = Counter()

    for label in sorted(mapping):
        label_dir = class_root / label
        if not label_dir.is_dir():
            print(f"WARNING: mapped label has no folder in the source: {label}")
            continue
        for src in rel_files(label_dir):
            rel = src.relative_to(label_dir)
            dest = out_root / label / rel
            resize_image(src, dest, size=size)
            counts[label] += 1

    for folder in sorted(p for p in class_root.iterdir() if p.is_dir()):
        if folder.name not in mapping:
            n = len(rel_files(folder))
            skipped[folder.name] = n

    return class_root, counts, skipped


def resolve_csv_image(value, csv_dir, image_base):
    p = Path(value)
    if p.is_absolute() and p.is_file():
        return p
    for base in (image_base, csv_dir):
        candidate = base / value
        if candidate.is_file():
            return candidate
    return None


def prepare_from_csv(csv_path, out_root, mapping, image_col, label_col, image_base, size=320):
    csv_dir = csv_path.parent
    counts = Counter()
    skipped = Counter()
    missing = []

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for col in (image_col, label_col):
            if col not in fieldnames:
                raise SystemExit(f"ERROR: column '{col}' not in {csv_path}. Columns: {fieldnames}")

        for row in reader:
            label = (row.get(label_col) or "").strip()
            value = (row.get(image_col) or "").strip()
            if not label or not value:
                continue
            if label not in mapping:
                skipped[label] += 1
                continue

            src = resolve_csv_image(value, csv_dir, image_base)
            if src is None:
                missing.append(value)
                continue

            final = out_root / label / f"{src.stem}.jpg"
            n = 2
            while final.exists():
                final = out_root / label / f"{src.stem}_{n}.jpg"
                n += 1
            resize_image(src, final, size=size)
            counts[label] += 1

    if missing:
        print(f"WARNING: {len(missing)} image path(s) listed in the CSV could not be found, e.g. {missing[:3]}")

    return counts, skipped


def write_provenance(path, source, mapping, doi, layout, counts, skipped):
    total = sum(counts.values())
    lines = [
        "# External test set provenance",
        "",
        f"- Source: `{source}`",
        f"- Layout: `{layout}`",
        f"- DOI: `{doi or '[[TBD]]'}`",
        f"- Prepared: {datetime.now().strftime('%Y-%m-%d')}",
        f"- Labels copied: {total} image(s)",
        "",
        "## Class mapping",
        "| Source label | Model class | Images |",
        "|---|---|---|",
    ]
    for label in sorted(mapping):
        lines.append(f"| {label} | {mapping[label]} | {counts.get(label, 0)} |")
    if skipped:
        lines += ["", "## Labels skipped (not in the map)"]
        lines += [f"- {label}: {n} image(s)" for label, n in sorted(skipped.items())]
    lines += [
        "",
        "Images were copied and resized to 320 px; the source folder was not modified.",
        f"Dataset licence and attribution: see the DOI above and `data/dataset_inventory.csv`.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Prepare an external test set for evaluate.py")
    parser.add_argument("--layout", choices=["folders", "csv"], required=True)
    parser.add_argument("--out", type=Path, required=True, help="Output root: <out>/<label>/<image>")
    parser.add_argument("--map", type=Path, required=True, help="External class-map JSON")
    parser.add_argument("--raw", type=Path, help="Source folder (required for folders; optional image base for csv)")
    parser.add_argument("--csv", type=Path, help="Label CSV (csv layout)")
    parser.add_argument("--image-col", help="CSV column holding the image path/filename (csv layout)")
    parser.add_argument("--label-col", help="CSV column holding the class label (csv layout)")
    parser.add_argument("--size", type=int, default=320, help="Resize size (default: 320)")
    args = parser.parse_args()

    out_root = args.out.resolve()
    mapping, doi = load_map(args.map)

    if out_root.exists() and any(out_root.iterdir()):
        print(f"WARNING: output folder is not empty; existing files with the same names will be overwritten: {out_root}")
    out_root.mkdir(parents=True, exist_ok=True)

    if args.layout == "folders":
        if not args.raw:
            raise SystemExit("ERROR: --raw is required with --layout folders")
        raw_root = args.raw.resolve()
        if not raw_root.is_dir():
            raise SystemExit(f"ERROR: --raw is not a directory: {raw_root}")
        if out_root == raw_root or out_root.is_relative_to(raw_root):
            raise SystemExit(f"ERROR: --out must be outside --raw: {out_root}")
        source, counts, skipped = prepare_from_folders(raw_root, out_root, mapping, size=args.size)
    else:
        if not args.csv or not args.image_col or not args.label_col:
            raise SystemExit("ERROR: --csv, --image-col and --label-col are required with --layout csv")
        csv_path = args.csv.resolve()
        if not csv_path.is_file():
            raise SystemExit(f"ERROR: CSV not found: {csv_path}")
        image_base = args.raw.resolve() if args.raw else csv_path.parent
        if out_root == image_base or out_root.is_relative_to(image_base):
            raise SystemExit(f"ERROR: --out must be outside the image source: {out_root}")
        source = csv_path
        counts, skipped = prepare_from_csv(
            csv_path, out_root, mapping, args.image_col, args.label_col, image_base, size=args.size
        )

    write_provenance(out_root / "PROVENANCE.md", source, mapping, doi, args.layout, counts, skipped)

    print("\nCounts per label:")
    for label in sorted(set(counts) | set(skipped) | set(mapping)):
        suffix = "  [skipped: label not in map]" if label in skipped else ""
        print(f"  {label}: {counts.get(label, 0)}{suffix}")
    print(f"Total copied: {sum(counts.values())} image(s) -> {out_root}")
    print(f"Provenance: {out_root / 'PROVENANCE.md'}")


if __name__ == "__main__":
    main()
