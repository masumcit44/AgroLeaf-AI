# v8 (V8_all_b0_320) release gate — result (2 Nov 2026, ~13:05 BST)

**Gate:** `run7_v7/PROTOCOL.md` + `run7_v7/PROTOCOL_AMENDMENT_1.md`.
- Selection was committed before these reads (`bddef5a`).
- Each final set was read **once**, with only the selected candidate.
- Command: `ml/tools/eval_diu_app_path.py ... B v8_b0=...`, then `AMAN_KEEP=run7_v7/aman_unique_gt8.txt ... AMAN v8_b0=...`.

**Candidate:**
- `V8_all_b0_320/model.onnx`: EfficientNet-B0, 8 outputs, input 320 (Resize 366 + CenterCrop 320), 15.3 MiB.
- Calibration: temperature 0.66, threshold 0.30. App rules: Healthy ≥ 0.90, leaf smut never named, not_rice / other_rice never named.

## 1. DIU half B (1,375 photos: healthy 297, blast 349, tungro 117, other rice problems 612)
| | live (v1 + G1) | v8_b0 | Condition | |
|---|---|---|---|---|
| Right at the live answer rate (37.2%) | 40.8% | 46.3% | ≥ +5 points and CI > 0: **+5.5 points, 95% CI +0.3 to +10.3** | PASS |
| Raw macro-F1 | 0.324 | 0.562 | higher | PASS |
| Diseased called Healthy | 21.2% | 8.8% | ≤ live + 2 | PASS |
| Other problem shown as a disease | 31.7% | 33.0% | ≤ live + 2 (+1.3) | PASS |
| Recall healthy / blast / tungro | 0.95 / 0.07 / 0.13 | 0.77 / 0.44 / 0.29 | | |
| Precision healthy / blast / tungro | 0.49 / 0.96 / 0.45 | 0.62 / 0.82 / 0.81 | | |

## 2. Aman 2025, unique subset (422 photos: healthy 48, blast 52, brown spot 59, other rice problems 263)
| | live | v8_b0 | Condition | |
|---|---|---|---|---|
| Answered / right (as deployed / as calibrated) | 54.5% / 14.8% | 50.5% / 62.9% | | |
| Right at the live answer rate (54.5%) | 14.8% | **not reachable** (max 50.5%) | right ≥ live − 2 points at max(live coverage, 30%) | **FAIL (as written)** |
| Diseased called Healthy | 0.0% | 1.8% | ≤ live + 2 | PASS |
| Other problem shown as a disease | 58.9% | 26.2% | | |
| Raw accuracy / macro-F1 | 0.440 / 0.495 | 0.881 / 0.919 | | |
| Recall healthy / blast / brown spot | 0.69 / 0.48 / 0.20 | 0.98 / 0.92 / 0.76 | | |

## 3.–5. Other conditions
- Non-rice rejection, test splits (generated 300, memes 195, natural 208, PlantVillage 250, posters 86): **100%** each. PASS.
- Gazipur internal test: 92.4% answered, 88.1% right (≥ 70% / ≥ 85%). PASS.
- Size 15.3 MiB ≤ 25 MiB: PASS. Browser decode-path test: see the preview deployment section below.

## Verdict
**NO-GO for production under the locked gate.** The Aman condition cannot be met, because v8_b0 does not answer as many Aman photos as the live system.
- The live system reaches 54.5% on Aman mostly by naming a disease for unsupported problems: 59% of the 263 "other problem" photos.
- On every other measure v8_b0 is better.
- The rule was **not** changed after seeing this.

Whether to accept a revised Aman condition is the **user's decision**. Any revision is post hoc and must be labelled as such. Example revision: no worse right-share at the candidate's own maximum answer rate, or a comparison on diagnosable photos only.

Production stays v1 + G1. v8_b0 goes to the **preview** deployment only (branch `deploy/candidate-ready`), for live verification.

## Limitations
- **DIU** covers healthy, blast and tungro only, as white-background close-ups.
- **Aman** covers healthy, blast and brown spot (159 photos).
- **No final test** covers sheath blight or leaf smut. Leaf smut is never named by the app.
- **Tungro recall is still low:** 0.29 on DIU B.
- **Half B's +5.5 points is just above the bar:** the CI lower bound is +0.3.
