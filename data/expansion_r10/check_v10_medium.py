from pathlib import Path
import subprocess
import zipfile
from PIL import Image, ImageOps
import imagehash
import numpy as np

v10_dir = Path(r"D:\aldata\v10_sources")
v10_dir.mkdir(parents=True, exist_ok=True)

test_dir = Path(r"D:\aldata\raw\abuabdurrahman_bd\extracted\Clean_Rice")
test_files = [f for f in test_dir.rglob("*.jpg") if not f.name.lower().startswith("aug")]
print(f"Loading {len(test_files)} test files...")

test_hashes = []
test_names = []
for f in test_files:
    try:
        with Image.open(f) as im:
            h = int(str(imagehash.phash(ImageOps.exif_transpose(im).convert('RGB'))), 16)
            test_hashes.append(h)
            test_names.append(f.name)
    except Exception:
        pass
test_H = np.array(test_hashes, dtype=np.uint64)
LUT = np.array([bin(x).count("1") for x in range(256)], dtype=np.uint8)

sources = [
    ("raihan_bd", "raihan150146/rice-leaf-diseases-dataset"),
    ("paddy_doctor", "imbikramsaha/paddy-doctor"),
]

for name, slug in sources:
    sdir = v10_dir / name
    sdir.mkdir(exist_ok=True)
    zip_files = list(sdir.glob("*.zip"))
    if not zip_files:
        print(f"Downloading {slug}...")
        subprocess.run(["kaggle", "datasets", "download", "-d", slug, "-p", str(sdir)], check=True)
        zip_files = list(sdir.glob("*.zip"))
    
    zf_path = zip_files[0]
    print(f"Reading {zf_path.name}...")
    source_hashes = []
    source_names = []
    with zipfile.ZipFile(zf_path, 'r') as z:
        for fname in z.namelist():
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                try:
                    with z.open(fname) as fp:
                        with Image.open(fp) as im:
                            h = int(str(imagehash.phash(ImageOps.exif_transpose(im).convert('RGB'))), 16)
                            source_hashes.append(h)
                            source_names.append(fname)
                except Exception:
                    pass
    
    print(f"{name}: {len(source_hashes)} images hashed.")
    if source_hashes:
        src_H = np.array(source_hashes, dtype=np.uint64)
        overlaps = []
        for i in range(len(test_H)):
            d = LUT[(test_H[i] ^ src_H).view(np.uint8)].reshape(-1, 8).sum(1)
            min_dist = d.min()
            if min_dist <= 8:
                overlaps.append((test_names[i], source_names[d.argmin()], int(min_dist)))
        print(f"--> Overlap with {name}: {len(overlaps)} test images <= 8 bits")
        for o in overlaps[:5]:
            print(f"    {o[0]} <-> {o[1]} (dist={o[2]})")

