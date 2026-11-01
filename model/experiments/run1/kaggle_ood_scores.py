"""Score the deployed v1 ONNX model on rice and non-rice images for the safety gate.

For every image: 6 raw logits (browser model, same preprocessing as the app)
and a hue/saturation/value histogram of the 224x224 crop, so leaf-colour rules
can be fitted offline on the validation split only.
Sets: internal val/test (splits.csv), Sylhet + Savar (outside districts),
Natural Images (not plants) and PlantVillage (leaves of other crops).
"""
import csv, json, os, random, subprocess, sys
import numpy as np
W = "/kaggle/working"; T = "/tmp/agro"; os.makedirs(T, exist_ok=True)
def run(cmd, cwd=None):
    print("\n$ " + " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode: sys.exit(f"STEP FAILED: {cmd}")
REPO = f"{T}/AgroLeaf-AI"
run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "onnxruntime"])
import onnxruntime as ort
from PIL import Image
IN = "/kaggle/input"
IMG = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
CLASSES = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]
def find(pred):
    for root, dirs, files in os.walk(IN):
        if pred(root, dirs, files): return root
    return None
model_dir = find(lambda r, d, f: "model.onnx" in f)
splits_dir = find(lambda r, d, f: "splits.csv" in f and os.path.basename(r) == "data")
orig = find(lambda r, d, f: os.path.basename(r) == "Original images")
print("model:", model_dir, "splits:", splits_dir, "orig:", orig, flush=True)
pre = json.load(open(f"{REPO}/frontend/public/data/preprocess.json"))
print("preprocess:", pre, flush=True)
MEAN = np.array(pre["mean"], np.float32); STD = np.array(pre["std"], np.float32)
sess = ort.InferenceSession(f"{model_dir}/model.onnx", providers=["CPUExecutionProvider"])
# histogram bins on PIL HSV (0..255 scale)
HB = np.linspace(0, 256, 37); SB = np.array([0, 26, 51, 77, 128, 256]); VB = np.array([0, 38, 77, 256])
def crop224(path):
    with Image.open(path) as im:
        im = im.convert("RGB")
        w, h = im.size; s = pre["resize_shorter"] / min(w, h)
        im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BILINEAR)
        w, h = im.size; c = pre["crop"]; l = (w - c) // 2; t = (h - c) // 2
        return im.crop((l, t, l + c, t + c))
def score(path):
    im = crop224(path)
    rgb = np.asarray(im, np.float32) / 255.0
    x = ((rgb - MEAN) / STD).transpose(2, 0, 1)[None].astype(np.float32)
    logits = sess.run(None, {"input": x})[0][0]
    hsv = np.asarray(im.convert("HSV")).reshape(-1, 3)
    hist, _ = np.histogramdd(hsv, bins=(HB, SB, VB))
    return logits, (hist / hsv.shape[0]).astype(np.float32).ravel()
rows, LOG, HIST = [], [], []
def add(setname, path, label):
    try: lg, hs = score(path)
    except Exception as e: print("skip", path, e, flush=True); return
    rows.append((setname, os.path.basename(path), label)); LOG.append(lg); HIST.append(hs)
# internal val/test, resized exactly as in evaluation
resized = f"{T}/resized"
run([sys.executable, "ml/resize_for_upload.py", "--src", orig, "--out", resized, "--size", "320", "--quality", "92"], cwd=REPO)
with open(f"{splits_dir}/splits.csv", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        if r["split"] in ("val", "test"):
            add("internal_" + r["split"], os.path.join(resized, r["path"]), r["class_key"])
print("internal done:", len(rows), flush=True)
norm = lambda x: x.lower().replace("_", " ").strip()
def external(setname, slug, mapfile, size_dir):
    m = {norm(k): v for k, v in json.load(open(f"{REPO}/ml/external_maps/{mapfile}")).items() if not k.startswith("__")}
    root = None
    for r, d, f in os.walk(IN):
        if slug in r.lower() and len({norm(x) for x in d} & set(m)) >= 3: root = r; break
    print(setname, "root:", root, flush=True)
    if not root: return
    out = f"{T}/{size_dir}"
    run([sys.executable, "ml/resize_for_upload.py", "--src", root, "--out", out, "--size", "320", "--quality", "92"], cwd=REPO)
    for d in os.listdir(out):
        lab = m.get(norm(d))
        if not lab or not os.path.isdir(os.path.join(out, d)): continue
        for r, _, fs in os.walk(os.path.join(out, d)):
            for fn in fs:
                if fn.lower().endswith(IMG): add(setname, os.path.join(r, fn), lab)
    print(setname, "done:", len(rows), flush=True)
external("sylhet", "riceleafbd", "riceleafbd_sylhet.json", "syl_320")
external("savar", "riceleafdisease-bd5", "riceleafdisease_bd5.json", "bd5_320")
rng = random.Random(42)
def ood(setname, slug, per_class):
    groups = {}
    for r, d, fs in os.walk(IN):
        if slug not in r.lower(): continue
        imgs = [os.path.join(r, f) for f in fs if f.lower().endswith(IMG)]
        if imgs: groups[os.path.basename(r)] = imgs
    print(setname, "groups:", {k: len(v) for k, v in groups.items()}, flush=True)
    for g, imgs in sorted(groups.items()):
        for p in rng.sample(sorted(imgs), min(per_class, len(imgs))): add(setname, p, "__ood__:" + g)
    print(setname, "done:", len(rows), flush=True)
ood("natural", "natural-images", 150)
ood("plantvillage", "plantdisease", 60)
with open(f"{W}/ood_rows.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["set", "file", "label"]); w.writerows(rows)
np.savez_compressed(f"{W}/ood_scores.npz", logits=np.array(LOG, np.float32), hist=np.array(HIST, np.float32))
from collections import Counter
print(Counter(r[0] for r in rows), flush=True)
print("OOD_SCORES_DONE")
