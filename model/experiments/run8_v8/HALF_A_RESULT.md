# v8 selection on DIU half A — result (2 Nov 2026, ~12:55 BST)

- Kaggle `agroleaf-train-v8` version 1, completed ~12:40.
- Log checks:
  - no held-out metric was printed;
  - leakage guard dropped 345 rows (Gazipur 186, Paddy Doctor 78, Sethy 61, Savar 8, raihan 6, Dhan-Shomadhan 6: copies inside DIU / Aman);
  - 23 identical images with conflicting labels were dropped, and 4,823 near-identical duplicates;
  - ONNX parity ≤ 6e-6.
- In-domain test (Gazipur, shares sources with training): B0 92.4% answered / 88.1% right; B2 92.6% / 89.1%.
- Model files: B0 15.3 MiB; B2 29.4 MiB.
- Half B and Aman have **not** been read at the time of writing.

## Half A (1,378 images), app preprocessing and rule (`ml/tools/eval_diu_app_path.py`)
| | live (v1 + G1) | V7_dhan_320 | **V8_all_b0_320** | V8_all_b2_320 |
|---|---|---|---|---|
| Right at the live answer rate (35.8%) | 40.4% | not reachable | **49.9%** (+9.5 points, 95% CI +4.3 to +14.6) | not reachable |
| Answered / right (as calibrated) | 35.8% / 40.4% | 29.7% / 39.6% | 38.3% / 50.0% | 31.6% / 40.1% |
| Diseased called Healthy | 23.9% | 4.3% | 6.6% | 6.2% |
| Other rice problem shown as a disease | 28.2% | 31.2% | 29.2% (at target) | 32.8% |
| Raw accuracy / macro-F1 | 0.428 / 0.334 | 0.425 / 0.498 | **0.525 / 0.545** | 0.525 / 0.544 |
| Recall: healthy / blast / tungro | 0.96 / 0.05 / 0.19 | 0.52 / 0.38 / 0.30 | 0.75 / 0.40 / 0.30 | 0.76 / 0.39 / 0.32 |

## Selection (run8_v8/PROTOCOL.md)
**V8_all_b0_320 is selected:**
- it is the only variant that reaches the live answer rate;
- it beats the live system on half A, so it goes on to the release gate.

**Read once next:** DIU half B, and Aman 2025 restricted to `run7_v7/aman_unique_gt8.txt`.

**Evidence of what helped:**
- input 320 (v7: +0.05 macro-F1 over 224);
- then diverse international field data at 320 (v8_b0: +0.05 over v7_320, healthy recall 0.52 → 0.75).

The larger backbone (B2) added nothing on half A.
