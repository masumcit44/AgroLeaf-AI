"""AgroLeaf AI v2: multi-source training (Gazipur field + Savar white-background) with Sylhet held out as an unseen-district test.
v1 is re-evaluated on the same Sylhet set for a fair comparison."""
import json, os, shutil, subprocess, sys, time
W = "/kaggle/working"; T = "/tmp/agro"; os.makedirs(T, exist_ok=True); IN = "/kaggle/input"
IMG = (".jpg", ".jpeg", ".png")
def run(cmd, cwd=None, ok_fail=False):
    print("\n$ " + " ".join(cmd), flush=True); t = time.time()
    r = subprocess.run(cmd, cwd=cwd); print(f"[exit {r.returncode} in {time.time()-t:.0f}s]", flush=True)
    if r.returncode and not ok_fail: sys.exit(f"STEP FAILED: {cmd}")
    return r.returncode
REPO = f"{T}/AgroLeaf-AI"
run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "imagehash", "onnx", "onnxruntime", "onnxscript"])
CM = json.load(open(f"{REPO}/ml/class_map.json"))["rice_leaf_disease_bd_v3"]   # folder -> key
KEY2FOLDER = {v: k for k, v in CM.items()}
def norm_key(name):
    n = name.lower().replace("_", " ")
    if "narrow" in n: return "__unseen__"
    if "bacterial" in n or "blb" in n: return "__unseen__"
    if "healthy" in n or "normal" in n: return "healthy"
    if "blast" in n: return "blast"
    if "brown" in n: return "brown_spot"
    if "smut" in n: return "leaf_smut"
    if "tungro" in n: return "tungro"
    if "sheath" in n: return "sheath_blight"
    return None
def find_class_root(token, min_hits=3):
    best = None
    for root, dirs, _ in os.walk(IN):
        if token not in root.lower() or "annotated images" in root.lower(): continue
        hits = [d for d in dirs if norm_key(d)]
        if len(hits) >= min_hits:
            n = sum(len([f for f in os.listdir(os.path.join(root, d)) if f.lower().endswith(IMG)]) for d in hits)
            if n and (best is None or n > best[1]): best = (root, n)
    return best
rld = next(r for r, d, f in os.walk(IN) if os.path.basename(r) == "Original images")
bd5 = find_class_root("riceleafdisease-bd5"); syl = find_class_root("riceleafbd-mendeley")
print("RLD:", rld, "\nBD5:", bd5, "\nSYLHET:", syl, flush=True)
if not bd5 or not syl: sys.exit("source not found")
for name, (root, _) in [("BD5", bd5), ("SYLHET", syl)]:
    print(name, {d: (norm_key(d), len(os.listdir(os.path.join(root, d)))) for d in os.listdir(root) if os.path.isdir(os.path.join(root, d))}, flush=True)
# combined training source: RLD (symlinks) + BD5 mapped classes (prefixed copies); NBS excluded
comb = f"{T}/combined"
for folder in CM:
    os.makedirs(f"{comb}/{folder}", exist_ok=True)
    for f in os.listdir(os.path.join(rld, folder)):
        if f.lower().endswith(IMG): os.symlink(os.path.join(rld, folder, f), f"{comb}/{folder}/{f}")
nb = 0
for d in os.listdir(bd5[0]):
    k = norm_key(d)
    if k in KEY2FOLDER:
        for f in os.listdir(os.path.join(bd5[0], d)):
            if f.lower().endswith(IMG):
                shutil.copy(os.path.join(bd5[0], d, f), f"{comb}/{KEY2FOLDER[k]}/bd5__{f}"); nb += 1
print("BD5 images added:", nb, flush=True)
work = f"{T}/work"
run([sys.executable, "ml/prepare_dataset.py", "--raw", comb, "--work", work, "--data-dir", f"{W}/data"], cwd=REPO)
resized = next(os.path.join(work, d) for d in os.listdir(work) if os.path.isdir(os.path.join(work, d)))
splits = f"{W}/data/splits.csv"
# Sylhet external set (held out entirely)
smap = {"__doi__": "10.17632/kx9rx8p2mz.1"}
for d in os.listdir(syl[0]):
    if os.path.isdir(os.path.join(syl[0], d)): smap[d] = norm_key(d) or "__ignore__"
json.dump(smap, open(f"{T}/syl_map.json", "w"), indent=2); print("Sylhet map:", smap, flush=True)
syl_res = f"{T}/syl_320"
run([sys.executable, "ml/resize_for_upload.py", "--src", syl[0], "--out", syl_res, "--size", "320", "--quality", "92"], cwd=REPO)
EXT = ["--external", f"RiceLeafBD Sylhet-Dhaka (Kaggle copy sikanderk/riceleafbd-mendeley; unseen district)={syl_res}:{T}/syl_map.json"]
RUN = f"{W}/run2"
run([sys.executable, "ml/train.py", "--data-root", resized, "--splits", splits, "--out", RUN, "--arch", "mnv3_large", "--epochs", "25", "--num-workers", "4", "--device", "cuda"], cwd=REPO)
run([sys.executable, "ml/calibrate.py", "--run", RUN, "--data-root", resized, "--splits", splits], cwd=REPO)
run([sys.executable, "ml/export_onnx.py", "--run", RUN], cwd=REPO)
run([sys.executable, "ml/evaluate.py", "--run", RUN, "--data-root", resized, "--splits", splits] + EXT, cwd=REPO)
run([sys.executable, "ml/parity_test.py", "--run", RUN, "--data-root", resized, "--splits", splits], cwd=REPO)
# v1 on the same Sylhet set (its own internal split re-evaluated on the same resized RLD paths)
v1 = next(r for r, d, f in os.walk(IN) if "best.pt" in f and "calibration.json" in f)
v1s = next(r for r, d, f in os.walk(IN) if "splits.csv" in f and "agroleaf-train-v1" in r)
V1 = f"{W}/v1_eval"; shutil.copytree(v1, V1, dirs_exist_ok=True)
run([sys.executable, "ml/evaluate.py", "--run", V1, "--data-root", resized, "--splits", f"{v1s}/splits.csv"] + EXT, cwd=REPO, ok_fail=True)
for p in [f"{RUN}/best.pt", f"{V1}/best.pt"]:
    if os.path.exists(p): os.remove(p)
pkg = f"{W}/run2_for_app"; shutil.copytree(RUN, pkg, dirs_exist_ok=True); shutil.make_archive(pkg, "zip", pkg)
for n, p in [("V2", f"{RUN}/metrics-v1.json"), ("V1", f"{V1}/metrics-v1.json")]:
    if os.path.exists(p): print(f"===== {n} METRICS =====\n" + open(p).read(), flush=True)
print("TRAIN_V2_DONE")
