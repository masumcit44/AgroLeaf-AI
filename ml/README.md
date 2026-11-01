# AgroLeaf AI — Machine Learning Pipeline

This directory contains the end-to-end, reproducible machine learning pipeline for AgroLeaf AI:
data auditing, image resizing, leakage-safe stratified group splitting, MobileNetV3 transfer learning, temperature scaling calibration, comprehensive evaluation, ONNX export with size checks, and PyTorch-vs-ONNX numerical parity testing.

---

## 1. Environment Setup

### Tested Local Versions
- Python: 3.14 / 3.13 / 3.11 / 3.12
- PyTorch: 2.14+ (CPU or CUDA)
- torchvision: 0.19+
- onnx: 1.23+
- onnxruntime: 1.31+
- scikit-learn: 1.6+
- Pillow: 11.0+
- imagehash: 4.3+
- matplotlib: 3.10+

### Installation
```bash
pip install -r ml/requirements.txt
```

---

## 2. Pipeline Scripts Overview

| Script | Purpose |
|---|---|
| `audit_dataset.py` | Read-only dataset audit: verifies readability, detects exact/cross-class MD5 duplicates, and computes perceptual hash groups. |
| `resize_for_upload.py` | Resizes raw images to 320x320 center crop (JPEG Q92) for compact Kaggle upload without modifying originals. |
| `make_splits.py` | Creates leakage-safe 70/15/15 train/val/test splits using `StratifiedGroupKFold` by `group_id`, filtering corrupt or cross-class duplicate images. |
| `train.py` | Two-stage MobileNetV3 fine-tuning (frozen backbone -> full cosine fine-tuning) with class weighting, label smoothing, and validation macro-F1 early stopping. |
| `calibrate.py` | Post-hoc temperature scaling via LBFGS on validation NLL; chooses lowest confidence threshold meeting target precision. |
| `evaluate.py` | Evaluates internal test set and external datasets. Generates `metrics-v1.json`, confusion matrix, and selective prediction metrics. |
| `export_onnx.py` | Exports model checkpoint to standard ONNX format (`opset 17`, fixed `1x3x224x224` input), verifies validity, and enforces < 24 MiB limit. |
| `parity_test.py` | Validates PyTorch vs ONNX Runtime logits on validation images (asserts max absolute difference < 1e-3). |
| `tests/make_toy_dataset.py` | Generates a 6-class synthetic dataset for quick offline CPU smoke tests. |

---

## 3. Local CPU Smoke Test

Run the full pipeline end-to-end on synthetic data:

```bash
# 1. Generate toy dataset
python ml/tests/make_toy_dataset.py --out ml/toy_data/raw

# 2. Audit toy dataset
python ml/audit_dataset.py ml/toy_data/raw --out ml/toy_data/audit

# 3. Create leakage-free grouped splits
python ml/make_splits.py --images ml/toy_data/audit/images.csv --class-map ml/class_map.json --dataset rice_leaf_disease_bd_v3 --out-dir ml/toy_data

# 4. Train 1-epoch smoke test on CPU without pretrained weights
python ml/train.py --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv --out ml/outputs/toy --arch mnv3_small --epochs 1 --device cpu --no-pretrained

# 5. Calibrate temperature and threshold
python ml/calibrate.py --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv

# 6. Evaluate internal test set
python ml/evaluate.py --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv

# 7. Export ONNX model with size check
python ml/export_onnx.py --run ml/outputs/toy

# 8. Verify PyTorch vs ONNX numerical parity (< 1e-3)
python ml/parity_test.py --run ml/outputs/toy --data-root ml/toy_data/raw --splits ml/toy_data/splits.csv
```

---

## 4. Full GPU Training on Kaggle

For training on the real 9.8k image dataset with a free T4 GPU on Kaggle, follow the complete step-by-step instructions in [ml/kaggle/KAGGLE_RUNBOOK.md](kaggle/KAGGLE_RUNBOOK.md).

---

## 5. Offline Bangla Voice Synthesis (Azure Speech F0)

To generate offline static MP3 voice clips for all 7 conditions:

1. In the [Azure Portal](https://portal.azure.com/), create a free **Speech** service resource on pricing tier **Free F0** (includes 500,000 characters free monthly).
2. Copy `Key 1` and `Region` (e.g., `southeastasia`).
3. Create a `.env` file in the repo root (git-ignored):
   ```
   AZURE_SPEECH_KEY=your_key_here
   AZURE_SPEECH_REGION=southeastasia
   ```
4. Verify character budget safely without invoking API calls:
   ```bash
   python ml/tools/generate_tts.py --dry-run
   ```
5. Synthesize all audio files:
   ```bash
   python ml/tools/generate_tts.py
   ```
   Generated MP3s are written directly to `frontend/public/audio/<key>-v1.mp3` along with `frontend/public/audio/manifest.json`.
6. Alternatively, human voice recordings can be substituted by saving mono MP3s with identical names and setting `"voice": "human"` in the manifest.
