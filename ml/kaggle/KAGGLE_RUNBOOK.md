# Kaggle Execution Runbook for AgroLeaf AI

This runbook provides step-by-step instructions to train, calibrate, evaluate, and export the AgroLeaf AI model on Kaggle using a free GPU (T4).

---

## 1. Local Preparation

### Step 1.1: Audit the Raw Dataset
With the raw `RiceLeafDiseaseBD_v3` dataset unzipped at `D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3\`:
```bash
python ml/audit_dataset.py "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3" --out data/audit_output
```

### Step 1.2: Resize for Fast Kaggle Upload
The original raw images are ~1024x1024 (~5.25 GB). Resize them to 320x320:
```bash
python ml/resize_for_upload.py --src "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3" --out "D:\Desktop\AIgnite 2026\datasets_resized\RiceLeafDiseaseBD_v3_320" --size 320 --quality 92
```

### Step 1.3: Generate Leakage-Safe Splits
```bash
python ml/make_splits.py --images data/audit_output/images.csv --class-map ml/class_map.json --dataset rice_leaf_disease_bd_v3 --out-dir data
```
This produces `data/splits.csv` and `data/split_summary.md`.

### Step 1.4: Pre-Training Quality Verification
Before uploading or training, open `data/split_summary.md` and verify:
1. **Exclusions rate:** Total exclusions must be **< 5%** of all images.
2. **Perceptual cluster size:** Largest group size must be **<= 50** images.
3. **Class balance:** Every single class must have **>= 50** training images. (If any class has fewer, stop and report to the lead).
4. **Group leakage:** Confirm **0** shared groups across train, val, and test splits.

### Step 1.5: Zip the Resized Dataset
Compress `D:\Desktop\AIgnite 2026\datasets_resized\RiceLeafDiseaseBD_v3_320` into a zip archive:
- Name: `riceleafdiseasebd_v3_320.zip`

---

## 2. Kaggle Dataset Upload

1. Log into your verified [Kaggle](https://www.kaggle.com/) account.
2. Click **+ Create** -> **New Dataset**.
3. Upload `riceleafdiseasebd_v3_320.zip` and the generated `data/splits.csv`.
4. Title: `riceleafdiseasebd-v3-320`
5. Set visibility to **Private** and click **Create**.
6. (Optional): If external validation datasets (RiceLeafDisease-BD5 or RiceLeafBD) are available, resize and upload them as a second private dataset.

---

## 3. Kaggle Notebook Setup

1. Click **+ Create** -> **New Notebook**.
2. Settings panel (right sidebar):
   - **Accelerator:** GPU T4 x 1
   - **Internet:** On
3. Input panel:
   - Click **Add Input** and select your uploaded dataset: `riceleafdiseasebd-v3-320`.

---

## 4. Notebook Cells Execution

### Cell 1: Clone Repository & Install Dependencies
```bash
!git clone https://github.com/masumcit44/AgroLeaf-AI.git
%cd AgroLeaf-AI
!pip install -r ml/requirements.txt
```

### Cell 2: Verify Input Paths & GPU
```python
import os
import torch

print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Device: {torch.cuda.get_device_name(0)}")

# Update this path to match your exact Kaggle input directory
DATA_ROOT = "/kaggle/input/riceleafdiseasebd-v3-320/RiceLeafDiseaseBD_v3_320"
SPLITS_CSV = "/kaggle/input/riceleafdiseasebd-v3-320/splits.csv"
OUT_DIR = "/kaggle/working/run1"

assert os.path.exists(DATA_ROOT), f"Path not found: {DATA_ROOT}"
assert os.path.exists(SPLITS_CSV), f"Path not found: {SPLITS_CSV}"
print("Dataset inputs verified successfully.")
```

### Cell 3: Train MobileNetV3-Large (4 CPU workers for Kaggle's 4 vCPUs)
```bash
!python ml/train.py \
  --data-root "$DATA_ROOT" \
  --splits "$SPLITS_CSV" \
  --out /kaggle/working/run1 \
  --arch mnv3_large \
  --epochs 20 \
  --batch 32 \
  --device cuda \
  --num-workers 4
```

### Cell 4: Temperature Calibration & Threshold Tuning
```bash
!python ml/calibrate.py \
  --run /kaggle/working/run1 \
  --data-root "$DATA_ROOT" \
  --splits "$SPLITS_CSV" \
  --target-precision 0.90
```

### Cell 5: Internal & External Evaluation
```bash
!python ml/evaluate.py \
  --run /kaggle/working/run1 \
  --data-root "$DATA_ROOT" \
  --splits "$SPLITS_CSV"
```

*(Note: Add `--external "RiceLeafDisease-BD5 (Savar)=/kaggle/input/external_bd5:ml/external_maps/riceleafdisease_bd5.json"` if external dataset is attached).*

### Cell 6: ONNX Export & Single-File Verification
```bash
!python ml/export_onnx.py --run /kaggle/working/run1
```

### Cell 7: Numerical Parity Verification
```bash
!python ml/parity_test.py \
  --run /kaggle/working/run1 \
  --data-root "$DATA_ROOT" \
  --splits "$SPLITS_CSV" \
  --samples 20
```

### Cell 8: Package Artifacts for Download
```bash
!cd /kaggle/working && zip -r agro_leaf_run1_artifacts.zip run1 -x "run1/best.pt"
```
*(Omitting `best.pt` keeps the zip small for instant download; `model.onnx`, JSON files, and PNGs are what the frontend and repo need).*

---

## 5. Integrating Kaggle Outputs into the Repo (Module M07)

1. Download `agro_leaf_run1_artifacts.zip` from Kaggle.
2. Unzip into `model/experiments/run1/` or copy the required artifacts:
   - `model.onnx` -> `frontend/public/model/model.onnx`
   - `class_index.json` -> `frontend/src/model/class_index.json`
   - `preprocess.json` -> `frontend/src/model/preprocess.json`
   - `calibration.json` -> `frontend/src/model/calibration.json`
   - `metrics-v1.json` -> `frontend/src/model/metrics-v1.json`
   - `confusion_internal.png` -> `frontend/public/model/confusion_internal.png`
   - `parity_samples.json` and `samples/` -> `frontend/src/model/`
3. Document the run duration, GPU details, and metrics in `model/experiments/<date>_mnv3_large.md`.
