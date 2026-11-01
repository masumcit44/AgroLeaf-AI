"""Unified evaluation: every candidate model on exactly the same images.

The image list is rebuilt with v4's own data-assembly code (run4_v4/kaggle_train_v4.py,
everything before "# 6. data") and checked file-by-file against the rows.csv that the v4
run wrote, so all models see the same samples, preprocessing and labels.

Writes, per model and per evaluation set, the raw logits (no decisions are made here):
/kaggle/working/eval/<model>/<src>__<split>.npz with logits, y, files, leaf_fraction.
Decisions and metrics are computed offline with ml/tools/eval_app.py and the app's
decision rule (ml/app_decision.py). Also records model size and CPU latency.
"""
import csv, glob, json, os, subprocess, sys, time
from collections import Counter

W = "/kaggle/working"; IN = "/kaggle/input"
SRC = "/tmp/agro_eval_src"
subprocess.run(["git", "clone", "--depth", "1", "--branch", "feat/model-v3",
                "https://github.com/masumcit44/AgroLeaf-AI.git", SRC], check=True)
v4_code = open(f"{SRC}/model/experiments/run4_v4/kaggle_train_v4.py", encoding="utf-8").read()
head = v4_code.split("# 6. data")[0]
# Run in this module's globals: v4's code uses multiprocessing.Pool with a function it defines,
# which must be picklable as __main__.prep
exec(compile(head, "kaggle_train_v4.py[data]", "exec"), globals())  # builds ROWS with cached images
ns = globals()

import numpy as np, onnxruntime as ort
import torchvision.transforms as TV
from PIL import Image

# 0. candidate models: private dataset agroleaf-candidates (files copied from the training runs; SHA-256
#    in SHA256SUMS.txt). Sub-folders were uploaded as zips; unpack them if Kaggle kept them zipped.
import zipfile, hashlib
CAND = "/tmp/candidates"
# keep sub-folders: paths are taken relative to the dataset root, not to each walked folder
CAND_ROOT = next(r for r, d, f in os.walk(IN) if r.rstrip("/").endswith("agroleaf-candidates"))
for r, d, f in os.walk(CAND_ROOT):
        for fn in f:
            src = os.path.join(r, fn); dst = os.path.join(CAND, os.path.relpath(src, CAND_ROOT))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if fn.endswith(".zip"):
                with zipfile.ZipFile(src) as z: z.extractall(os.path.join(CAND, fn[:-4]))
            else:
                with open(src, "rb") as a, open(dst, "wb") as b: b.write(a.read())
sum_file = glob.glob(f"{CAND}/**/SHA256SUMS.txt", recursive=True)[0]
sums = dict(l.split(" *")[::-1] for l in open(sum_file).read().splitlines() if l.strip())
for rel, h in sums.items():
    got = hashlib.sha256(open(glob.glob(f"{CAND}/**/{rel}", recursive=True)[0], "rb").read()).hexdigest()
    if got != h: sys.exit(f"CHECKSUM MISMATCH {rel}")
print("candidate models verified by SHA-256:", sorted(sums), flush=True)

# 1. same samples as the v4 run
def find(pred):
    for r, d, f in os.walk(IN):
        if pred(r, f): return r
    return None
EVAL = [r for r in ROWS if r["split"] in ("val", "test", "heldout", "extval")]
sets = {}
for r in EVAL:
    sets.setdefault(f"{r['src']}{'_whitebg' if r.get('white_bg') else ''}__{r['split']}", []).append(r)
print({k: len(v) for k, v in sets.items()}, flush=True)

# The v4 run's own per-set prediction files list every evaluation image (file name and label, in
# order); its rows.csv was never written (the run stopped at the end, in the v1 baseline step).
v4_A = os.path.dirname(glob.glob(f"{CAND}/**/v4_A_all_strong/metrics.json", recursive=True)[0])
theirs = {os.path.basename(p)[len("preds_"):-len(".npz")]: p for p in glob.glob(f"{v4_A}/preds_*.npz")}
problems = []
for k, v in sets.items():
    src_wb, split = k.split("__")
    p = theirs.pop(f"{src_wb}_{split}", None)
    if p is None: problems.append(f"{k}: not in the v4 run"); continue
    z = np.load(p)
    mine = [(os.path.basename(r["path"]), CI[r["label"]]) for r in v]
    if mine != list(zip(z["files"].tolist(), z["y"].tolist())): problems.append(f"{k}: files or labels differ")
problems += [f"{k}: only in the v4 run" for k in theirs]
if problems: sys.exit("SAMPLE MISMATCH with the v4 run: " + "; ".join(problems))
print("evaluation samples identical to the v4 run (file, label, order) for all", len(sets), "sets:", sum(map(len, sets.values())), "images", flush=True)

# 2. models
MODELS = {"v1_mnv3l": f"{ns['REPO']}/frontend/public/models/rice-mnv3l-v1.onnx"}
for name in ("v3_effb0", "v3_convnext_t", "v4_A_all_strong", "v4_B_bdonly_strong", "v4_C_all_v3aug"):
    MODELS[name] = glob.glob(f"{CAND}/**/{name}/model.onnx", recursive=True)[0]
print("models:", MODELS, flush=True)

# 3. inputs: the app's preprocessing (Resize 256, CenterCrop 224) on the cached images;
#    leaf-colour fraction on the same crop for v1's gate (Pillow HSV, calibration.json rule)
cal_v1 = json.load(open(f"{ns['REPO']}/frontend/public/data/calibration.json"))
lc = cal_v1["leaf_check"]
geo = TV.Compose([TV.Resize(256), TV.CenterCrop(224)])
norm = TV.Compose([TV.ToTensor(), TV.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
def inputs(rows):
    X, LF = [], []
    for r in rows:
        with Image.open(r["cache"]) as im:
            crop = geo(im.convert("RGB"))
        X.append(norm(crop).numpy())
        hsv = np.asarray(crop.convert("HSV")).reshape(-1, 3).astype(int)
        b = hsv[:, 0] * 36 // 256
        LF.append(float(np.mean((b >= lc["hue_bin_min"]) & (b <= lc["hue_bin_max"]) & (hsv[:, 1] >= lc["sat_min"]) & (hsv[:, 2] >= lc["val_min"]))))
    return np.stack(X).astype(np.float32), np.array(LF, np.float32)
cache_inputs = {k: inputs(v) for k, v in sets.items()}
print("inputs ready", flush=True)

# 4. score
os.makedirs(f"{W}/eval", exist_ok=True)
info = {}
for name, path in MODELS.items():
    sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
    inp = sess.get_inputs()[0]; fixed1 = inp.shape[0] == 1
    os.makedirs(f"{W}/eval/{name}", exist_ok=True)
    for k, v in sets.items():
        X, LF = cache_inputs[k]
        if fixed1:
            L = np.concatenate([sess.run(None, {inp.name: X[i:i + 1]})[0] for i in range(len(X))])
        else:
            L = np.concatenate([sess.run(None, {inp.name: X[i:i + 64]})[0] for i in range(0, len(X), 64)])
        np.savez_compressed(f"{W}/eval/{name}/{k}.npz", logits=L, y=np.array([CI[r["label"]] for r in v]),
                            files=np.array([os.path.basename(r["path"]) for r in v]), leaf_fraction=LF)
    # latency: one image at a time, single thread, as in the browser's /wasm build
    so = ort.SessionOptions(); so.intra_op_num_threads = 1; so.inter_op_num_threads = 1
    s1 = ort.InferenceSession(path, sess_options=so, providers=["CPUExecutionProvider"])
    x = cache_inputs[next(iter(sets))][0][:1]
    for _ in range(5): s1.run(None, {inp.name: x})
    t = []
    for _ in range(30):
        t0 = time.perf_counter(); s1.run(None, {inp.name: x}); t.append((time.perf_counter() - t0) * 1000)
    info[name] = {"file": os.path.relpath(path, CAND) if path.startswith(CAND) else "repo:frontend/public/models/rice-mnv3l-v1.onnx",
                  "sha256": hashlib.sha256(open(path, "rb").read()).hexdigest(),
                  "size_mib": round(os.path.getsize(path) / 2**20, 2), "outputs": sess.get_outputs()[0].shape[-1],
                  "cpu_ms_median_1thread": round(float(np.median(t)), 1)}
    print(name, info[name], flush=True)
json.dump({"models": info, "sets": {k: len(v) for k, v in sets.items()}, "classes": CLASSES}, open(f"{W}/eval/index.json", "w"), indent=2)
print("EVAL_UNIFIED_DONE")
