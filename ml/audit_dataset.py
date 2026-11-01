"""Read-only audit of an image-classification dataset laid out as <root>/<class>/<image>.

Reports per-class counts, formats, sizes, colour modes, unreadable files,
exact duplicates (MD5), cross-class duplicates and near-duplicate groups
(perceptual hash). Never modifies the dataset.

Usage:
    pip install pillow imagehash numpy
    python scripts/audit_dataset.py <dataset_root> --out data/audit_output [--phash-dist 6]
"""
import argparse
import csv
import hashlib
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

try:
    import imagehash
except ImportError:
    imagehash = None

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_class_dir(path, root):
    """The class is the first folder under root."""
    return path.relative_to(root).parts[0]


def group_near_duplicates(hashes, max_dist):
    """Union-find over 64-bit perceptual hashes within max_dist Hamming distance."""
    n = len(hashes)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    arr = np.array(hashes, dtype=np.uint64)
    for i in range(n - 1):
        x = np.bitwise_xor(arr[i + 1:], arr[i])
        dist = np.unpackbits(x.view(np.uint8).reshape(-1, 8), axis=1).sum(axis=1)
        for j in np.nonzero(dist <= max_dist)[0]:
            a, b = find(i), find(i + 1 + int(j))
            if a != b:
                parent[b] = a
    return [find(i) for i in range(n)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--out", type=Path, default=Path("data/audit_output"))
    ap.add_argument("--phash-dist", type=int, default=6)
    args = ap.parse_args()
    root = args.root.resolve()
    args.out.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    other_files = sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() not in IMAGE_EXTS)
    rows, bad = [], []
    for p in files:
        rec = {"path": str(p.relative_to(root)), "class": find_class_dir(p, root)}
        try:
            with Image.open(p) as im:
                im.verify()
            with Image.open(p) as im:
                rec.update(width=im.width, height=im.height, mode=im.mode, format=im.format)
                rec["phash"] = str(imagehash.phash(im.convert("RGB"))) if imagehash else ""
            rec["md5"] = md5_of(p)
            rows.append(rec)
        except Exception as e:  # unreadable files are recorded, not skipped silently
            bad.append({"path": rec["path"], "error": repr(e)})

    by_md5 = defaultdict(list)
    for r in rows:
        by_md5[r["md5"]].append(r)
    exact_dups = [g for g in by_md5.values() if len(g) > 1]
    cross_class = [g for g in exact_dups if len({r["class"] for r in g}) > 1]

    groups = list(range(len(rows)))
    if imagehash and rows:
        groups = group_near_duplicates([int(r["phash"], 16) for r in rows], args.phash_dist)
    for r, g in zip(rows, groups):
        r["group_id"] = g
    group_sizes = Counter(groups)
    near_groups = [g for g, c in group_sizes.items() if c > 1]
    near_cross = [g for g in near_groups if len({r["class"] for r in rows if r["group_id"] == g}) > 1]

    with open(args.out / "images.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "class", "width", "height", "mode", "format", "md5", "phash", "group_id"])
        w.writeheader()
        w.writerows(rows)
    with open(args.out / "unreadable.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "error"])
        w.writeheader()
        w.writerows(bad)

    per_class = Counter(r["class"] for r in rows)
    sizes = Counter(f'{r["width"]}x{r["height"]}' for r in rows)
    modes = Counter(r["mode"] for r in rows)
    fmts = Counter(r["format"] for r in rows)
    lines = [
        f"# Audit of `{root}`",
        "",
        f"- Readable images: {len(rows)}",
        f"- Unreadable images: {len(bad)} (see unreadable.csv)",
        f"- Non-image files: {len(other_files)} (e.g. {', '.join(p.name for p in other_files[:5])})",
        f"- Exact-duplicate groups (MD5): {len(exact_dups)}, covering {sum(len(g) for g in exact_dups)} files",
        f"- Exact duplicates appearing in more than one class: {len(cross_class)}",
        f"- Near-duplicate groups (pHash distance <= {args.phash_dist}): {len(near_groups)}"
        + ("" if imagehash else " (imagehash not installed: skipped)"),
        f"- Near-duplicate groups spanning more than one class: {len(near_cross)}",
        "",
        "## Images per class",
        "| class | images | share |",
        "|---|---|---|",
    ]
    total = max(len(rows), 1)
    lines += [f"| {c} | {n} | {n / total:.1%} |" for c, n in sorted(per_class.items())]
    if per_class:
        lines += ["", f"Imbalance ratio (largest/smallest): {max(per_class.values()) / min(per_class.values()):.2f}"]
    lines += ["", "## Sizes (top 10)"] + [f"- {s}: {n}" for s, n in sizes.most_common(10)]
    lines += ["", "## Colour modes"] + [f"- {m}: {n}" for m, n in modes.items()]
    lines += ["", "## Formats"] + [f"- {m}: {n}" for m, n in fmts.items()]
    (args.out / "audit_summary.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
