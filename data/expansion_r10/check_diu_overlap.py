import io
from pathlib import Path
import pandas as pd
import numpy as np
from PIL import Image, ImageOps
import imagehash
from huggingface_hub import hf_hub_download

print("Loading DIU shards...")
p0 = hf_hub_download('Project-AgML/rice_disease_classification_bangladesh', filename='raw/train-00000-of-00002.parquet', repo_type='dataset')
p1 = hf_hub_download('Project-AgML/rice_disease_classification_bangladesh', filename='raw/train-00001-of-00002.parquet', repo_type='dataset')

df0 = pd.read_parquet(p0)
df1 = pd.read_parquet(p1)
diu_df = pd.concat([df0, df1], ignore_index=True)
print(f"DIU total images: {len(diu_df)}")

# Compute pHash for DIU images
diu_hashes = []
diu_names = []
for idx, row in diu_df.iterrows():
    img_data = row['image']
    img_bytes = img_data['bytes']
    name = img_data.get('path', f'diu_{idx}.jpg')
    try:
        with Image.open(io.BytesIO(img_bytes)) as im:
            h = int(str(imagehash.phash(ImageOps.exif_transpose(im).convert('RGB'))), 16)
            diu_hashes.append(h)
            diu_names.append(name)
    except Exception as e:
        pass

print(f"DIU hashes computed: {len(diu_hashes)}")
diu_H = np.array(diu_hashes, dtype=np.uint64)

# Load test set candidate images (non-aug)
test_dir = Path(r"D:\aldata\raw\abuabdurrahman_bd\extracted\Clean_Rice")
test_files = [f for f in test_dir.rglob("*.jpg") if not f.name.lower().startswith("aug")]
print(f"Test candidate non-aug files: {len(test_files)}")

test_hashes = []
test_paths = []
for f in test_files:
    try:
        with Image.open(f) as im:
            h = int(str(imagehash.phash(ImageOps.exif_transpose(im).convert('RGB'))), 16)
            test_hashes.append(h)
            test_paths.append(f)
    except Exception as e:
        pass

test_H = np.array(test_hashes, dtype=np.uint64)

LUT = np.array([bin(x).count("1") for x in range(256)], dtype=np.uint8)
overlap_count = 0
overlaps = []

for i in range(len(test_H)):
    d = LUT[(test_H[i] ^ diu_H).view(np.uint8)].reshape(-1, 8).sum(1)
    min_dist = d.min()
    if min_dist <= 8:
        overlap_count += 1
        closest_diu = diu_names[d.argmin()]
        overlaps.append((test_paths[i].name, closest_diu, int(min_dist)))

print(f"Total test candidate images within <= 8 bits of DIU: {overlap_count} / {len(test_H)}")
if overlaps:
    print("Sample overlaps (test <-> diu, dist):")
    for o in overlaps[:10]:
        print(f"  {o[0]} <-> {o[1]} (dist: {o[2]})")

