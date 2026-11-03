import os
import time
from collections import defaultdict
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageOps
import imagehash

RAW_DIR = r"D:\aldata\raw\abuabdurrahman_bd\extracted"
IMG_EXTS = {".jpg", ".jpeg", ".png"}

def get_image_files(root_dir):
    files = []
    for r, _, fs in os.walk(root_dir):
        for f in fs:
            if os.path.splitext(f)[1].lower() in IMG_EXTS:
                files.append(os.path.join(r, f))
    return sorted(files)

def compute_phash(filepath):
    try:
        with Image.open(filepath) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            # Cap long side at 1024
            w, h = img.size
            if max(w, h) > 1024:
                scale = 1024.0 / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)
            h_obj = imagehash.phash(img, hash_size=8)
            h_int = int(str(h_obj), 16)
            return filepath, h_int
    except Exception as e:
        return filepath, None

def main():
    files = get_image_files(RAW_DIR)
    print(f"Total image files found: {len(files)}")
    
    t0 = time.time()
    with Pool(os.cpu_count()) as pool:
        results = pool.map(compute_phash, files, chunksize=64)
    dt = time.time() - t0
    print(f"Computed {len(results)} pHashes in {dt:.1f}s")
    
    valid = [(p, h) for p, h in results if h is not None]
    failed = len(results) - len(valid)
    print(f"Valid pHashes: {len(valid)}, Failed: {failed}")
    
    # Internal deduplication: greedy keep with distance > 8 bits
    # Priority: earliest file by path
    kept = []
    dropped = []
    kept_hashes = []
    
    # Fast bitwise distance using bit_count()
    for p, h in valid:
        is_dup = False
        for kh in kept_hashes:
            diff = (h ^ kh).bit_count()
            if diff <= 8:
                is_dup = True
                dropped.append((p, diff))
                break
        if not is_dup:
            kept.append(p)
            kept_hashes.append(h)
            
    print(f"\n--- Internal Deduplication Results (threshold <= 8 bits) ---")
    print(f"Initial: {len(valid)}")
    print(f"Kept (unique > 8 bits): {len(kept)}")
    print(f"Dropped (near-duplicates <= 8 bits): {len(dropped)}")
    
    # Class distribution among kept images
    class_counts = defaultdict(int)
    for p in kept:
        parent = os.path.basename(os.path.dirname(p))
        class_counts[parent] += 1
        
    print("\nClass distribution among kept unique images:")
    for cls, cnt in sorted(class_counts.items()):
        print(f"  {cls:25s}: {cnt}")

if __name__ == "__main__":
    main()
