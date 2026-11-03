"""Before any v6 DIU result is read: how close are Vietnam (minhhuy2810) training images to DIU test images?
v6's guard dropped Vietnam rows within 4 pHash bits of DIU. This measures the remaining distances
(pHash on EXIF-upright RGB, as in the training kernel) and saves the closest pairs side by side."""
import os, sys
from subprocess import run
run([sys.executable, "-m", "pip", "install", "-q", "imagehash"])
import numpy as np, imagehash
from collections import Counter
from multiprocessing import Pool
from PIL import Image, ImageOps

IN, OUT = "/kaggle/input", "/kaggle/working"
IMG = (".jpg", ".jpeg", ".png")
def files(token, must=""):
    return sorted(os.path.join(r, f) for r, _, fs in os.walk(IN) for f in fs
                  if f.lower().endswith(IMG) and token in r.lower() and must in r.lower() and "augment" not in r.lower())
vn = files("rice-diseases-image-dataset", "labelled")
diu = files("hasanmojumdar-rice", "original dataset")
print("vietnam", len(vn), "| diu originals", len(diu), flush=True)
def ph(p):
    try:
        with Image.open(p) as im:
            im.draft("RGB", (512, 512)); return int(str(imagehash.phash(ImageOps.exif_transpose(im).convert("RGB"))), 16)
    except Exception: return None
with Pool(os.cpu_count()) as pool:
    hv = pool.map(ph, vn, chunksize=32); hd = pool.map(ph, diu, chunksize=32)
V = [(p, h) for p, h in zip(vn, hv) if h is not None]; D = [(p, h) for p, h in zip(diu, hd) if h is not None]
A = np.array([h for _, h in V], dtype=np.uint64); B = np.array([h for _, h in D], dtype=np.uint64)
LUT = np.array([bin(x).count("1") for x in range(256)], dtype=np.uint8)
best, arg = np.full(len(A), 99), np.zeros(len(A), int)
for s in range(0, len(A), 256):
    d = LUT[(A[s:s + 256, None] ^ B[None, :]).view(np.uint8)].reshape(-1, len(B), 8).sum(2)
    best[s:s + 256] = d.min(1); arg[s:s + 256] = d.argmin(1)
hist = Counter(int(b) for b in best)
print("min pHash distance Vietnam->DIU, count of Vietnam images:", {k: hist[k] for k in sorted(hist) if k <= 20}, flush=True)
for t in (4, 6, 8, 10, 12, 14): print(f"  <= {t} bits: {int((best <= t).sum())}", flush=True)
# side-by-side sheets of the closest pairs in bands 5-8, 9-12 and 13-16 (Vietnam left, DIU right)
for lo, hi in ((5, 8), (9, 12), (13, 16)):
    idx = [i for i in np.argsort(best) if lo <= best[i] <= hi][:12]
    if not idx: continue
    sheet = Image.new("RGB", (2 * 200, 200 * len(idx)), "white")
    for k, i in enumerate(idx):
        for j, p in enumerate((V[i][0], D[arg[i]][0])):
            im = ImageOps.exif_transpose(Image.open(p)).convert("RGB"); im.thumbnail((196, 196)); sheet.paste(im, (j * 200, k * 200))
    sheet.save(f"{OUT}/pairs_{lo}_{hi}.jpg", quality=85)
    print(f"pairs_{lo}_{hi}.jpg:", [(os.path.basename(V[i][0]), os.path.basename(D[arg[i]][0]), int(best[i])) for i in idx], flush=True)
print("LEAKCHECK_DONE")
