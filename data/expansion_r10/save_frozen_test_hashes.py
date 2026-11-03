import os
import pandas as pd
from multiprocessing import Pool
from PIL import Image, ImageOps
import imagehash

RAW_DIR = r"D:\aldata\raw\abuabdurrahman_bd\extracted"
OUT_PATH = r"data\expansion_r10\frozen_test_hashes.parquet"
IMG_EXTS = {".jpg", ".jpeg", ".png"}

def compute_phash(filepath):
    try:
        with Image.open(filepath) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            w, h = img.size
            if max(w, h) > 1024:
                scale = 1024.0 / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)
            h_obj = imagehash.phash(img, hash_size=8)
            h_int = int(str(h_obj), 16)
            rel = os.path.relpath(filepath, RAW_DIR).replace("\\", "/")
            cls = os.path.basename(os.path.dirname(filepath))
            return rel, cls, h_int
    except Exception:
        return None

def main():
    files = []
    for r, _, fs in os.walk(RAW_DIR):
        for f in fs:
            if os.path.splitext(f)[1].lower() in IMG_EXTS:
                files.append(os.path.join(r, f))
    files.sort()
    
    with Pool(os.cpu_count()) as pool:
        records = [r for r in pool.map(compute_phash, files) if r is not None]
        
    df = pd.DataFrame(records, columns=["rel_path", "source_class", "phash_u64"])
    df["phash_u64"] = df["phash_u64"].astype("uint64")
    df.to_parquet(OUT_PATH, index=False)
    print(f"Saved {len(df)} frozen test set hashes to {OUT_PATH}")

if __name__ == "__main__":
    main()
