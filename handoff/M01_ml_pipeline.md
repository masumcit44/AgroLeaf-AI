# M01 — ML pipeline scripts (written now, run by the user on Kaggle)

**Goal:** a complete, reproducible Python pipeline: audit → resize → split → train → calibrate → evaluate → export ONNX → parity test. You **write and smoke-test** it on a tiny synthetic dataset on CPU. The user runs it for real on Kaggle.
**Branch:** `ml/m01-training-pipeline` · **Tag:** `m01`
**User gate:** none for writing. Real runs need the dataset (the user does that).

Read first: `data/dataset_preparation_plan.md`, `data/disease_classes.md`, `model/training_plan.md`, `model/evaluation_plan.md`, `model/model_selection.md`.

## Fixed contracts (other modules depend on these; do not change names)
- **Class keys, in this exact order (index 0..5):** `["healthy","blast","brown_spot","leaf_smut","tungro","sheath_blight"]`. These match `disease_knowledge/*.json`.
- **`ml/class_map.json`** maps dataset folder names → keys:
```json
{ "rice_leaf_disease_bd_v3": { "Healthy": "healthy", "Blast": "blast", "Brown Spot": "brown_spot", "Leaf Smut": "leaf_smut", "Rice Tungro": "tungro", "Sheath Blight": "sheath_blight" } }
```
  The real folder names are unknown until download. **Scripts must stop with a clear error listing any folder not in the map.** Never guess a mapping.
- **Artefacts written to `ml/outputs/<run_name>/`:**
  - `best.pt` (git-ignored)
  - `model.onnx`
  - `class_index.json` — `{"classes":[...keys in order...],"version":"v1"}`
  - `preprocess.json` — `{"resize_shorter":256,"crop":224,"mean":[0.485,0.456,0.406],"std":[0.229,0.224,0.225],"color":"RGB","layout":"NCHW"}`
  - `calibration.json` — `{"temperature":T,"threshold":t,"target_precision":0.90,"val_coverage":..,"val_selective_accuracy":..}`
  - `metrics-v1.json` (schema below)
  - `confusion_internal.png`
  - `history.csv`
  - `parity_samples.json`
- **ONNX:** input name `input`, shape `[1,3,224,224]` float32; output name `logits`, shape `[1,6]`; opset 17.

## Files to create
| File | Purpose |
|---|---|
| `ml/README.md` | How to run each step locally and on Kaggle (copy-paste commands) |
| `ml/requirements.txt` | `torch`, `torchvision`, `numpy`, `pillow`, `imagehash`, `scikit-learn`, `onnx`, `onnxruntime`, `matplotlib`. Unpinned is fine for Kaggle; note the tested versions in ml/README |
| `ml/class_map.json` | As above |
| `ml/common.py` | Shared: seed setting, class order, preprocessing transforms (one definition used by train/eval/export), dataset class reading `splits.csv` |
| `ml/audit_dataset.py` | **Already exists.** Do not rewrite; only fix real bugs |
| `ml/resize_for_upload.py` | Copy every image from the raw dataset to `--out` at **320×320** (short side 320 + center crop, JPEG quality 92), keeping relative paths. This shrinks about 5 GB to a few hundred MB for the Kaggle upload. Never modify the source |
| `ml/make_splits.py` | Input: audit `images.csv` + `class_map.json`. Drops unreadable files, extra copies of exact duplicates, and any image whose group spans 2 classes (log them to `data/audit_output/exclusions.csv` with a reason). **StratifiedGroupKFold** (seed 42) → 70/15/15 train/val/test by `group_id`. Writes `data/splits.csv` (`path,class_key,group_id,split`) and `data/split_summary.md` (counts per class per split; confirm no group appears in two splits) |
| `ml/train.py` | Args: `--data-root --splits --out --arch {mnv3_large,mnv3_small} --epochs 20 --batch 32 --device auto --num-workers 2`. ImageNet weights (torchvision `MobileNet_V3_Large_Weights.IMAGENET1K_V2` / Small `IMAGENET1K_V1`). Stage 1: freeze features, 3 epochs, lr 1e-3. Stage 2: unfreeze, AdamW lr 1e-4, cosine, wd 1e-4, label smoothing 0.1. Class weights = inverse sqrt frequency if max/min > 2. Train augmentation per `dataset_preparation_plan.md` §7. Early stop on val **macro-F1** (patience 5). Log `history.csv`. Save `best.pt`, `class_index.json`, `preprocess.json` |
| `ml/calibrate.py` | Collect val logits → fit a single temperature (LBFGS on NLL) → choose the **lowest threshold whose accepted-set precision on val is ≥ target** (default 0.90; fall back to the best available and record a `warning` field). Write `calibration.json` + `reliability_val.png` (ECE before and after) |
| `ml/evaluate.py` | Internal test + optional external sets via `--external name=root:mapfile`. Map files in `ml/external_maps/` (see below). Computes accuracy, **macro-F1**, per-class P/R/F1/support, confusion matrix, ECE, **coverage and selective accuracy at threshold**, and **unseen-class rejection rate** (images whose label maps to `__unseen__`). Writes `metrics-v1.json` + PNGs |
| `ml/external_maps/riceleafdisease_bd5.json` | `{"Normal Leaf":"healthy","Blast":"blast","Sheath Blight":"sheath_blight","Tungro":"tungro","Narrow Brown Spot":"__unseen__"}` |
| `ml/external_maps/riceleafbd_sylhet.json` | `{"Healthy":"healthy","Brown Spot":"brown_spot","Tungro Virus":"tungro","Bacterial Leaf Blight":"__unseen__"}` |
| `ml/export_onnx.py` | Load `best.pt` → export with the contract above → `onnx.checker` → **fail if the file is ≥ 24 MiB** → print the size |
| `ml/parity_test.py` | For 20 val images, compare PyTorch vs onnxruntime logits (**max abs diff < 1e-3** or exit 1). Write `parity_samples.json` with, for 5 images: filename, the preprocessed tensor's first 10 values, and expected probabilities after temperature. Copy those 5 images to `ml/outputs/<run>/samples/` |
| `ml/tests/make_toy_dataset.py` | Generates 6 class folders × 12 random 320×320 JPEGs (named like the class_map's folders) for smoke tests |
| `ml/kaggle/KAGGLE_RUNBOOK.md` | Exact Kaggle steps (below) |

### `metrics-v1.json` schema (the app reads this in M07; keep the keys exact)
```json
{
  "model": {"arch": "mnv3_large", "onnx_mb": 0.0, "trained_on": "RiceLeafDiseaseBD v3 (DOI 10.17632/86s4jzj2m4.3)", "date": "YYYY-MM-DD"},
  "calibration": {"temperature": 0.0, "threshold": 0.0, "target_precision": 0.9},
  "internal_test": {"n": 0, "accuracy": 0.0, "macro_f1": 0.0, "coverage": 0.0, "selective_accuracy": 0.0, "ece_after": 0.0,
                    "per_class": {"healthy": {"precision": 0.0, "recall": 0.0, "f1": 0.0, "support": 0}}},
  "external": [{"name": "RiceLeafDisease-BD5 (Savar)", "doi": "10.17632/sjkptpgv79.2", "classes_tested": [], "n": 0,
                "macro_f1_mapped": 0.0, "coverage": 0.0, "selective_accuracy": 0.0, "unseen_rejection_rate": 0.0,
                "per_class": {}}],
  "limitations": ["Leaf Smut has no external test data.", "Training images come from one district (Gazipur) and one season."]
}
```

### `ml/kaggle/KAGGLE_RUNBOOK.md` must contain
1. **Locally:** run `audit_dataset.py` on the raw dataset → `resize_for_upload.py` → zip the resized folder.
2. Upload the zip, plus `data/splits.csv`, as a **private Kaggle Dataset**. Also upload the external sets, resized the same way, if available.
3. New notebook: Accelerator **GPU T4**, Internet **on**. Add the datasets. Cell 1: `!git clone https://github.com/masumcit44/AgroLeaf-AI.git` and `pip install -r ml/requirements.txt`.
4. Cells for train → calibrate → evaluate → export → parity, with real paths under `/kaggle/input/...` and outputs to `/kaggle/working/run1`.
5. Download `/kaggle/working/run1` (without `best.pt` if the space is tight) → copy into the repo as described in M07.
6. Expected runtime: unknown. Log the actual time in `model/experiments/`.

## Smoke test (must pass on this PC, CPU only)
```bash
pip install -r ml/requirements.txt
python ml/tests/make_toy_dataset.py --out ml/toy_data/raw
python ml/audit_dataset.py ml/toy_data/raw --out ml/toy_data/audit
python ml/make_splits.py --images ml/toy_data/audit/images.csv --class-map ml/class_map.json --dataset rice_leaf_disease_bd_v3 --out-dir ml/toy_data
python ml/train.py --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv --out ml/outputs/toy --arch mnv3_small --epochs 1 --device cpu --no-pretrained
python ml/calibrate.py --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv
python ml/evaluate.py  --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv
python ml/export_onnx.py --run ml/outputs/toy
python ml/parity_test.py --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv
```
- Add the `--no-pretrained` flag for the offline smoke test only.
- `--out-dir` lets the toy run avoid overwriting the real `data/splits.csv`.
- If a wheel for this Python version (3.14) is missing, create a venv with Python 3.11 or 3.12. If that is not possible, write it in Blockers. The real run happens on Kaggle anyway.

## Acceptance checks
- [ ] The whole smoke test runs end to end and creates every artefact listed above.
- [ ] `make_splits.py` reports **0 groups shared between splits**.
- [ ] Unknown folder names cause a clear error (test it by renaming one toy folder).
- [ ] `export_onnx.py` prints the size and enforces the 24 MiB limit.
- [ ] No dataset images, `ml/outputs`, or `ml/toy_data` are committed.
- [ ] Commits (examples):
  - `ml(data): add leakage-safe grouped split builder`
  - `ml(train): add MobileNetV3 fine-tuning with macro-F1 early stopping`
  - `ml(calib): add temperature scaling and precision-targeted threshold`
  - `ml(eval): add internal/external evaluation with selective metrics`
  - `ml(export): add ONNX export with size guard and parity test`
  - `docs(ml): add Kaggle runbook`
