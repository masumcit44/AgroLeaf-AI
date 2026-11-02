# v9 on DIU half A — result (3 Nov 2026, ~00:10 BST); Sylhet NOT read

**Kaggle `agroleaf-train-v9` v1 log checks:**
- held-out metrics not printed;
- leakage guard 345 rows;
- ONNX parity ≤ 5e-6;
- DIU half A computed in the kernel: 1,356 rows after deduplication; app-path half A 1,378.

**In-kernel selection (protocol):**
- V9_mix: best epoch 3 (DIU-A macro-F1 0.513); SWA 0.503.
- V9_mix_dann: best epoch 7 (0.541); SWA 0.489.
- → **V9_mix_dann selected.**
- The DIU-A score moves between 0.36 and 0.54 from epoch to epoch, so the "best epoch" choice is noisy.

**In-domain Gazipur test** (kernel), answered / right / macro-F1:

| | answered | right | macro-F1 |
|---|---|---|---|
| V9_mix | 57.3% | 88.5% | 0.657 |
| V9_mix_dann | 67.6% | 89.8% | 0.743 |
| v8_b0 | 92.4% | 88.1% | 0.848 |

## App-path comparison on half A (selection set; `ml/tools/eval_diu_app_path.py`)
| | v8_b0 (live) | V9_mix | V9_mix_dann |
|---|---|---|---|
| Raw accuracy / macro-F1 | 0.525 / 0.545 | 0.525 / 0.577 | 0.575 / **0.652** |
| Recall healthy / blast / tungro | 0.75 / 0.40 / 0.30 | 0.77 / 0.35 / 0.43 | 0.54 / **0.59** / **0.61** |
| Answered / right (as calibrated) | 38.3% / 50.0% | 13.5% / 51.6% | 19.5% / 36.8% |
| Diseased called Healthy | 6.6% | 1.1% | 0.0% |
| Reaches v8_b0's answer rate | — | no | no |

## Reading
- Better raw recognition of blast and tungro, from the DANN + Mixup recipe.
- But under-confident probabilities, which are typical after Mixup / CutMix. The early-epoch choice and the app's Healthy ≥ 0.90 rule cut the answer rate.

The Sylhet gate (condition 2) compares at v8_b0's answer rate, so it would most likely fail as "not reachable", the same structural issue as v8 on Aman.

**Status:**
- Sylhet (the last unread test) has **not** been read.
- Next step: the user's decision (read now, or first fix calibration / training length with a written amendment).
