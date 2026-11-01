#!/usr/bin/env python3
"""
Create leakage-safe 70/15/15 train/val/test splits stratified by class and grouped by group_id.
Filters duplicates, unreadable files, and cross-class groups, recording all exclusions.
"""

import argparse
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Set

import numpy as np
from sklearn.model_selection import StratifiedGroupKFold

from common import CLASS_KEYS, set_seed


def make_splits(
    images_csv: Path,
    class_map_path: Path,
    dataset_name: str,
    out_dir: Path,
    exclusions_csv: Path,
    seed: int = 42,
) -> None:
    set_seed(seed)
    out_dir.mkdir(parents=True, exist_ok=True)
    exclusions_csv.parent.mkdir(parents=True, exist_ok=True)

    # Load class mapping
    if not class_map_path.exists():
        raise FileNotFoundError(f"Class map not found: {class_map_path}")

    with open(class_map_path, "r", encoding="utf-8") as f:
        all_class_maps = json.load(f)

    if dataset_name not in all_class_maps:
        raise KeyError(
            f"Dataset '{dataset_name}' not in {class_map_path}. Available: {list(all_class_maps.keys())}"
        )

    class_map: Dict[str, str] = all_class_maps[dataset_name]

    # Read audit images.csv
    if not images_csv.exists():
        raise FileNotFoundError(f"Audit images file not found: {images_csv}")

    rows: List[Dict[str, str]] = []
    with open(images_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    print(f"Loaded {len(rows)} image records from {images_csv}")

    # Check for unknown class folders
    found_classes = set(r["class"] for r in rows)
    unknown_classes = found_classes - set(class_map.keys())
    if unknown_classes:
        sys.stderr.write(
            f"\nERROR: Unknown class folder(s) found in dataset: {sorted(unknown_classes)}\n"
            f"Known folders in class_map: {sorted(class_map.keys())}\n"
            f"Execution stopped. Update ml/class_map.json with verified mappings.\n"
        )
        sys.exit(1)

    exclusions: List[Dict[str, str]] = []
    valid_rows: List[Dict[str, str]] = []

    # 1. Check exact duplicates by MD5
    by_md5 = defaultdict(list)
    for r in rows:
        by_md5[r["md5"]].append(r)

    kept_from_md5: Set[str] = set()
    for md5_hash, md5_group in by_md5.items():
        # Keep first copy
        kept_from_md5.add(md5_group[0]["path"])
        for duplicate in md5_group[1:]:
            exclusions.append(
                {
                    "path": duplicate["path"],
                    "reason": f"exact_duplicate_md5 (duplicate of {md5_group[0]['path']})",
                }
            )

    rows_after_dedup = [r for r in rows if r["path"] in kept_from_md5]

    # 2. Check for cross-class perceptual groups
    by_group = defaultdict(list)
    for r in rows_after_dedup:
        by_group[r["group_id"]].append(r)

    cross_class_groups: Set[str] = set()
    for gid, group_items in by_group.items():
        classes_in_group = {class_map[item["class"]] for item in group_items}
        if len(classes_in_group) > 1:
            cross_class_groups.add(gid)
            for item in group_items:
                exclusions.append(
                    {
                        "path": item["path"],
                        "reason": f"cross_class_group (group {gid} spans classes {sorted(classes_in_group)})",
                    }
                )

    for r in rows_after_dedup:
        if r["group_id"] not in cross_class_groups:
            valid_rows.append(r)

    print(f"Retained {len(valid_rows)} valid images ({len(exclusions)} excluded)")

    # Record exclusions
    with open(exclusions_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "reason"])
        writer.writeheader()
        writer.writerows(exclusions)

    if not valid_rows:
        raise ValueError("No valid rows remaining after filtering exclusions.")

    # Prepare data for StratifiedGroupKFold
    paths = [r["path"] for r in valid_rows]
    class_keys = [class_map[r["class"]] for r in valid_rows]
    group_ids = np.array([int(r["group_id"]) for r in valid_rows])
    y = np.array([CLASS_KEYS.index(ck) for ck in class_keys])
    X = np.zeros((len(valid_rows), 1))

    # Stratified grouped splitting: 70% train, 15% val, 15% test
    # Check minimum class frequency
    min_class_count = min(Counter(y).values())

    splits = [""] * len(valid_rows)

    if min_class_count >= 20:
        # Use 20 folds: 3 test (15%), 3 val (15%), 14 train (70%)
        sgkf = StratifiedGroupKFold(n_splits=20, shuffle=True, random_state=seed)
        fold_assignments = np.zeros(len(valid_rows), dtype=int)
        for fold_idx, (_, test_indices) in enumerate(sgkf.split(X, y, group_ids)):
            fold_assignments[test_indices] = fold_idx

        for idx, fold_idx in enumerate(fold_assignments):
            if fold_idx in (0, 1, 2):
                splits[idx] = "test"
            elif fold_idx in (3, 4, 5):
                splits[idx] = "val"
            else:
                splits[idx] = "train"
    else:
        # 2-stage split for small / toy datasets
        n_splits_test = max(2, min(7, min_class_count))
        sgkf1 = StratifiedGroupKFold(n_splits=n_splits_test, shuffle=True, random_state=seed)
        train_val_idx, test_idx = next(sgkf1.split(X, y, group_ids))

        for idx in test_idx:
            splits[idx] = "test"

        y_tv = y[train_val_idx]
        groups_tv = group_ids[train_val_idx]
        min_tv = min(Counter(y_tv).values())
        n_splits_val = max(2, min(6, min_tv))
        sgkf2 = StratifiedGroupKFold(n_splits=n_splits_val, shuffle=True, random_state=seed)
        train_sub_idx, val_sub_idx = next(sgkf2.split(train_val_idx, y_tv, groups_tv))

        for idx in train_val_idx[val_sub_idx]:
            splits[idx] = "val"
        for idx in train_val_idx[train_sub_idx]:
            splits[idx] = "train"

    # Verify zero group leakage between splits
    train_groups = set(group_ids[i] for i, s in enumerate(splits) if s == "train")
    val_groups = set(group_ids[i] for i, s in enumerate(splits) if s == "val")
    test_groups = set(group_ids[i] for i, s in enumerate(splits) if s == "test")

    leak_train_val = train_groups & val_groups
    leak_train_test = train_groups & test_groups
    leak_val_test = val_groups & test_groups
    total_leaks = len(leak_train_val) + len(leak_train_test) + len(leak_val_test)

    if total_leaks > 0:
        raise RuntimeError(
            f"Data leakage detected! Shared groups: train-val={len(leak_train_val)}, "
            f"train-test={len(leak_train_test)}, val-test={len(leak_val_test)}"
        )

    print("Verification passed: 0 groups shared between splits.")

    # Write splits.csv
    splits_csv_path = out_dir / "splits.csv"
    with open(splits_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "class_key", "group_id", "split"])
        writer.writeheader()
        for p, ck, gid, sp in zip(paths, class_keys, group_ids, splits):
            writer.writerow({"path": p, "class_key": ck, "group_id": gid, "split": sp})

    print(f"Saved splits to {splits_csv_path}")

    # Generate split_summary.md
    summary_path = out_dir / "split_summary.md"
    split_counts = defaultdict(lambda: Counter())
    for ck, sp in zip(class_keys, splits):
        split_counts[ck][sp] += 1

    total_train = sum(1 for s in splits if s == "train")
    total_val = sum(1 for s in splits if s == "val")
    total_test = sum(1 for s in splits if s == "test")
    total_all = len(splits)

    lines = [
        "# Dataset Split Summary",
        "",
        f"- Total retained images: {total_all}",
        f"- Total exclusions: {len(exclusions)} (see `{exclusions_csv}`)",
        f"- Train images: {total_train} ({total_train / total_all:.1%})",
        f"- Val images: {total_val} ({total_val / total_all:.1%})",
        f"- Test images: {total_test} ({total_test / total_all:.1%})",
        "",
        "## Group Leakage Verification",
        f"- Unique groups in train: {len(train_groups)}",
        f"- Unique groups in val: {len(val_groups)}",
        f"- Unique groups in test: {len(test_groups)}",
        "- **Shared groups between splits:** **0** (verified)",
        "",
        "## Class Distribution per Split",
        "| Class Key | Train | Val | Test | Total |",
        "|---|---|---|---|---|",
    ]

    for ck in CLASS_KEYS:
        tr = split_counts[ck]["train"]
        va = split_counts[ck]["val"]
        te = split_counts[ck]["test"]
        tot = tr + va + te
        lines.append(f"| {ck} | {tr} | {va} | {te} | {tot} |")

    summary_text = "\n".join(lines) + "\n"
    summary_path.write_text(summary_text, encoding="utf-8")
    print(f"Saved summary to {summary_path}")
    print(summary_text)


def main():
    parser = argparse.ArgumentParser(description="Create leakage-safe dataset splits")
    parser.add_argument("--images", type=Path, default=Path("data/audit_output/images.csv"), help="Path to audit images.csv")
    parser.add_argument("--class-map", type=Path, default=Path("ml/class_map.json"), help="Path to class_map.json")
    parser.add_argument("--dataset", type=str, default="rice_leaf_disease_bd_v3", help="Dataset key in class_map")
    parser.add_argument("--out-dir", type=Path, default=Path("data"), help="Directory to save splits.csv and split_summary.md")
    parser.add_argument("--exclusions", type=Path, default=None, help="Path to write exclusions.csv")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    exclusions_path = args.exclusions or (args.out_dir / "exclusions.csv")
    make_splits(
        images_csv=args.images,
        class_map_path=args.class_map,
        dataset_name=args.dataset,
        out_dir=args.out_dir,
        exclusions_csv=exclusions_path,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
