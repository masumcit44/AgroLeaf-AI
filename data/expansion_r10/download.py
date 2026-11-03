#!/usr/bin/env python3
"""Reproducible download pipeline for approved R10 rice leaf image sources.

Downloads raw archives into D:\aldata\raw\<source_slug>\, computes SHA256 of every
archive, extracts images, and logs file counts and metadata.

Usage:
    python data/expansion_r10/download.py --source <source_slug>
    python data/expansion_r10/download.py --all
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
import requests

RAW_BASE = Path(r"D:\aldata\raw")
MANIFEST_LOG = Path(r"data\expansion_r10\download_manifest.json")
HEADERS = {"User-Agent": "AgroLeaf-Data-Pipeline/1.0 (Mozilla/5.0)"}

SOURCES = {
    "banglariceleaf": {
        "name": "BanglaRiceLeaf (Harvard Dataverse)",
        "method": "dataverse",
        "doi": "10.7910/DVN/XAOBYW",
        "files": [
            {"name": "Bacterial_Leaf_Blight_BLB.rar", "id": 13461685, "class": "other_rice/bacterial_blight"},
            {"name": "Bacterial_Leaf_Streak_BLS.rar", "id": 13461686, "class": "other_rice/bacterial_streak"},
            {"name": "Healthy_Leaf.rar", "id": 13461687, "class": "healthy"},
            {"name": "Leaf_Blast.rar", "id": 13461688, "class": "blast"},
            {"name": "Sheath_Blight.rar", "id": 13461689, "class": "sheath_blight"}
        ]
    },
    "zenodo_vn_pest": {
        "name": "Rice Pest Dataset Cuu Long Delta (Zenodo 8418217)",
        "method": "zenodo",
        "record_id": 8418217,
        "filename": "Rice Pest Dataset.zip",
        "url": "https://zenodo.org/api/records/8418217/files/Rice%20Pest%20Dataset.zip/content"
    },
    "zenodo_ewabelt": {
        "name": "PLANTHEAD EWA-BELT Rice Leaves Dataset (Zenodo 17175416)",
        "method": "zenodo",
        "record_id": 17175416,
        "filename": "Rice_Leaves.zip",
        "url": "https://zenodo.org/api/records/17175416/files/Rice_Leaves.zip/content"
    },
    "zenodo_shakeel": {
        "name": "Rice Leaf Disease (Zenodo 15817084)",
        "method": "zenodo",
        "record_id": 15817084,
        "filename": "Rice_Leaf_Disease.zip",
        "url": "https://zenodo.org/api/records/15817084/files/Rice_Leaf_Disease.zip/content"
    },
    "thegoanpanda_karnataka": {
        "name": "RICE CROP DISEASES (thegoanpanda)",
        "method": "kaggle",
        "ref": "thegoanpanda/rice-crop-diseases"
    },
    "tedisetiady_indonesia": {
        "name": "Leaf Rice Disease Indonesia (tedisetiady)",
        "method": "kaggle",
        "ref": "tedisetiady/leaf-rice-disease-indonesia"
    },
    "abuabdurrahman_bd": {
        "name": "Rice Disease Leaves Clean (abuabdurrahman1101)",
        "method": "kaggle",
        "ref": "abuabdurrahman1101/rice-disease-leaves"
    },
    "shuvokumarbasak_algae": {
        "name": "Paddy Algae Monitoring Dataset BD (shuvokumarbasak4004)",
        "method": "kaggle",
        "ref": "shuvokumarbasak4004/paddy-algae-monitoring-dataset-bd"
    },
    "leafnet75_india": {
        "name": "LeafNet75 Rice-Disease-Classification-Dataset (HF)",
        "method": "hf_zip",
        "repo": "LeafNet75/Rice-Disease-Classification-Dataset",
        "filename": "rename.zip"
    },
    "sharmin3_bd": {
        "name": "sharmin3/Rice-Leaf-Disease (HF)",
        "method": "hf_zip",
        "repo": "sharmin3/Rice-Leaf-Disease",
        "filename": "Rice Leaf Disease-20241115T062818Z-001.zip"
    },
    "minhhungg_vn": {
        "name": "minhhungg/rice-disease-dataset (HF)",
        "method": "hf_parquet",
        "repo": "minhhungg/rice-disease-dataset"
    }
}

def sha256_file(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def count_images(dir_path: Path):
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
    count = 0
    breakdown = {}
    for root, _, files in os.walk(dir_path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in exts:
                count += 1
                breakdown[ext] = breakdown.get(ext, 0) + 1
    return count, breakdown

def download_http_file(url: str, dest_path: Path) -> str:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading: {url} -> {dest_path.name}")
    resp = requests.get(url, headers=HEADERS, stream=True, timeout=30)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1048576):
            if chunk:
                f.write(chunk)
    checksum = sha256_file(dest_path)
    print(f"Downloaded {dest_path.name}: {dest_path.stat().st_size} bytes, sha256: {checksum[:16]}...")
    return checksum

def download_source(slug: str):
    if slug not in SOURCES:
        raise ValueError(f"Unknown source slug: {slug}. Valid options: {list(SOURCES.keys())}")
    
    cfg = SOURCES[slug]
    dest_dir = RAW_BASE / slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"slug": slug, "name": cfg["name"], "archives": [], "image_count": 0, "breakdown": {}}
    
    print(f"\n==================================================")
    print(f"Starting download for {slug} ({cfg['name']})")
    print(f"Destination: {dest_dir}")
    print(f"==================================================")
    
    method = cfg["method"]
    if method == "kaggle":
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        zip_path = dest_dir / f"{slug}.zip"
        print(f"Fetching from Kaggle: {cfg['ref']}")
        api.dataset_download_files(cfg["ref"], path=str(dest_dir), unzip=False)
        # Kaggle saves dataset zip as <dataset-name>.zip
        zips = list(dest_dir.glob("*.zip"))
        for z in zips:
            csum = sha256_file(z)
            manifest["archives"].append({"archive": z.name, "size": z.stat().st_size, "sha256": csum})
            print(f"Archive {z.name} sha256: {csum}")
            with zipfile.ZipFile(z, 'r') as zip_ref:
                zip_ref.extractall(dest_dir / "extracted")
        img_cnt, brk = count_images(dest_dir / "extracted")
        manifest["image_count"] = img_cnt
        manifest["breakdown"] = brk
        print(f"Extracted {img_cnt} images: {brk}")
        
    elif method == "zenodo":
        archive_path = dest_dir / cfg["filename"]
        csum = download_http_file(cfg["url"], archive_path)
        manifest["archives"].append({"archive": cfg["filename"], "size": archive_path.stat().st_size, "sha256": csum})
        if cfg["filename"].endswith(".zip"):
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(dest_dir / "extracted")
            img_cnt, brk = count_images(dest_dir / "extracted")
            manifest["image_count"] = img_cnt
            manifest["breakdown"] = brk
            print(f"Extracted {img_cnt} images: {brk}")
            
    elif method == "hf_zip":
        from huggingface_hub import hf_hub_download
        print(f"Downloading from Hugging Face: {cfg['repo']} / {cfg['filename']}")
        cached_file = hf_hub_download(repo_id=cfg["repo"], filename=cfg["filename"], repo_type="dataset")
        archive_dest = dest_dir / cfg["filename"]
        shutil.copy2(cached_file, archive_dest)
        csum = sha256_file(archive_dest)
        manifest["archives"].append({"archive": cfg["filename"], "size": archive_dest.stat().st_size, "sha256": csum})
        print(f"Archive {archive_dest.name} sha256: {csum}")
        with zipfile.ZipFile(archive_dest, 'r') as zip_ref:
            zip_ref.extractall(dest_dir / "extracted")
        img_cnt, brk = count_images(dest_dir / "extracted")
        manifest["image_count"] = img_cnt
        manifest["breakdown"] = brk
        print(f"Extracted {img_cnt} images: {brk}")

    elif method == "dataverse":
        extract_dir = dest_dir / "extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)
        for item in cfg["files"]:
            file_url = f"https://dataverse.harvard.edu/api/access/datafile/{item['id']}"
            archive_path = dest_dir / item["name"]
            csum = download_http_file(file_url, archive_path)
            manifest["archives"].append({"archive": item["name"], "size": archive_path.stat().st_size, "sha256": csum})
            # Check if patool or shutil can unpack rar/zip
            try:
                import patoolib
                target_sub = extract_dir / item.get("class", "")
                target_sub.mkdir(parents=True, exist_ok=True)
                patoolib.extract_archive(str(archive_path), outdir=str(target_sub))
            except Exception as e:
                print(f"Note: archive {item['name']} saved ({archive_path.stat().st_size} bytes). Extract notice: {e}")
        img_cnt, brk = count_images(extract_dir)
        manifest["image_count"] = img_cnt
        manifest["breakdown"] = brk
        print(f"Images in extracted folder: {img_cnt}: {brk}")

    return manifest

def main():
    parser = argparse.ArgumentParser(description="Download approved R10 rice leaf image datasets.")
    parser.add_argument("--source", type=str, help="Specific source slug to download")
    parser.add_argument("--all", action="store_true", help="Download all approved sources")
    args = parser.parse_args()
    
    RAW_BASE.mkdir(parents=True, exist_ok=True)
    manifests = {}
    if MANIFEST_LOG.exists():
        try:
            with open(MANIFEST_LOG, "r", encoding="utf-8") as f:
                manifests = json.load(f)
        except Exception:
            manifests = {}
            
    if args.source:
        m = download_source(args.source)
        manifests[args.source] = m
    elif args.all:
        for s in SOURCES:
            try:
                m = download_source(s)
                manifests[s] = m
            except Exception as e:
                print(f"Failed download for {s}: {e}")
    else:
        parser.print_help()
        return

    with open(MANIFEST_LOG, "w", encoding="utf-8") as f:
        json.dump(manifests, f, indent=2)
    print(f"\nManifest log updated at {MANIFEST_LOG}")

if __name__ == "__main__":
    main()

