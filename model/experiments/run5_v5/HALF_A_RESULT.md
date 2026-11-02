# v5 / v6 selection on DIU half A — result (2 Nov 2026, ~08:10 BST)

**Rules:** `PROTOCOL.md` + `PROTOCOL_AMENDMENT_1.md`.
- Command: `ml/tools/eval_diu_app_path.py <diu_raw> v1.onnx calibration.json gate.onnx <out> A v5=... v6=...` (commit `8606d7e`).
- Preprocessing: the app's own (EXIF upright, ≤1024, Resize 256 + CenterCrop 224, Pillow bilinear). Decisions use the app's rule.
- Half B has **not** been read.

## Pre-checks
- **Vietnam → DIU near-copies** (`run6_v6/leak_check/`): 190 Vietnam images were within 4 pHash bits; v6's guard had already dropped 185 of them.
  - Pairs at 5–8 bits, inspected by eye: different photos with the same look (one leaf on white), not copies. Many pairs even have different labels.
  - So v6 is eligible. pHash over-matches plain single-leaf photos.
- **v5's full-DIU score** was printed by its training log before this run (see the overnight report). Nothing was changed because of it.

## Half A (1,378 mapped images: healthy 306, blast 347, tungro 122, other rice problems 603)
| | live (v1 + G1) | v5 | v6 |
|---|---|---|---|
| Answered (as calibrated) | 35.8% | 33.8% | 66.9% |
| Right among answered (as calibrated) | 40.4% | 32.4% | 27.1% |
| Right at the live answer rate (35.8%) | 40.4% | not reachable | 37.7% |
| Diseased called Healthy (answered) | 23.9% | 8.1% | 11.7% |
| Other rice problem shown as a known disease | 28.2% | 35.8% | 53.6% |
| Raw accuracy / macro-F1 | 0.428 / 0.334 | 0.419 / 0.398 | 0.404 / 0.370 |
| Recall: healthy / blast / tungro | 0.96 / 0.05 / 0.19 | 0.85 / 0.14 / 0.14 | 0.76 / 0.23 / 0.01 |

**Confusions (argmax):**
- v1: blast → healthy 202 / 347; tungro → healthy 92 / 122.
- v6: blast → brown spot 214; tungro → healthy 62 or brown spot 45.

**Selection rule outcome:**
- v5 cannot reach the target answer rate.
- v6 can, but is 2.7 points below the live system.

## Amendment 2 (written now, before any half-B read)
A candidate that does not beat the live system on half A is not sent to half B. Half B stays unread for a later candidate.

This only makes a release harder, never easier.

**Decision: NO-GO for v5 and v6. The live system stays.**

## What the images show (half A, looked at directly)
- DIU photos are close-ups of single leaf segments with the background removed (white), mostly with early, mild symptoms: small brown streaks (blast), faint yellowing (tungro).
- Our training data is mainly whole-leaf field photos. Every model fails on this look; the live v1 calls most of these blast and tungro leaves Healthy.

**Limitation:**
- DIU tests "leaf on white", healthy / blast / tungro only.
- It says nothing about brown spot, sheath blight or leaf smut, or about field photos.
