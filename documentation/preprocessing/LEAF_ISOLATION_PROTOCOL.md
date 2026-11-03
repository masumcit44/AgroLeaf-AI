# Leaf isolation / background strategies — protocol (written 3 Nov 2026 before any result; owner request)

**Model:** live v10 (`rice-effb0-v10-320.onnx`), unchanged weights.
**Decision rule:** unchanged (T 0.66, threshold 0.30, Healthy ≥ 0.90, leaf smut suppressed, reject outputs).

## Leaf mask (all parameters fixed now; none tuned on any result)
Applied to the app image (EXIF-upright, long side ≤ 1024):
1. Plant core: ExG = 2G − R − B > 15.
2. Morphological closing (ellipse, 2% of the long side) and hole filling, so lesions inside a leaf are kept.
3. Dilation (1% of the long side), so leaf edges are kept.
4. Keep components ≥ 1% of the image area.
   - **No component** → isolation fails. The strategy falls back to A, and failures are counted.
   - **Mask covers > 85% of the image** → the leaf already fills the frame; use the full image.
5. Square crop around the union bounding box: side = 1.30 × max(bbox w, h), centred, clipped to the image.
   - The 1.30 margin keeps the leaf after the app's Resize 366 + CenterCrop 320.

## Strategies (all end with the app's Resize 366 + CenterCrop 320)
| ID | What the model sees |
|---|---|
| **A** | Current app: whole image, no isolation |
| **B** | Square crop; outside the mask = white (255) |
| **C** | Square crop; outside the mask = ImageNet-mean grey (124, 116, 104) |
| **D** | Square crop; outside the mask = constant mid-green (86, 120, 60) |
| **E** | Square crop; outside the mask = the crop blurred (Gaussian, σ = 12 px) |
| **F** | Square crop only; original background kept |

Mask edge: 3 px feather.

## Data
- **Selection (dev): Aman 2025 unique** (422; `run7_v7/aman_unique_gt8.txt`).
  - Read once for model gates already; reused here only to compare pipelines with the same weights.
- **Confirmation (read once, after selection): Sylhet-Dhaka** (1,446 after exact duplicates are dropped).
- No tuning on Sylhet. DIU half B is not used (v10 trained on DIU half A).

## Selection on Aman
A strategy is a candidate if, compared with A:
- raw macro-F1 drops ≤ 1.0 point, **and**
- the wrong-answer rate (answered and wrong ÷ rice photos) does not rise.

Among candidates, the highest **correct-outcome rate** wins (answered and right, or an `other_rice` photo left unnamed). If no strategy is a candidate, the result is "keep A".

## Confirmation on Sylhet (chosen strategy vs A), all must hold
1. Correct-outcome rate higher.
2. Wrong-answer rate not higher.
3. Raw macro-F1 not more than 1.0 point lower.

If any fails: report it, keep A, and propose background-randomised training for v11 instead.

## Also reported
- Isolation failure rate.
- Share of photos whose top class changes.
- Predicted-class distribution per strategy (the white-background bias check).
- Mask time per image (Python, as a proxy).
- Example images.
