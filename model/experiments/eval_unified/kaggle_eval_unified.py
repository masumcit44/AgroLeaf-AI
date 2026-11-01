"""Unified evaluation: every candidate model on exactly the same images.

The image list is rebuilt with v4's own data-assembly code (run4_v4/kaggle_train_v4.py,
everything before "# 6. data") and checked file-by-file against the rows.csv that the v4
run wrote, so all models see the same samples, preprocessing and labels.

Writes, per model and per evaluation set, the raw logits (no decisions are made here):
/kaggle/working/eval/<model>/<src>__<split>.npz with logits, y, files, leaf_fraction.
Decisions and metrics are computed offline with ml/tools/eval_app.py and the app's
decision rule (ml/app_decision.py). Also records model size and CPU latency.
"""
import csv, json, os, subprocess, sys, time
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

# 1. same samples as the v4 run
def find(pred):
    for r, d, f in os.walk(IN):
        if pred(r, f): return r
    return None
v4_out = find(lambda r, f: "rows.csv" in f and "agroleaf-train-v4" in r)
mine = Counter((r["src"], r["split"], r["label"], os.path.basename(r["path"])) for r in ROWS)
with open(f"{v4_out}/rows.csv", encoding="utf-8") as f:
    theirs = Counter(tuple(x) for x in list(csv.reader(f))[1:])
if mine != theirs:
    sys.exit(f"SAMPLE MISMATCH with the v4 run: {sum((mine - theirs).values())} extra, {sum((theirs - mine).values())} missing")
print("sample list identical to the v4 run:", sum(mine.values()), "rows", flush=True)

EVAL = [r for r in ROWS if r["split"] in ("val", "test", "heldout", "extval")]
sets = {}
for r in EVAL:
    sets.setdefault(f"{r['src']}{'_whitebg' if r.get('white_bg') else ''}__{r['split']}", []).append(r)
print({k: len(v) for k, v in sets.items()}, flush=True)

# 2. models
MODELS = {"v1_mnv3l": f"{ns['REPO']}/frontend/public/models/rice-mnv3l-v1.onnx"}
def add_model(name, token, sub):
    root = find(lambda r, f: "model.onnx" in f and token in r and r.rstrip("/").endswith(sub))
    if root: MODELS[name] = f"{root}/model.onnx"
    else: print("MODEL NOT FOUND", name, flush=True)
add_model("v3_effb0", "agroleaf-train-v3/", "efficientnet_b0")
add_model("v3_convnext_t", "agroleaf-train-v3-big", "convnext_tiny.fb_in22k")
for v in ("A_all_strong", "B_bdonly_strong", "C_all_v3aug"):
    add_model(f"v4_{v}", "agroleaf-train-v4", v)
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
    info[name] = {"file": os.path.relpath(path, IN) if path.startswith(IN) else "repo:frontend/public/models/rice-mnv3l-v1.onnx",
                  "size_mib": round(os.path.getsize(path) / 2**20, 2), "outputs": sess.get_outputs()[0].shape[-1],
                  "cpu_ms_median_1thread": round(float(np.median(t)), 1)}
    print(name, info[name], flush=True)
json.dump({"models": info, "sets": {k: len(v) for k, v in sets.items()}, "classes": CLASSES}, open(f"{W}/eval/index.json", "w"), indent=2)
print("EVAL_UNIFIED_DONE")
