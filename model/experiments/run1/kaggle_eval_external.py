"""Re-evaluate the trained v1 model on the internal test split plus the external RiceLeafDisease-BD5 (Savar) set."""
import json, os, shutil, subprocess, sys
W = "/kaggle/working"; T = "/tmp/agro"; os.makedirs(T, exist_ok=True)
def run(cmd, cwd=None):
    print("\n$ " + " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode: sys.exit(f"STEP FAILED: {cmd}")
REPO = f"{T}/AgroLeaf-AI"
run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "imagehash", "onnx", "onnxruntime"])
IN = "/kaggle/input"
def find(pred):
    for root, dirs, files in os.walk(IN):
        if pred(root, dirs, files): return root
    return None
run_src = find(lambda r, d, f: "best.pt" in f and "calibration.json" in f)
splits = find(lambda r, d, f: "splits.csv" in f and os.path.basename(r) == "data")
print("run:", run_src, "splits dir:", splits, flush=True)
orig = find(lambda r, d, f: os.path.basename(r) == "Original images")
RUN = f"{W}/run1"; shutil.copytree(run_src, RUN, dirs_exist_ok=True)
resized = f"{T}/resized"
run([sys.executable, "ml/resize_for_upload.py", "--src", orig, "--out", resized, "--size", "320", "--quality", "92"], cwd=REPO)
# external: locate the folder holding the BD5 class folders (case-insensitive)
norm = lambda x: x.lower().replace("_", " ").strip()
want = {norm(k): k for k in json.load(open(f"{REPO}/ml/external_maps/riceleafdisease_bd5.json")) if not k.startswith("__")}
bd5 = None
for root, dirs, files in os.walk(IN):
    if "riceleafdisease-bd5" in root.lower() and len({norm(x) for x in dirs} & set(want)) >= 3:
        bd5 = root; break
print("BD5 root:", bd5, "class dirs:", os.listdir(bd5) if bd5 else None, flush=True)
specs = []
if bd5:
    base = json.load(open(f"{REPO}/ml/external_maps/riceleafdisease_bd5.json"))
    m = {"__doi__": base.get("__doi__", "10.17632/sjkptpgv79.2")}
    for d in os.listdir(bd5):
        if os.path.isdir(os.path.join(bd5, d)):
            key = want.get(norm(d))
            m[d] = base[key] if key else "__ignore__"
    mp = f"{T}/bd5_map.json"; json.dump(m, open(mp, "w"), indent=2); print("map:", m, flush=True)
    ext_resized = f"{T}/bd5_320"
    run([sys.executable, "ml/resize_for_upload.py", "--src", bd5, "--out", ext_resized, "--size", "320", "--quality", "92"], cwd=REPO)
    specs = ["--external", f"RiceLeafDisease-BD5 Savar (Kaggle copy sohagdewan/riceleafdisease-bd5, 3,150 imgs; provenance not verified vs Mendeley v2)={ext_resized}:{mp}"]
run([sys.executable, "ml/evaluate.py", "--run", RUN, "--data-root", resized, "--splits", f"{splits}/splits.csv"] + specs, cwd=REPO)
print(open(f"{RUN}/metrics-v1.json").read())
os.remove(f"{RUN}/best.pt")
print("EVAL_EXT_DONE")
