# Training plan

**Where:** Kaggle Notebook or Google Colab (free GPU). The dataset is about 9.8k images; training should take well under an hour per model (estimate, not measured).

**Stack:** PyTorch + `timm`, `scikit-learn`, `onnx`, `onnxruntime`.

## Steps
1. **Load the splits** from `data/splits.csv` (group-aware; see `data/dataset_preparation_plan.md`). Write `class_index.json` from the folder names.
2. **Stage 1:** freeze the backbone and train the head for 3 epochs. AdamW, lr 1e-3, batch 32.
3. **Stage 2:** unfreeze and train 15–25 epochs. AdamW, lr 1e-4, cosine schedule, weight decay 1e-4, label smoothing 0.1.
4. **Imbalance:** class-weighted cross-entropy (inverse sqrt frequency) if the largest/smallest ratio is above 2.
5. **Early stopping** on validation macro-F1, patience 5. Keep the best checkpoint.
6. **Calibration:** fit the temperature on validation; pick the threshold *t* (see `model_selection.md`).
7. **Export:**
   - `torch.onnx.export(opset=17)`, input `1×3×224×224`.
   - Check that onnxruntime and PyTorch logits match (max abs diff < 1e-3).
   - Save `model.onnx`, `class_index.json`, `preprocess.json`, `calibration.json` (T, t).
8. **Size and speed:**
   - Measure the file size.
   - Test float16 conversion; keep it only if macro-F1 drops ≤ 0.5 points.
   - Measure browser inference time on one real phone.

**Seed:** fix seed 42 for the split, torch and numpy. Log library versions.

## Overfitting checks
- Plot train vs validation loss and macro-F1 per epoch.
- A gap of more than 10 points means more augmentation, fewer epochs or a smaller model.
- If **internal test ≫ external test**, that is domain shift: report it, don't hide it.

## Log every run
Log each run in `model/experiments/<date>_<model>.md` (template in `experiments/README.md`).
