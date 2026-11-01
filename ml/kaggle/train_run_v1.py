"""AgroLeaf AI v1 training run on Kaggle: prepare (audit, leak-safe split, resize) -> train -> calibrate -> evaluate -> export -> parity."""
import json, os, shutil, subprocess, sys, time
W = "/kaggle/working"; T = "/kaggle/tmp" if os.path.isdir("/kaggle/tmp") else "/tmp/agro"
os.makedirs(T, exist_ok=True)
def run(cmd, cwd=None):
    print(f"\n$ {' '.join(cmd)}", flush=True); t = time.time()
    r = subprocess.run(cmd, cwd=cwd)
    print(f"[exit {r.returncode} in {time.time()-t:.0f}s]", flush=True)
    if r.returncode != 0: sys.exit(f"STEP FAILED: {cmd}")

run(["nvidia-smi"])
REPO = f"{T}/AgroLeaf-AI"
if not os.path.isdir(REPO):
    run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO])
run([sys.executable, "-m", "pip", "install", "-q", "imagehash", "onnx", "onnxruntime", "onnxscript"])

# Folder names as they appear in the Kaggle mirror of RiceLeafDiseaseBD (verified by agroleaf-dataset-check)
CM = {"Healthy": "healthy", "Blast": "blast", "Brown spot": "brown_spot", "Leaf smut": "leaf_smut", "Rice Tungro": "tungro", "Sheath blight": "sheath_blight"}
json.dump({"rice_leaf_disease_bd_v3": CM}, open(f"{REPO}/ml/class_map.json", "w"), indent=2)
expected = set(CM)
IMG = (".jpg", ".jpeg", ".png")
best, best_n = None, -1
for root, dirs, _ in os.walk("/kaggle/input"):
    if "annotated images" in root.lower() or not expected.issubset(set(dirs)):
        continue
    n = sum(f.lower().endswith(IMG) for d in expected for _, _, fs in os.walk(os.path.join(root, d)) for f in fs)
    print(f"candidate {root}: {n} images", flush=True)
    if n > best_n: best, best_n = root, n
if best is None: sys.exit(f"NO CLEAN CLASS ROOT FOUND for {sorted(expected)}")
print(f"USING clean class root: {best} ({best_n} images)", flush=True)

work = f"{T}/work"
run([sys.executable, "ml/prepare_dataset.py", "--raw", best, "--work", work, "--data-dir", f"{W}/data"], cwd=REPO)
resized = next(os.path.join(work, d) for d in os.listdir(work) if os.path.isdir(os.path.join(work, d)))
splits = f"{W}/data/splits.csv"
RUN = f"{W}/run1"
run([sys.executable, "ml/train.py", "--data-root", resized, "--splits", splits, "--out", RUN, "--arch", "mnv3_large", "--epochs", "20", "--num-workers", "4", "--device", "cuda"], cwd=REPO)
run([sys.executable, "ml/calibrate.py", "--run", RUN, "--data-root", resized, "--splits", splits], cwd=REPO)
run([sys.executable, "ml/export_onnx.py", "--run", RUN], cwd=REPO)
run([sys.executable, "ml/evaluate.py", "--run", RUN, "--data-root", resized, "--splits", splits], cwd=REPO)
run([sys.executable, "ml/parity_test.py", "--run", RUN, "--data-root", resized, "--splits", splits], cwd=REPO)
shutil.copytree(resized, f"{T}/keep_resized_note", dirs_exist_ok=True) if False else None
pkg = f"{W}/run1_for_app"
shutil.copytree(RUN, pkg, ignore=shutil.ignore_patterns("best.pt"), dirs_exist_ok=True)
shutil.make_archive(f"{W}/run1_for_app", "zip", pkg)
print(open(f"{RUN}/metrics-v1.json").read())
print("TRAIN_RUN_DONE")
