"""AgroLeaf AI - image EDA for v9 design (model/experiments/eda_v9). Data loading as in run8_v8; no model training."""
"""AgroLeaf AI v8 - see model/experiments/run8_v8/PROTOCOL.md (fixed before training).

v7_320 data + Paddy Doctor, Sethy (India) and Taiwan field photos at input 320; EfficientNet-B0 and -B2.
DIU and Aman 2025 are held out; their logits are saved, no metrics printed.
"""
"""AgroLeaf AI v7 - see model/experiments/run7_v7/PROTOCOL.md (fixed before training).

Bangladesh-only rice data (Gazipur, Savar, raihan) + Dhan-Shomadhan white-background photos in training;
ablation of input size (224 vs 320) because DIU half A showed small lesions lost at 224.
DIU and Aman 2025 (Hugging Face) are held out; their logits are saved, no metrics printed.
"""
"""AgroLeaf AI v6 = v5 + expanded rice data (India, Vietnam, Karnataka); see run5_v5/PROTOCOL_AMENDMENT_1.md.

Bangladesh-only rice training incl. raihan150146, not_rice class, strong augmentation; selection on in-domain
val; final test = DIU Bangladesh raw set (Hugging Face Project-AgML/rice_disease_classification_bangladesh), read once.
"""
"""AgroLeaf AI v4: selection on outside-district Bangladeshi data, data-mix and augmentation ablations.

v3 lesson: a threshold tuned on in-distribution validation (0.30) was far too permissive on the unseen
Sylhet district (46% of answers right), and adding India/Vietnam data did not help Sylhet. So:
- raihan150146 (Sirajganj/Pabna) and Dhan-Shomadhan field photos (Dhaka) are an EXTERNAL VALIDATION set,
  never trained on, used for epoch choice, temperature, threshold and variant choice;
- Sylhet and Gujarat (leaf smut) are final tests only, never used for any choice;
- variants A/B/C isolate the data mix (all countries vs Bangladesh only) and the augmentation.

Based on v3: multi-country rice training with two extra outputs ("other rice problem", "not a rice leaf").

Why: v1 (Gazipur only) reaches 52% on the unseen Sylhet district and calls posters a disease.
v2 (Gazipur + Savar) only reached 54%. v3 adds field photos from India and Vietnam, an
"other_rice" class for rice problems the app does not cover, and a "not_rice" class trained on
everyday photos, other crops, posters, memes and generated graphics.

Held out entirely: RiceLeafBD Sylhet-Dhaka (the same unseen-district set v1 and v2 were scored on).
Internal (Gazipur) rows keep v1's leakage-safe splits from data/splits.csv, so internal test is comparable.
Other sources are split 80/10/10 by perceptual-hash group, so near-duplicates stay on one side.

Outputs in /kaggle/working/v3/<arch>/: model.onnx, calibration.json, metrics.json, preds_<set>.npz.
"""
import csv, glob, hashlib, io, json, math, os, random, subprocess, sys, time
from collections import Counter, defaultdict
from multiprocessing import Pool

W = "/kaggle/working"; T = "/tmp/agro"; IN = "/kaggle/input"; os.makedirs(T, exist_ok=True)
OUT = f"{W}/eda"; os.makedirs(OUT, exist_ok=True)
def run(cmd, cwd=None):
    print("\n$ " + " ".join(cmd), flush=True)
    if subprocess.run(cmd, cwd=cwd).returncode: sys.exit(f"STEP FAILED: {cmd}")
REPO = f"{T}/AgroLeaf-AI"
run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "imagehash", "onnx", "onnxruntime", "onnxscript", "timm"])
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F, timm, imagehash
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.transforms as TV

CLASSES = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight", "other_rice", "not_rice"]
CI = {c: i for i, c in enumerate(CLASSES)}
RICE6 = CLASSES[:6]
IMG = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
SEED = 42; random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)

def norm_key(name):
    """Folder name -> class key. Diseases the app does not cover become other_rice."""
    n = name.lower().replace("_", " ").replace("-", " ")
    if n in ("bo",): return "brown_spot"   # Taiwan (raingel): Bipolaris oryzae
    if n in ("mo",): return "blast"        # Taiwan: Magnaporthe oryzae
    if n in ("he",): return "other_rice"   # Taiwan: herbicide damage
    if "healthy" in n or "normal" in n or n == "no disease": return "healthy"
    if "false smut" in n: return "other_rice"
    if "smut" in n: return "leaf_smut"
    if "tungro" in n: return "tungro"
    if "sheath" in n: return "sheath_blight"
    if "narrow" in n: return "other_rice"
    if "blast" in n: return "blast"
    if "brown" in n: return "brown_spot"
    if any(k in n for k in ("bacterial", "blight", "streak", "hispa", "dead heart", "downy", "scald", "panicle")): return "other_rice"
    return None

def find_root(token, min_hits=3, exclude=()):
    best = None
    for root, dirs, _ in os.walk(IN):
        rl = root.lower()
        if token not in rl or any(e in rl for e in exclude): continue
        hits = [d for d in dirs if norm_key(d)]
        if len(hits) >= min_hits:
            n = sum(len([f for f in os.listdir(os.path.join(root, d)) if f.lower().endswith(IMG)]) for d in hits)
            if n and (best is None or n > best[1]): best = (root, n)
    return best[0] if best else None

ROWS = []  # dicts: src, path, label, split
def add_folder_source(src, root, split_mode="hash"):
    if not root: print("MISSING SOURCE", src, flush=True); return
    c = Counter()
    for d in sorted(os.listdir(root)):
        k = norm_key(d)
        if not k or not os.path.isdir(os.path.join(root, d)): continue
        for r, _, fs in os.walk(os.path.join(root, d)):
            for f in sorted(fs):
                if f.lower().endswith(IMG):
                    ROWS.append({"src": src, "path": os.path.join(r, f), "label": k, "split": split_mode}); c[k] += 1
    print(src, root, dict(c), flush=True)

# 1. Gazipur internal set with v1's splits
orig = next(r for r, d, f in os.walk(IN) if os.path.basename(r) == "Original images")
with open(f"{REPO}/data/splits.csv", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        p = os.path.join(orig, r["path"])
        if os.path.exists(p): ROWS.append({"src": "gazipur", "path": p, "label": r["class_key"], "split": r["split"]})
print("gazipur", Counter((r["split"]) for r in ROWS if r["src"] == "gazipur"), flush=True)
# 2. other rice sources
add_folder_source("savar", find_root("riceleafdisease-bd5", exclude=("annotated images",)))
def add_all_roots(src, token, exclude=(), split_mode="extval"):
    roots = []
    for root, dirs, _ in os.walk(IN):
        rl = root.lower()
        if token in rl and not any(e in rl for e in exclude) and len([d for d in dirs if norm_key(d)]) >= 3: roots.append(root)
    roots = [r for r in roots if not any(r != o and r.startswith(o + os.sep) for o in roots)]
    for r in roots: add_folder_source(src, r, split_mode=split_mode)
    if not roots: print("MISSING SOURCE", src, flush=True)
add_all_roots("raihan_bd", "rice-leaf-diseases-dataset", exclude=("augment",), split_mode="hash")  # v5: training data
# v6: expanded rice data (measured in v3/v4 to hurt; re-tested here with the same v5 recipe)
add_folder_source("dhan_shomadhan_bd", find_root("dhan-shomadhan"), split_mode="hash")  # v7: training data
# v8: international field photos (licences in run8_v8/PROTOCOL.md); Vietnam and Karnataka excluded
add_folder_source("paddy_doctor_in", find_root("paddy-doctor"))
add_folder_source("sethy_in", find_root("rice-leaf-disease-image"))
add_folder_source("taiwan_tw", find_root("raingel"))
# EDA only: unseen Bangladeshi / Indian test sets, used for unsupervised distances only
add_folder_source("sylhet_bd", find_root("riceleafbd-mendeley"), split_mode="heldout")
add_folder_source("gujarat_in", find_root("vbookshelf"), split_mode="heldout")
# The Kaggle copy names its sheath blight folder "Rice___bacterial_blight", but every file there is
# sb_wb_*.jpg; the filename codes match Dhan-Shomadhan's published classes (Mendeley 10.17632/znsxdctwtt.1).
# All files carry _wb_: this copy is the white-background subset (769 of 1,106).
DHAN_CODE = {"sb": "sheath_blight", "rb": "blast", "bs": "brown_spot", "rt": "tungro", "ls": "other_rice"}
relabel = Counter()
for r in ROWS:
    if r["src"] == "dhan_shomadhan_bd":
        code = os.path.basename(r["path"]).split("_")[0].lower()
        if code not in DHAN_CODE: sys.exit(f"unexpected Dhan-Shomadhan file name: {r['path']}")
        if DHAN_CODE[code] != r["label"]: relabel[(r["label"], DHAN_CODE[code])] += 1
        r["label"] = DHAN_CODE[code]
print("Dhan-Shomadhan relabelled from filename codes (folder label -> true label):", dict(relabel), flush=True)
# Gujarat (UCI, 120 photos incl. 40 leaf smut): the only leaf-smut photos from outside Gazipur.
# Too few to change training, so they are kept as an independent external TEST set (never trained on).
# DIU Bangladesh raw set: the v5 final test (never trained on)
# Direct download of the two raw parquet files (the HF `datasets` loader failed on Kaggle)
import urllib.request, io as _io, pyarrow.parquet as pq
DIU_URL = "https://huggingface.co/datasets/Project-AgML/rice_disease_classification_bangladesh/resolve/main/raw/train-0000{}-of-00002.parquet"
# class names from the parquet metadata: Healthy, Insect, Leaf Scald, Rice, Rice Blast, Rice Leaffolder,
# Rice Stripes, Rice Tungro. "Rice" (unclear) is excluded, per PROTOCOL.md
DIU_MAP = {"healthy": "healthy", "rice blast": "blast", "rice tungro": "tungro", "leaf scald": "other_rice",
           "insect": "other_rice", "rice leaffolder": "other_rice", "rice stripes": "other_rice"}
os.makedirs(f"{T}/diu", exist_ok=True); diu_counts = Counter(); diu_skipped = Counter(); n_img = 0
for shard in (0, 1):
    local = f"{T}/diu_raw_{shard}.parquet"
    urllib.request.urlretrieve(DIU_URL.format(shard), local)
    pf = pq.ParquetFile(local)
    names = json.loads(pf.schema_arrow.metadata[b"huggingface"])["info"]["features"]["label"]["names"]
    tbl = pf.read()
    for img, lab in zip(tbl["image"].to_pylist(), tbl["label"].to_pylist()):
        raw_name = names[lab]; key = DIU_MAP.get(raw_name.strip().lower())
        if key is None: diu_skipped[raw_name] += 1; continue
        pth = f"{T}/diu/{n_img:05d}.jpg"; n_img += 1
        Image.open(_io.BytesIO(img["bytes"])).convert("RGB").save(pth, quality=95)
        ROWS.append({"src": "diu_bd", "path": pth, "label": key, "split": "heldout"}); diu_counts[(raw_name, key)] += 1
print("DIU used:", dict(diu_counts), "| skipped (unmapped):", dict(diu_skipped), flush=True)
AMAN_URL = "https://huggingface.co/api/datasets/Project-AgML/rice_leaf_disease_classification_bd/parquet/default/train/0.parquet"
AMAN_MAP = {"healthy": "healthy", "leaf_blast": "blast", "brown_spot": "brown_spot", "bacterial_leaf_blight": "other_rice",
            "leaf_scald": "other_rice", "narrow_brown_spot": "other_rice"}
os.makedirs(f"{T}/aman", exist_ok=True); aman_counts = Counter()
urllib.request.urlretrieve(AMAN_URL, f"{T}/aman.parquet")
pf = pq.ParquetFile(f"{T}/aman.parquet")
names = json.loads(pf.schema_arrow.metadata[b"huggingface"])["info"]["features"]["label"]["names"]
tbl = pf.read()
for k, (img, lab) in enumerate(zip(tbl["image"].to_pylist(), tbl["label"].to_pylist())):
    key = AMAN_MAP[names[lab]]; pth = f"{T}/aman/{k:05d}.jpg"
    Image.open(_io.BytesIO(img["bytes"])).convert("RGB").save(pth, quality=95)
    ROWS.append({"src": "aman_bd", "path": pth, "label": key, "split": "heldout"}); aman_counts[(names[lab], key)] += 1
print("Aman 2025 used:", dict(aman_counts), flush=True)
# 3. not-rice sources (capped per source so they do not swamp the rice classes)
rng = random.Random(SEED)
def add_neg(src, token, cap):
    files = sorted(p for p in glob.glob(f"{IN}/**/*", recursive=True) if token in p.lower() and p.lower().endswith(IMG))
    rng.shuffle(files); files = files[:cap]
    for p in files: ROWS.append({"src": src, "path": p, "label": "not_rice", "split": "hash"})
    print(src, len(files), flush=True)

# 4. resize everything once (shorter side 288) into a local cache; perceptual-hash groups for splitting
CACHE = f"{T}/cache"; os.makedirs(CACHE, exist_ok=True)
def prep(i_row):
    i, r = i_row
    out = f"{CACHE}/{i}.jpg"
    try:
        with Image.open(r["path"]) as im:
            orient = im.getexif().get(0x0112, 1); raw_w, raw_h = im.size
            im.draft("RGB", (600, 600)); up = ImageOps.exif_transpose(im)
            # Correct means: Pillow cleared the orientation (EXIF or XMP) and, for EXIF tags 5-8
            # (90-degree turns), the long side swapped. A swap without an EXIF tag = XMP orientation.
            swapped = raw_w != raw_h and (raw_w > raw_h) != (up.size[0] > up.size[1])
            exif_ok = up.getexif().get(0x0112, 1) in (0, 1) and (orient not in (5, 6, 7, 8) or swapped or raw_w == raw_h)
            if orient not in (5, 6, 7, 8) and swapped: orient = "xmp_turn"
            im = up.convert("RGB")
            w, h = im.size; s = 400 / min(w, h)
            if s < 1: im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BILINEAR)
            im.save(out, quality=92)
            a = np.asarray(im.resize((128, 128))).astype(np.int16)
            border = np.concatenate([a[:16].reshape(-1, 3), a[-16:].reshape(-1, 3), a[:, :16].reshape(-1, 3), a[:, -16:].reshape(-1, 3)])
            white = float(np.mean((border.min(1) > 170) & (np.ptp(border, axis=1) < 40)))
            return i, (str(imagehash.phash(im)), white, orient, exif_ok)
    except Exception:
        return i, None
t0 = time.time()
with Pool(os.cpu_count()) as pool:
    res = pool.map(prep, list(enumerate(ROWS)), chunksize=64)
ok = []
for i, got in res:
    if got is None: continue
    r = ROWS[i]; r["cache"] = f"{CACHE}/{i}.jpg"; r["phash"], r["white"], r["exif"], r["exif_ok"] = got; ok.append(r)
ROWS = ok
print(f"cached {len(ROWS)} images in {time.time()-t0:.0f}s", flush=True)
# EXIF orientation check (raihan150146: 1,734 tagged photos in the data audit)
print("EXIF orientation tags by source:", {s_: dict(Counter(r["exif"] for r in ROWS if r["src"] == s_ and r["exif"] != 1))
                                           for s_ in sorted({r["src"] for r in ROWS})}, flush=True)
bad_exif = [r for r in ROWS if not r["exif_ok"]]
print("EXIF CHECK: images whose orientation was not corrected:", len(bad_exif), flush=True)
if bad_exif: sys.exit("EXIF correction failed for: " + ", ".join(os.path.basename(r["path"]) for r in bad_exif[:10]))
turned = [r for r in ROWS if r["src"] == "raihan_bd" and r["exif"] in (5, 6, 7, 8)][:24]
if turned:
    sheet = Image.new("RGB", (6 * 160, 4 * 160), "white")
    for k, r in enumerate(turned):
        with Image.open(r["cache"]) as im: im.thumbnail((156, 156)); sheet.paste(im, ((k % 6) * 160, (k // 6) * 160))
    sheet.save(f"{OUT}/exif_check_raihan.jpg", quality=85)
# Dhan-Shomadhan white-paper shots (56% of its blast vs 13-34% elsewhere): reported as their own set,
# kept out of the external-validation selection set so they cannot steer choices
for r in ROWS: r["white_bg"] = r["src"] == "dhan_shomadhan_bd" and "_wb_" in os.path.basename(r["path"]).lower()
print("Dhan-Shomadhan white-background shots (own report set, not used for selection):",
      dict(Counter(r["label"] for r in ROWS if r["white_bg"])), flush=True)
# identical images (same pHash, same source) with different labels: the label is unknown, drop all copies
lab_by_hash = defaultdict(set)
for r in ROWS: lab_by_hash[(r["src"], r["phash"])].add(r["label"])
conflict = [r for r in ROWS if len(lab_by_hash[(r["src"], r["phash"])]) > 1]
print("identical images with conflicting labels, all copies dropped:", len(conflict),
      [os.path.basename(r["path"]) for r in conflict[:6]], flush=True)
ROWS = [r for r in ROWS if len(lab_by_hash[(r["src"], r["phash"])]) == 1]
# exact-hash duplicates: drop later copies inside the same source; group by phash for the split
seen = set(); dedup = []
for r in ROWS:
    key = (r["src"], r["phash"])
    if r["src"] != "gazipur" and key in seen: continue
    seen.add(key); dedup.append(r)
print("dropped near-identical duplicates:", len(ROWS) - len(dedup), flush=True); ROWS = dedup
# leakage guard: no training/val image may share a perceptual hash with the held-out Sylhet test set
# near-duplicates count too: pHash within 4 bits (re-saved or resized copies)
held = np.array([int(r["phash"], 16) for r in ROWS if r["split"] in ("heldout", "extval")], dtype=np.uint64)
cand = [r for r in ROWS if r["split"] not in ("heldout", "extval")]
ch = np.array([int(r["phash"], 16) for r in cand], dtype=np.uint64)
is_leak = np.zeros(len(cand), bool)
for i in range(0, len(ch), 256):
    x = np.bitwise_xor(ch[i:i + 256, None], held[None, :])
    bits = np.unpackbits(x.view(np.uint8).reshape(x.shape + (8,)), axis=-1).sum(-1)
    is_leak[i:i + 256] = bits.min(1) <= 4
leak = [r for r, b in zip(cand, is_leak) if b]
print("LEAKAGE GUARD: training/val rows within 4 pHash bits of a DIU or Aman 2025 test image, dropped:",
      len(leak), dict(Counter(r["src"] for r in leak)), flush=True)
drop = {id(r) for r in leak}
ROWS = [r for r in ROWS if id(r) not in drop]
for r in ROWS:
    if r["split"] == "hash":
        b = int(hashlib.md5((r["src"] + r["phash"]).encode()).hexdigest(), 16) % 10
        r["split"] = "val" if b == 0 else "test" if b == 1 else "train"
    elif r["split"] == "heldout":
        r["split"] = "heldout"


# ===== EDA for v9 (no training on our labels except linear probes for diagnostics) =====
# Methods: embedding-space EDA (generic pretrained DINOv2-small), as in t-SimCNE / fastdup / DataEval workflows:
# per-source image statistics, source separability (shortcut risk), label-noise suspects (out-of-fold probe),
# leave-one-source-out transfer of a linear probe, and how close each held-out set lies to the training pool.
# Held-out sets (DIU, Aman, Sylhet, Gujarat) are used ONLY for unsupervised distances: no labels, no predictions.
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.metrics import balanced_accuracy_score, f1_score
EOUT = f"{W}/eda"; os.makedirs(EOUT, exist_ok=True)
rice = [r for r in ROWS if r["label"] != "not_rice"]
print("rice rows for EDA:", len(rice), dict(Counter((r["src"], r["split"] == "heldout") for r in rice)), flush=True)


def img_stats(i):
    r = rice[i]
    try:
        with Image.open(r["path"]) as im0:
            w0, h0 = im0.size
        im = Image.open(r["cache"]).convert("RGB").resize((256, 256))
        a = np.asarray(im).astype(np.float32)
        hsv = np.asarray(im.convert("HSV")).astype(np.float32)
        g = a.mean(2)
        lap = (4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]).var()
        hue = hsv[..., 0] * 360 / 255
        green = float(np.mean((hue >= 60) & (hue <= 170) & (hsv[..., 1] >= 50) & (hsv[..., 2] >= 40)))
        return i, (w0, h0, float(g.mean()), float(hsv[..., 1].mean()), float(lap), green)
    except Exception:
        return i, None


with Pool(os.cpu_count()) as pool:
    st = dict(pool.map(img_stats, range(len(rice)), chunksize=64))
by_src = defaultdict(list)
for i, r in enumerate(rice):
    if st.get(i):
        by_src[r["src"]].append(st[i] + (r.get("white", 0.0),))
src_stats = {}
for s, v in by_src.items():
    v = np.array(v)
    src_stats[s] = {"n": int(len(v)), "median_w": float(np.median(v[:, 0])), "median_h": float(np.median(v[:, 1])),
                    "brightness": round(float(v[:, 2].mean()), 1), "saturation": round(float(v[:, 3].mean()), 1),
                    "sharpness_lapvar_median": round(float(np.median(v[:, 4])), 1),
                    "green_fraction": round(float(v[:, 5].mean()), 3),
                    "white_border_mean": round(float(v[:, 6].mean()), 3),
                    "classes": dict(Counter(r["label"] for r in rice if r["src"] == s))}
print("PER-SOURCE STATS:", json.dumps(src_stats), flush=True)

# embeddings from a generic model (never trained on our labels)
emb_model = timm.create_model("vit_small_patch14_dinov2.lvd142m", pretrained=True, num_classes=0, img_size=224).cuda().eval()
etf = TV.Compose([TV.Resize(256), TV.CenterCrop(224), TV.ToTensor(), TV.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])


class EDS(Dataset):
    def __len__(self):
        return len(rice)

    def __getitem__(self, i):
        with Image.open(rice[i]["cache"]) as im:
            return etf(im.convert("RGB"))


E = []
with torch.no_grad(), torch.autocast("cuda", dtype=torch.float16):
    for x in DataLoader(EDS(), batch_size=128, num_workers=4):
        E.append(emb_model(x.cuda()).float().cpu().numpy())
E = np.concatenate(E)
E = E / np.linalg.norm(E, axis=1, keepdims=True)
np.save(f"{EOUT}/embeddings.npy", E.astype(np.float16))
src = np.array([r["src"] for r in rice])
lab = np.array([r["label"] for r in rice])
held = np.array([r["split"] == "heldout" for r in rice])
pool_idx = np.flatnonzero(~held)
groups = np.array([r["src"] + r["phash"][:-1] for r in rice])  # near-duplicates stay in one fold
print("embeddings", E.shape, flush=True)
R = {"per_source": src_stats}


def oof_probe(X, y, g, C=1.0):
    classes = np.unique(y)
    p = np.zeros((len(y), len(classes)))
    for tr, te in GroupKFold(5).split(X, y, g):
        m = LogisticRegression(C=C, max_iter=2000, n_jobs=-1).fit(X[tr], y[tr])
        p[np.ix_(te, np.searchsorted(classes, m.classes_))] = m.predict_proba(X[te])
    return classes, p


# 1. source separability (high = each source has a recognisable look = shortcut risk)
cls_s, ps = oof_probe(E[pool_idx], src[pool_idx], groups[pool_idx])
R["source_separability_balanced_acc"] = round(float(balanced_accuracy_score(src[pool_idx], cls_s[ps.argmax(1)])), 4)
within = {}
for c in RICE6 + ["other_rice"]:
    ii = pool_idx[lab[pool_idx] == c]
    cs = Counter(src[ii])
    keep = [s for s, n in cs.items() if n >= 30]
    ii = ii[np.isin(src[ii], keep)]
    if len(keep) >= 2:
        cl, pp = oof_probe(E[ii], src[ii], groups[ii])
        within[c] = {"sources": keep, "balanced_acc": round(float(balanced_accuracy_score(src[ii], cl[pp.argmax(1)])), 4)}
R["source_separability_within_class"] = within
print("SOURCE SEPARABILITY:", R["source_separability_balanced_acc"], json.dumps(within), flush=True)

# 2. label-noise suspects: out-of-fold class probe on the training pool
cls_c, pc = oof_probe(E[pool_idx], lab[pool_idx], groups[pool_idx])
gi = np.searchsorted(cls_c, lab[pool_idx])
p_given = pc[np.arange(len(gi)), gi]
other = pc.copy()
other[np.arange(len(gi)), gi] = 0
sus = (p_given < 0.05) & (other.max(1) > 0.8)
R["probe_oof_macro_f1_pool"] = round(float(f1_score(lab[pool_idx], cls_c[pc.argmax(1)], average="macro")), 4)
R["label_noise_suspects"] = {
    "total": int(sus.sum()),
    "by_source_class": {f"{s}|{c}": int(n) for (s, c), n in Counter(zip(src[pool_idx][sus], lab[pool_idx][sus])).most_common()},
    "suggested_label": {f"{a}->{b}": int(n) for (a, b), n in Counter(zip(lab[pool_idx][sus], cls_c[other[sus].argmax(1)])).most_common(15)}}
print("LABEL-NOISE SUSPECTS:", json.dumps(R["label_noise_suspects"]), "| probe OOF macro-F1", R["probe_oof_macro_f1_pool"], flush=True)
order = np.argsort(p_given + (~sus) * 10)[:48]
sheet = Image.new("RGB", (8 * 160, 6 * 180), "white")
dr = ImageDraw.Draw(sheet)
for k, j in enumerate(order):
    r = rice[pool_idx[j]]
    with Image.open(r["cache"]) as im:
        im = im.convert("RGB")
        im.thumbnail((156, 156))
    x, y0 = (k % 8) * 160, (k // 8) * 180
    sheet.paste(im, (x, y0))
    dr.text((x + 2, y0 + 158), r["src"][:9] + " " + r["label"][:6] + ">" + cls_c[other[j].argmax()][:6], fill="black")
sheet.save(f"{EOUT}/label_noise_suspects.jpg", quality=85)
with open(f"{EOUT}/label_noise_suspects.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["src", "file", "label", "suggested", "p_label", "p_suggested"])
    for j in np.flatnonzero(sus):
        r = rice[pool_idx[j]]
        w.writerow([r["src"], os.path.basename(r["path"]), r["label"], cls_c[other[j].argmax()], round(float(p_given[j]), 4), round(float(other[j].max()), 4)])

# 3. leave-one-source-out linear probe (how well each source is predicted from the others)
loso = {}
for s in sorted(set(src[pool_idx])):
    te = pool_idx[src[pool_idx] == s]
    tr = pool_idx[src[pool_idx] != s]
    shared = sorted(set(lab[te]) & set(lab[tr]))
    te = te[np.isin(lab[te], shared)]
    if len(shared) < 2 or len(te) < 50:
        continue
    m = LogisticRegression(max_iter=2000, n_jobs=-1).fit(E[tr], lab[tr])
    pr = m.predict(E[te])
    loso[s] = {"n": int(len(te)), "classes": shared, "macro_f1": round(float(f1_score(lab[te], pr, labels=shared, average="macro")), 4),
               "per_class_recall": {c: round(float(np.mean(pr[lab[te] == c] == c)), 3) for c in shared}}
R["leave_one_source_out_probe"] = loso
print("LOSO PROBE:", json.dumps(loso), flush=True)

# 4. how close each held-out set lies to the training pool (cosine similarity to the nearest training image; no labels)
P = torch.tensor(E[pool_idx]).cuda().half()


def nn_sim(idx, exclude_self=False):
    out = []
    for s0 in range(0, len(idx), 1024):
        q = torch.tensor(E[idx[s0:s0 + 1024]]).cuda().half()
        sim = q @ P.T
        if exclude_self:
            rows = torch.arange(len(q)).cuda()
            cols = torch.tensor(np.searchsorted(pool_idx, idx[s0:s0 + 1024])).cuda()
            sim[rows, cols] = -1
        out.append(sim.max(1).values.float().cpu().numpy())
    return np.concatenate(out)


cov = {"train_pool_self": None}
x = nn_sim(pool_idx, True)
cov["train_pool_self"] = {q: round(float(np.percentile(x, q)), 4) for q in (10, 25, 50, 75)}
for s in sorted(set(src[held])):
    x = nn_sim(np.flatnonzero(held & (src == s)))
    cov[s] = {q: round(float(np.percentile(x, q)), 4) for q in (10, 25, 50, 75)}
R["nearest_train_similarity_percentiles"] = cov
print("TEST-DOMAIN COVERAGE (nearest-train cosine):", json.dumps(cov), flush=True)

# example sheet: 6 random images per source
srcs = sorted(set(src))
sheet = Image.new("RGB", (6 * 130, len(srcs) * 140), "white")
dr = ImageDraw.Draw(sheet)
g = random.Random(0)
for k, s in enumerate(srcs):
    ii = g.sample(list(np.flatnonzero(src == s)), min(6, int((src == s).sum())))
    for j, i in enumerate(ii):
        with Image.open(rice[i]["cache"]) as im:
            im = im.convert("RGB")
            im.thumbnail((126, 126))
        sheet.paste(im, (j * 130, k * 140))
    dr.text((2, k * 140 + 127), s, fill="red")
sheet.save(f"{EOUT}/sources.jpg", quality=85)
json.dump(R, open(f"{EOUT}/eda.json", "w"), indent=1)
print("EDA_DONE", flush=True)
