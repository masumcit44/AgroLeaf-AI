"""AgroLeaf AI v3 (large backbones, for a possible server model): multi-country rice training with two extra outputs ("other rice problem", "not a rice leaf").

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
OUT = f"{W}/v3"; os.makedirs(OUT, exist_ok=True)
def run(cmd, cwd=None):
    print("\n$ " + " ".join(cmd), flush=True)
    if subprocess.run(cmd, cwd=cwd).returncode: sys.exit(f"STEP FAILED: {cmd}")
REPO = f"{T}/AgroLeaf-AI"
run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "imagehash", "onnx", "onnxruntime", "onnxscript", "timm"])
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F, timm, imagehash
from PIL import Image, ImageDraw, ImageFont, ImageFilter
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
    if "healthy" in n or "normal" in n: return "healthy"
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
add_folder_source("sylhet", find_root("riceleafbd-mendeley"), split_mode="heldout")
add_folder_source("paddy_doctor_in", find_root("paddy-doctor"))
add_folder_source("sethy_in", find_root("rice-leaf-disease-image"))
add_folder_source("vietnam", find_root("rice-diseases-image-dataset", min_hits=2))
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
            im.draft("RGB", (600, 600)); im = im.convert("RGB")
            w, h = im.size; s = 288 / min(w, h)
            if s < 1: im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BILINEAR)
            im.save(out, quality=92)
            return i, str(imagehash.phash(im))
    except Exception as e:
        return i, None
t0 = time.time()
with Pool(os.cpu_count()) as pool:
    res = pool.map(prep, list(enumerate(ROWS)), chunksize=64)
ok = []
for i, ph in res:
    if ph is None: continue
    r = ROWS[i]; r["cache"] = f"{CACHE}/{i}.jpg"; r["phash"] = ph; ok.append(r)
ROWS = ok
print(f"cached {len(ROWS)} images in {time.time()-t0:.0f}s", flush=True)
# exact-hash duplicates: drop later copies inside the same source; group by phash for the split
seen = set(); dedup = []
for r in ROWS:
    key = (r["src"], r["phash"])
    if r["src"] != "gazipur" and key in seen: continue
    seen.add(key); dedup.append(r)
print("dropped near-identical duplicates:", len(ROWS) - len(dedup), flush=True); ROWS = dedup
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
train_tf = TV.Compose([
    TV.RandomResizedCrop(224, scale=(0.3, 1.0), ratio=(0.75, 1.33)),
    TV.RandomHorizontalFlip(), TV.RandomVerticalFlip(), TV.RandomRotation(20),
    TV.ColorJitter(0.35, 0.35, 0.3, 0.04), TV.RandomGrayscale(0.03),
    TV.RandomApply([TV.GaussianBlur(5, (0.1, 2.0))], p=0.2),
    TV.ToTensor(), TV.Normalize(MEAN, STD), TV.RandomErasing(p=0.15)])
eval_tf = TV.Compose([TV.Resize(256), TV.CenterCrop(224), TV.ToTensor(), TV.Normalize(MEAN, STD)])  # same as the app
class DS(Dataset):
    def __init__(self, rows, tf): self.rows, self.tf = rows, tf
    def __len__(self): return len(self.rows)
    def __getitem__(self, i):
        r = self.rows[i]
        with Image.open(r["cache"]) as im: x = self.tf(im.convert("RGB"))
        return x, CI[r["label"]]
tr = [r for r in ROWS if r["split"] == "train"]
va = [r for r in ROWS if r["split"] == "val"]
# sampling: every class gets equal mass; inside a class, each source gets mass ~ sqrt(its size)
cs = Counter((r["label"], r["src"]) for r in tr); cl = defaultdict(float)
for (lab, src), n in cs.items(): cl[lab] += math.sqrt(n)
wts = [math.sqrt(cs[(r["label"], r["src"])]) / cl[r["label"]] / cs[(r["label"], r["src"])] for r in tr]

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

def train(arch, epochs, lr):
    print(f"\n===== {arch} =====", flush=True)
    model = timm.create_model(arch, pretrained=True, num_classes=len(CLASSES)).cuda()
    sampler = WeightedRandomSampler(wts, num_samples=24000, replacement=True, generator=torch.Generator().manual_seed(SEED))
    dl = DataLoader(DS(tr, train_tf), batch_size=48, sampler=sampler, num_workers=4, drop_last=True, persistent_workers=True)
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

def report(arch, model):
    d = f"{OUT}/{arch}"; os.makedirs(d, exist_ok=True)
    sets = defaultdict(list)
    for r in ROWS:
        if r["split"] in ("val", "test", "heldout"): sets[(r["src"], r["split"])].append(r)
    logits = {k: evaluate(model, v) for k, v in sets.items()}
    for (src, sp), v in sets.items():
        np.savez_compressed(f"{d}/preds_{src}_{sp}.npz", logits=logits[(src, sp)],
                            y=np.array([CI[r["label"]] for r in v]), files=np.array([os.path.basename(r["path"]) for r in v]))
    vl = np.concatenate([logits[k] for k in logits if k[1] == "val"]); vy = np.concatenate([[CI[r["label"]] for r in sets[k]] for k in logits if k[1] == "val"])
    temp = fit_temperature(vl, vy); pv = softmax(vl, temp)
    # threshold: smallest one where answered rice predictions on val are >= 92% correct
    thr = 0.5
    for t in np.arange(0.30, 0.96, 0.01):
        top, ans = decide(pv, t)
        if ans.sum() and np.mean(top[ans] == vy[ans]) >= 0.92: thr = float(round(t, 2)); break
    M = {"arch": arch, "classes": CLASSES, "temperature": temp, "threshold": thr, "sets": {}}
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
        M["sets"][f"{src}/{sp}"] = m
        print(arch, src, sp, json.dumps({k: (round(x, 4) if isinstance(x, float) else x) for k, x in m.items()}), flush=True)
    json.dump(M, open(f"{d}/metrics.json", "w"), indent=2)
    json.dump({"temperature": temp, "threshold": thr, "classes": CLASSES}, open(f"{d}/calibration.json", "w"), indent=2)
    # ONNX export (input "input", output "logits"), then parity against PyTorch
    model.eval().cpu(); x = torch.randn(1, 3, 224, 224)
    kw = dict(input_names=["input"], output_names=["logits"], opset_version=17)
    try: torch.onnx.export(model, x, f"{d}/model.onnx", dynamo=False, **kw)
    except TypeError: torch.onnx.export(model, x, f"{d}/model.onnx", **kw)  # older torch has no dynamo flag
    import onnxruntime as ort
    s = ort.InferenceSession(f"{d}/model.onnx", providers=["CPUExecutionProvider"])
    xb = torch.stack([DS(va[:64], eval_tf)[i][0] for i in range(min(64, len(va)))])
    with torch.no_grad(): pt = model(xb).numpy()
    on = s.run(None, {"input": xb.numpy()})[0]
    print(arch, "ONNX MB", round(os.path.getsize(f"{d}/model.onnx") / 2**20, 2), "parity max|diff|", float(np.abs(pt - on).max()), flush=True)
    model.cuda()

for arch, ep, lr in [("convnext_tiny.fb_in22k", 12, 2e-4), ("tf_efficientnetv2_s.in21k_ft_in1k", 12, 5e-4)]:
    m = train(arch, ep, lr); report(arch, m); del m; torch.cuda.empty_cache()
with open(f"{OUT}/rows.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["src", "split", "label", "file"])
    for r in ROWS: w.writerow([r["src"], r["split"], r["label"], os.path.basename(r["path"])])
print("V3_DONE")
