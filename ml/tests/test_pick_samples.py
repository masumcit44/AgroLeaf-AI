#!/usr/bin/env python3
"""Smoke test for ml/tools/pick_samples.py with a toy dataset + toy splits.

Run from anywhere:
    python ml/tests/test_pick_samples.py
"""

import csv
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "ml" / "tools" / "pick_samples.py"
CLASSES = ["healthy", "blast", "brown_spot", "tungro"]
CREDIT = "RiceLeafDiseaseBD v3, CC BY 4.0, DOI 10.17632/86s4jzj2m4.3"


def snapshot(root):
    return {
        p.relative_to(root).as_posix(): hashlib.md5(p.read_bytes()).hexdigest()
        for p in sorted(root.rglob("*"))
        if p.is_file()
    }


def make_dataset(root):
    rng = np.random.RandomState(11)
    rows = []
    for class_key in CLASSES:
        folder = root / class_key.replace("_", " ").title().replace(" ", "")
        folder.mkdir(parents=True, exist_ok=True)
        for index in range(4):
            width, height = (600, 300) if index % 2 == 0 else (300, 600)
            array = rng.randint(0, 255, size=(height, width, 3), dtype=np.uint8)
            name = f"{class_key}_{index}.jpg"
            Image.fromarray(array).save(folder / name, format="JPEG", quality=90)
            split = "test" if index < 2 else "train"
            rows.append(
                {
                    "path": f"{folder.name}/{name}",
                    "class_key": class_key,
                    "group_id": index,
                    "split": split,
                }
            )
    splits = root.parent / "splits.csv"
    with open(splits, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["path", "class_key", "group_id", "split"])
        writer.writeheader()
        writer.writerows(rows)
    return splits


def make_repo(root):
    (root / "frontend/public/samples").mkdir(parents=True, exist_ok=True)
    (root / "disease_knowledge").mkdir(parents=True, exist_ok=True)
    for name in ("disease_information_bn.json", "disease_information_en.json"):
        shutil.copy2(REPO_ROOT / "disease_knowledge" / name, root / "disease_knowledge" / name)


def run_script(data_root, splits, repo, *extra):
    return subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--data-root",
            str(data_root),
            "--splits",
            str(splits),
            "--repo",
            str(repo),
            *extra,
        ],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )


def main():
    with tempfile.TemporaryDirectory(prefix="agroleaf_samples_test_") as temp:
        temp = Path(temp)
        data_root = temp / "dataset"
        data_root.mkdir()
        splits = make_dataset(data_root)
        before = snapshot(data_root)

        repo = temp / "repo"
        make_repo(repo)
        proc = run_script(data_root, splits, repo)
        assert proc.returncode == 0, f"pick_samples failed:\n{proc.stdout}\n{proc.stderr}"

        samples_dir = repo / "frontend/public/samples"
        manifest_path = samples_dir / "manifest.json"
        assert manifest_path.exists(), "manifest.json was not written"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert len(manifest) == len(CLASSES), manifest

        bn = json.loads(
            (REPO_ROOT / "disease_knowledge/disease_information_bn.json").read_text(encoding="utf-8")
        )
        en = json.loads(
            (REPO_ROOT / "disease_knowledge/disease_information_en.json").read_text(encoding="utf-8")
        )

        ids = {entry["id"] for entry in manifest}
        assert ids == {f"{key}_1" for key in CLASSES}, ids
        assert {entry["labelBn"] for entry in manifest} == {
            bn["classes"][key]["name_bn"] for key in CLASSES
        }
        assert {entry["labelEn"] for entry in manifest} == {
            en["classes"][key]["name_en"] for key in CLASSES
        }

        for entry in manifest:
            assert entry["credit"] == CREDIT
            assert entry["src"] == f"/samples/{entry['id']}.jpg"
            image_path = samples_dir / f"{entry['id']}.jpg"
            assert image_path.exists(), image_path
            with Image.open(image_path) as image:
                assert image.format == "JPEG"
                assert max(image.size) == 480, image.size
                assert image.size in ((480, 240), (240, 480)), image.size

        first_manifest = manifest_path.read_bytes()
        again = run_script(data_root, splits, repo)
        assert again.returncode == 0, again.stdout + again.stderr
        assert manifest_path.read_bytes() == first_manifest, "selection is not deterministic"
        assert snapshot(data_root) == before, "the dataset was modified"

        # More than one per class.
        multi = run_script(data_root, splits, repo, "--per-class", "2")
        assert multi.returncode == 0, multi.stdout + multi.stderr
        multi_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert len(multi_manifest) == len(CLASSES) * 2
        assert {entry["id"] for entry in multi_manifest} == {
            f"{key}_{index}" for key in CLASSES for index in (1, 2)
        }

        # A data root inside --repo must be refused.
        inside_repo = temp / "inside_repo"
        inside_repo.mkdir()
        (inside_repo / "dataset").mkdir()
        refused = run_script(inside_repo / "dataset", splits, inside_repo)
        assert refused.returncode == 1, refused.stdout + refused.stderr
        assert "outside --repo" in (refused.stdout + refused.stderr)
        assert not (inside_repo / "frontend/public/samples/manifest.json").exists()

        # Unknown class keys are rejected.
        unknown = run_script(data_root, splits, repo, "--classes", "healthy,not_sure")
        assert unknown.returncode == 1
        assert "unknown class key" in (unknown.stdout + unknown.stderr)

    print("PASS: pick_samples selected deterministic test images, wrote labels/credit, and refused unsafe paths.")


if __name__ == "__main__":
    main()
