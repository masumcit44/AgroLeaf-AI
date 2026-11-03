# v7 selection on DIU half A — result (2 Nov 2026, ~10:15 BST)

- Kaggle `agroleaf-train-v7` version 1, completed ~10:00.
- Log checks:
  - no held-out metric was printed;
  - leakage guard dropped 206 rows (Gazipur 186: copies inside Aman; Savar 8; raihan 6; Dhan-Shomadhan 6);
  - 17 identical images with conflicting labels were dropped, and 1,584 near-identical duplicates;
  - ONNX parity 5e-6 / 6e-6.
- In-domain test sets (share sources with training, so not evidence of generalization):
  - Gazipur: 93.8% answered / 87.7% right (224); 93.6% / 88.3% (320).
  - Savar: 99.6% right (both).
- Half B and Aman have **not** been read.

## Half A (1,378 images), app preprocessing and rule
| | live (v1 + G1) | V7_dhan_224 | V7_dhan_320 |
|---|---|---|---|
| Answered / right (as calibrated) | 35.8% / 40.4% | 23.7% / 34.9% | 29.7% / 39.6% |
| Right at the live answer rate | 40.4% | not reachable | not reachable |
| Diseased called Healthy | 23.9% | 2.4% | 4.3% |
| Other rice problem shown as a known disease | 28.2% | 23.9% | 31.2% |
| Raw accuracy / macro-F1 | 0.428 / 0.334 | 0.345 / 0.447 | 0.425 / **0.498** |
| Recall: healthy / blast / tungro | 0.96 / 0.05 / 0.19 | 0.47 / 0.25 / 0.30 | 0.52 / 0.38 / 0.30 |

Reference (same half): v5 macro-F1 0.398, v6 0.370.

**Selection rule:** neither v7 variant reaches the live answer rate. **NO-GO.** Half B stays unread.

## What changed and what did not
- **Input size 320 beats 224** on every raw measure (macro-F1 +0.05, blast recall +0.13). The scale hypothesis holds.
- **v7_320 is cautious:**
  - healthy → other_rice 105 / 306;
  - blast → other_rice 105 / 347;
  - only 43 of its 160 correct Healthy calls reach the app's Healthy ≥ 0.90 bar.
- **Tile averaging** (standard view + 4 zoomed tiles, calibration unchanged): fewer answers (11%), not more. Rejected.
- The live app's answer rate on DIU includes many wrong answers (28% of unsupported problems shown as a disease; 24% of diseased leaves called Healthy). This is a limitation of the "same answer rate" comparison on a set where 44% of photos are unsupported problems.
  - It is recorded here and **not** changed after seeing results.
