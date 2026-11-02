# v9 training protocol — fixed before training (2 Nov 2026, ~21:15 BST)

Evaluation and gate: `PROTOCOL_EVAL.md` (`722b6a0`). Design inputs: `documentation/research/v9_design_inputs.md`.

## EDA findings that drive the design (`eda_v9/`, DINOv2-small embeddings)
- **Source shortcut risk:** source is predictable from the image with 95.2% balanced accuracy, and 92–99% within every class.
- **Weak transfer:** a leave-one-source-out linear probe reaches macro-F1 of only 0.12–0.36.
- **Labels are not the bottleneck:** 109 label-noise suspects of ~29k.
- **Distance from training** (median nearest-train cosine; training itself 0.97): DIU 0.80, Sylhet 0.86, Aman 0.94.
- **Per-source differences:** saturation ranges 27–160, sharpness 65–2,229, median resolution 300 px to 4000 px.

## Common recipe (both variants; otherwise identical to V8_all_b0_320)
- Same data as v8 (Bangladesh + Paddy Doctor + Sethy + Taiwan + not_rice) and the same leakage guard.
- Additionally guarded: Sylhet and Gujarat (the final tests).
- EfficientNet-B0, input 320, seed 42, AdamW lr 1e-3, label smoothing 0.1, sqrt-per-source class-balanced sampling.
- **18 epochs.**
- **Augmentation additions:**
  - RandomRotation 30 (was 20); RandomPerspective 0.3 (p = 0.3);
  - **resolution jitter:** downscale to a random 25–100% then back up, p = 0.3;
  - **Mixup (α 0.4) or CutMix (α 1.0)** on 50% of batches (25% each), rice and not_rice alike.
- **Weight averaging:** mean of the weights of the last 6 epochs (SWA, BN statistics recomputed on 200 training batches).

## Variants
1. **V9_mix:** the common recipe.
2. **V9_mix_dann:** the common recipe plus a domain-adversarial head.
   - The head is an MLP on pooled features, through a gradient-reversal layer, predicting the rice source (not_rice rows masked).
   - λ ramps 0 → 0.1 (Ganin & Lempitsky 2015 schedule).
   - The ONNX export contains only the classifier path.

## Selection (no final test touched)
- **Set:** **DIU half A** only.
  - A source never used for training; the same half definition as `PROTOCOL_AMENDMENT_1.md`.
  - The half is computed in the kernel from the original parquet bytes (EXIF upright, long side ≤ 1024, pHash).
  - Half B is excluded from all choices.
- **Per variant:** the better of {epoch with the best DIU-A raw macro-F1, the SWA average}.
- **Between variants:** higher DIU-A raw macro-F1.
- **Calibration:** temperature and threshold as in v8 (in-domain pooled val, ≥ 92% right).
- **Final test:** Sylhet only, then `PROTOCOL_EVAL.md`. Gujarat is report-only.
