"""Pick real CC BY 4.0 demo samples from the v1 TEST split with the repo's pick_samples.py tool."""
import os, shutil, subprocess, sys
T = "/tmp/agro"; os.makedirs(T, exist_ok=True); IN = "/kaggle/input"
REPO = f"{T}/AgroLeaf-AI"
subprocess.run(["git", "clone", "--depth", "1", "https://github.com/masumcit44/AgroLeaf-AI.git", REPO], check=True)
orig = next(r for r, d, f in os.walk(IN) if os.path.basename(r) == "Original images")
splits = next(os.path.join(r, "splits.csv") for r, d, f in os.walk(IN) if "splits.csv" in f and "agroleaf-train-v1" in r)
print("orig:", orig, "splits:", splits, flush=True)
r = subprocess.run([sys.executable, "ml/tools/pick_samples.py", "--data-root", orig, "--splits", splits, "--per-class", "1",
                    "--classes", "healthy,blast,brown_spot,tungro,sheath_blight", "--repo", REPO], cwd=REPO)
if r.returncode: sys.exit("pick_samples failed")
shutil.copytree(f"{REPO}/frontend/public/samples", "/kaggle/working/samples")
print(os.listdir("/kaggle/working/samples")); print(open("/kaggle/working/samples/manifest.json").read())
print("PICK_DONE")
