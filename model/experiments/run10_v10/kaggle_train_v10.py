"""AgroLeaf AI v10 - run10_v10/PROTOCOL.md: v8 recipe (EfficientNet-B0, 320) + DIU half A as training/val/test data.
DIU half B, Aman 2025, Sylhet and Gujarat are held out; their logits are saved, no metrics printed."""
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
OUT = f"{W}/v10"; os.makedirs(OUT, exist_ok=True)
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
# final tests, held out (as in v9): Sylhet (RiceLeafBD Sylhet-Dhaka) and Gujarat
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
        up = ImageOps.exif_transpose(Image.open(_io.BytesIO(img["bytes"]))).convert("RGB"); uw, uh = up.size
        if max(uw, uh) > 1024: up = up.resize((round(uw * 1024 / max(uw, uh)), round(uh * 1024 / max(uw, uh))), Image.BILINEAR)
        half = "A" if int(hashlib.md5(str(imagehash.phash(up))[:-1].encode()).hexdigest(), 16) % 2 == 0 else "B"
        # v10: half A is training/val/test data (hash split); half B stays a held-out final test
        ROWS.append({"src": "diu_bd" if half == "A" else "diu_bd_b", "path": pth, "label": key, "split": "hash" if half == "A" else "heldout"})
        diu_counts[(raw_name, key, half)] += 1
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
add_neg("natural", "natural-images", 2500)
add_neg("plantvillage", "plantdisease", 2500)
add_neg("posters", "movie-genre-from-its-poster", 2000)
add_neg("memes", "memotion", 2000)

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

# 5. generated graphics (text, shapes, gradients; often green) for the not_rice class
GEN = f"{T}/gen"; os.makedirs(GEN, exist_ok=True)
fonts = [p for p in glob.glob("/usr/share/fonts/**/*.ttf", recursive=True)][:40]
words = "AI BATTLE PODCAST JOIN LIVE NOW SALE OFFER WELCOME NEWS 2026 BANGLADESH FARM SCHOOL EVENT SHOW".split()
def gen_img(i):
    g = random.Random(1000 + i); W_, H_ = g.choice([(320, 320), (288, 400), (400, 288)])
    c1 = tuple(g.randint(0, 255) for _ in range(3)); c2 = tuple(g.randint(0, 255) for _ in range(3))
    if g.random() < 0.5: c1 = (g.randint(0, 60), g.randint(80, 220), g.randint(0, 80))  # green-heavy, like the poster that fooled v1
    im = Image.new("RGB", (W_, H_), c1); d = ImageDraw.Draw(im)
    for y in range(H_):
        a = y / H_ * g.random()
        d.line([(0, y), (W_, y)], fill=tuple(int(c1[k] * (1 - a) + c2[k] * a) for k in range(3)))
    for _ in range(g.randint(1, 6)):
        x0, y0 = g.randint(0, W_), g.randint(0, H_); x1, y1 = x0 + g.randint(20, 200), y0 + g.randint(20, 200)
        col = tuple(g.randint(0, 255) for _ in range(3))
        (d.ellipse if g.random() < 0.5 else d.rectangle)([x0, y0, x1, y1], fill=col)
    for _ in range(g.randint(1, 5)):
        try: font = ImageFont.truetype(g.choice(fonts), g.randint(14, 60)) if fonts else ImageFont.load_default()
        except Exception: font = ImageFont.load_default()
        d.text((g.randint(0, W_ - 40), g.randint(0, H_ - 20)), " ".join(g.sample(words, g.randint(1, 3))),
               fill=tuple(g.randint(0, 255) for _ in range(3)), font=font)
    if g.random() < 0.3: im = im.filter(ImageFilter.GaussianBlur(g.random() * 2))
    p = f"{GEN}/{i}.jpg"; im.save(p, quality=90); return p
for i in range(3000):
    p = gen_img(i)
    ROWS.append({"src": "generated", "path": p, "cache": p, "label": "not_rice", "split": "val" if i % 10 == 0 else "test" if i % 10 == 1 else "train"})
print("split x source:", Counter((r["src"], r["split"]) for r in ROWS), flush=True)
print("train class counts:", Counter(r["label"] for r in ROWS if r["split"] == "train"), flush=True)

# 6. data
MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
class Rot90:
    def __call__(self, im): return im.rotate(90 * random.randint(0, 3), expand=True)
class JPEG:
    def __init__(self, p=0.5): self.p = p
    def __call__(self, im):
        if random.random() > self.p: return im
        b = io.BytesIO(); im.save(b, "JPEG", quality=random.randint(30, 90)); b.seek(0); return Image.open(b).convert("RGB")
COMMON_TF = [TV.RandomHorizontalFlip(), TV.RandomVerticalFlip(), TV.RandomRotation(20),
             TV.ColorJitter(0.35, 0.35, 0.3, 0.04), TV.RandomGrayscale(0.03),
             TV.RandomApply([TV.GaussianBlur(5, (0.1, 2.0))], p=0.2),
             TV.ToTensor(), TV.Normalize(MEAN, STD), TV.RandomErasing(p=0.15)]
def strong_aug(size):
    return TV.Compose([Rot90(), JPEG(0.5), TV.RandomResizedCrop(size, scale=(0.25, 1.0), ratio=(0.75, 1.33))] + COMMON_TF)
def make_eval(size):  # same as the app: Resize(size * 8 / 7) + CenterCrop(size)
    return TV.Compose([TV.Resize(round(size * 8 / 7)), TV.CenterCrop(size), TV.ToTensor(), TV.Normalize(MEAN, STD)])
SIZE = 224; eval_tf = make_eval(SIZE)
class DS(Dataset):
    def __init__(self, rows, tf): self.rows, self.tf = rows, tf
    def __len__(self): return len(self.rows)
    def __getitem__(self, i):
        r = self.rows[i]
        with Image.open(r["cache"]) as im: x = self.tf(im.convert("RGB"))
        return x, CI[r["label"]]
# Selection set for every variant (epoch, temperature, threshold, variant): external-validation field
# photos (raihan + Dhan-Shomadhan, not white-paper) plus the not_rice validation rows.
# Sylhet and Gujarat ("heldout") are never used for any choice, only reported.
va = [r for r in ROWS if r["split"] == "val"]
print("selection set:", dict(Counter((r["src"], r["label"]) for r in va)), flush=True)
BD_RICE = {"gazipur", "savar", "raihan_bd", "dhan_shomadhan_bd"}
def sample_weights(tr):
    """Every class gets equal mass; inside a class each source gets mass ~ sqrt(its size)."""
    cs = Counter((r["label"], r["src"]) for r in tr); cl = defaultdict(float)
    for (lab, src), n in cs.items(): cl[lab] += math.sqrt(n)
    return [math.sqrt(cs[(r["label"], r["src"])]) / cl[r["label"]] / cs[(r["label"], r["src"])] for r in tr]

def evaluate(model, rows, bs=128):
    model.eval(); L = []
    dl = DataLoader(DS(rows, eval_tf), batch_size=bs, num_workers=4)
    with torch.no_grad(), torch.autocast("cuda", dtype=torch.float16):
        for x, _ in dl: L.append(model(x.cuda()).float().cpu())
    return torch.cat(L).numpy()
def macro_f1(y, p, labels):
    f = []
    for c in labels:
        tp = np.sum((p == c) & (y == c)); fp = np.sum((p == c) & (y != c)); fn = np.sum((p != c) & (y == c))
        if tp + fn == 0: continue
        f.append(2 * tp / max(1, 2 * tp + fp + fn))
    return float(np.mean(f))

def train(arch, epochs, lr, tr, train_tf):
    print(f"\n===== {arch}: {len(tr)} training rows =====", flush=True)
    torch.manual_seed(SEED); random.seed(SEED)
    model = timm.create_model(arch, pretrained=True, num_classes=len(CLASSES)).cuda()
    sampler = WeightedRandomSampler(sample_weights(tr), num_samples=24000, replacement=True, generator=torch.Generator().manual_seed(SEED))
    dl = DataLoader(DS(tr, train_tf), batch_size=64, sampler=sampler, num_workers=4, drop_last=True, persistent_workers=True)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.02)
    steps = epochs * len(dl); sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=steps, pct_start=0.08)
    scaler = torch.cuda.amp.GradScaler(); crit = nn.CrossEntropyLoss(label_smoothing=0.1)
    yv = np.array([CI[r["label"]] for r in va]); best = (-1, None)
    for ep in range(epochs):
        model.train(); t = time.time(); tot = 0
        for x, y in dl:
            x, y = x.cuda(non_blocking=True), y.cuda(non_blocking=True)
            with torch.autocast("cuda", dtype=torch.float16): loss = crit(model(x), y)
            opt.zero_grad(set_to_none=True); scaler.scale(loss).backward(); scaler.step(opt); scaler.update(); sched.step()
            tot += loss.item()
        lv = evaluate(model, va); f1 = macro_f1(yv, lv.argmax(1), range(len(CLASSES)))
        print(f"{arch} ep{ep+1}/{epochs} loss {tot/len(dl):.3f} val macroF1 {f1:.4f} ({time.time()-t:.0f}s)", flush=True)
        if f1 > best[0]: best = (f1, {k: v.detach().clone() for k, v in model.state_dict().items()})
    model.load_state_dict(best[1]); print(f"{arch} best val macroF1 {best[0]:.4f}", flush=True)
    return model

def fit_temperature(logits, y):
    lt = torch.tensor(logits); yt = torch.tensor(y)
    best = min((F.cross_entropy(lt / t, yt).item(), t) for t in np.arange(0.3, 3.01, 0.02))
    return float(best[1])
def softmax(l, t):
    z = l / t; z = z - z.max(1, keepdims=True); e = np.exp(z); return e / e.sum(1, keepdims=True)
def decide(p, thr):
    """Mirror of the planned app rule: answer only for the 6 known classes (leaf smut excluded),
    otherwise not sure / not a leaf / other problem."""
    top = p.argmax(1); conf = p.max(1)
    answer = (top < 6) & (top != CI["leaf_smut"]) & (conf >= thr)
    return top, answer

TARGET_SELECTIVE_ACC = 0.92
def report(name, arch, model):
    d = f"{OUT}/{name}"; os.makedirs(d, exist_ok=True)
    sets = defaultdict(list)
    for r in ROWS:
        if r["split"] in ("val", "test", "heldout", "extval"):
            sets[(r["src"] + ("_whitebg" if r.get("white_bg") else ""), r["split"])].append(r)
    logits = {k: evaluate(model, v) for k, v in sets.items()}
    for (src, sp), v in sets.items():
        np.savez_compressed(f"{d}/preds_{src}_{sp}.npz", logits=logits[(src, sp)],
                            y=np.array([CI[r["label"]] for r in v]), files=np.array([os.path.basename(r["path"]) for r in v]))
    vl = evaluate(model, va); vy = np.array([CI[r["label"]] for r in va])
    temp = fit_temperature(vl, vy); pv = softmax(vl, temp)
    # threshold: smallest one where answers on external-validation rice photos are >= 90% right
    rice = vy < 7
    thr, reached = 0.95, False
    for t in np.arange(0.30, 0.96, 0.01):
        top, ans = decide(pv, t); a = ans & rice
        if a.sum() and np.mean(top[a] == vy[a]) >= TARGET_SELECTIVE_ACC: thr, reached = float(round(t, 2)), True; break
    print(name, f"threshold {thr} (target {TARGET_SELECTIVE_ACC} {'reached' if reached else 'NOT reached, capped at 0.95'})", flush=True)
    M = {"variant": name, "arch": arch, "classes": CLASSES, "temperature": temp, "threshold": thr,
         "threshold_target_reached": reached, "selection_macro_f1": macro_f1(vy, vl.argmax(1), range(len(CLASSES))), "sets": {}}
    for (src, sp), v in sorted(sets.items()):
        p = softmax(logits[(src, sp)], temp); y = np.array([CI[r["label"]] for r in v]); top, ans = decide(p, thr)
        known = y < 6; m = {"n": int(len(y))}
        if known.any():
            m["accuracy_known6"] = float(np.mean(top[known] == y[known]))
            m["macro_f1_known6"] = macro_f1(y[known], top[known], range(6))
            m["coverage_known6"] = float(np.mean(ans[known]))
            m["selective_accuracy_known6"] = float(np.mean(top[known & ans] == y[known & ans])) if (known & ans).any() else None
        other = y == CI["other_rice"]
        if other.any(): m["other_rice_not_given_wrong_disease"] = float(np.mean(~ans[other]))
        neg = y == CI["not_rice"]
        if neg.any():
            m["not_rice_rejected"] = float(np.mean(~ans[neg]))
            m["not_rice_called_not_rice"] = float(np.mean(top[neg] == CI["not_rice"]))
        if sp == "heldout": continue  # DIU / Aman: saved logits only, scored locally under the protocol
        M["sets"][f"{src}/{sp}"] = m
        print(name, src, sp, json.dumps({k: (round(x, 4) if isinstance(x, float) else x) for k, x in m.items()}), flush=True)
    json.dump(M, open(f"{d}/metrics.json", "w"), indent=2)
    json.dump({"temperature": temp, "threshold": thr, "classes": CLASSES, "input_size": SIZE, "resize_shorter": round(SIZE * 8 / 7)},
              open(f"{d}/calibration.json", "w"), indent=2)
    # ONNX export (input "input", output "logits"), then parity against PyTorch
    model.eval().cpu(); x = torch.randn(1, 3, SIZE, SIZE)
    kw = dict(input_names=["input"], output_names=["logits"], opset_version=17,
              dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}})
    try: torch.onnx.export(model, x, f"{d}/model.onnx", dynamo=False, **kw)
    except TypeError: torch.onnx.export(model, x, f"{d}/model.onnx", **kw)  # older torch has no dynamo flag
    import onnxruntime as ort
    s = ort.InferenceSession(f"{d}/model.onnx", providers=["CPUExecutionProvider"])
    xb = torch.stack([DS(va[:64], eval_tf)[i][0] for i in range(min(64, len(va)))])
    with torch.no_grad(): pt = model(xb).numpy()
    on = s.run(None, {"input": xb.numpy()})[0]
    print(name, "ONNX MB", round(os.path.getsize(f"{d}/model.onnx") / 2**20, 2), "parity max|diff|", float(np.abs(pt - on).max()), flush=True)
    model.cuda()

# Ablation, same backbone/seed/schedule, one change per comparison:
#   A vs B: all countries vs Bangladesh-only rice data     A vs C: new vs v3 augmentation
ARCH, EPOCHS, LR = "efficientnet_b0", 14, 1e-3  # v3: best val at the last epoch, about 100 s per epoch
VARIANTS = [
    {"name": "V10_b0_320_diuA", "arch": "efficientnet_b0", "size": 320},
]
for v in VARIANTS:
    SIZE = v["size"]; eval_tf = make_eval(SIZE)
    tr = [r for r in ROWS if r["split"] == "train"]
    m = train(v["arch"], EPOCHS, LR, tr, strong_aug(SIZE)); report(v["name"], v["arch"], m); del m; torch.cuda.empty_cache()
summary = {v["name"]: json.load(open(f"{OUT}/{v['name']}/metrics.json"))["selection_macro_f1"] for v in VARIANTS}
print("VARIANT SELECTION (external-validation macro-F1):", json.dumps(summary), flush=True)
with open(f"{OUT}/rows.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["src", "split", "label", "file"])
    for r in ROWS: w.writerow([r["src"], r["split"], r["label"], os.path.basename(r["path"])])
print("V10_DONE")
