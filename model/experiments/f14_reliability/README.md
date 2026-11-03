# F14 Reliability Bands (v10 Production Model)

## 1. Overview and Purpose
This experiment establishes empirical reliability bands for the deployed AgroLeaf AI rice leaf disease classification model (`rice-effb0-v10-320.onnx`).
Instead of an uncalibrated binary "confident / not sure", the app categorizes predictions into three honest bands:
- **High Reliability (`high`)**: empirical accuracy $\ge 95\%$ with Wilson 95% score lower bound $\ge 90\%$.
- **Medium Reliability (`medium`)**: empirical accuracy $\ge 80\%$.
- **Not Sure (`not_sure`)**: rejected by `decide.js` (e.g. `other_rice`, `not_rice`, low confidence, unconfident healthy, suppressed) or falling below the medium cut-point.

Every band carries its measured sample count and Wilson score confidence interval on the independent validation split, allowing the user-facing app to state honest, evidence-based performance (e.g. "In testing, 99 of 100 such results were correct") without misleading guarantees.

## 2. Dataset and Strict Validation Split
- **Dataset**: `Project-AgML/rice_disease_classification_bangladesh` (DIU dataset, Hasan et al., Dhaka International University).
- **Split Rule**: Fitted **ONLY** on DIU **Half A** ($N = 1,378$), partitioned deterministically via perceptual hash MD5:
  `int(md5(phash[:-1]), 16) % 2 == 0`.
- **Strict Isolation**: **NEVER** fitted or evaluated on the final test sets (`aman_unique`, DIU `half_B`, or `final_tests_once.json`).

Class distribution in DIU Half A ($N=1,378$):
- `other_rice` (leaf scald, insect, leaffolder, stripes): 603
- `healthy`: 306
- `blast`: 347
- `tungro`: 122

## 3. Production Model & Calibration
The inference pipeline strictly matches production (`frontend/src/ml/predict.js`, `frontend/src/ml/decide.js`, and `frontend/public/data/calibration.json`):
- Architecture: EfficientNet-B0 (320x320)
- Preprocessing: Resize short edge to 366, center crop 320x320, normalize with ImageNet mean/std
- Softmax Temperature: $T = 0.66$
- Acceptance threshold: $0.30$
- Healthy confirmation threshold: $0.90$
- Suppressed classes: `leaf_smut`

## 4. Wilson Score Confidence Interval Formula
For observed successes $k$ in $n$ trials with sample proportion $\hat{p} = k/n$ and $z = 1.95996$ (95% two-sided confidence):
$$\text{Center} = \frac{\hat{p} + \frac{z^2}{2n}}{1 + \frac{z^2}{n}}$$
$$\text{Margin} = \frac{z}{1 + \frac{z^2}{n}} \sqrt{\frac{\hat{p}(1 - \hat{p})}{n} + \frac{z^2}{4n^2}}$$
$$\text{CI} = \left[\max\left(0, \text{Center} - \text{Margin}\right), \min\left(1, \text{Center} + \text{Margin}\right)\right]$$

## 5. Measured Cut-Points and Results Table

| Band | Condition / Criteria | Sample Count ($n$) | Correct ($k$) | Measured Accuracy | Wilson 95% CI |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **High** (`high`) | `top_prob >= 0.98` | 345 | 341 | **98.84%** (99/100) | [97.06%, 99.55%] |
| **Medium** (`medium`) | `0.53 <= top_prob < 0.98` | 350 | 280 | **80.00%** (80/100) | [75.49%, 83.85%] |
| **Not Sure** (`not_sure`) | `top_prob < 0.53` or rejected by `decide.js` | 683 | 594* | **86.97%** | [84.24%, 89.29%] |
| **Total DIU Half A** | Full validation set | 1,378 | 1,215 | 88.17% | [86.35%, 89.80%] |

*\*In `not_sure`, 578 samples were correctly flagged and rejected as `other_problem` (non-target rice issues), preserving safe abstention.*

### Per-Class Predictions in Confident Bands
- **High Band ($n=345$)**:
  - `healthy`: 159
  - `blast`: 168
  - `tungro`: 18
- **Medium Band ($n=350$)**:
  - `blast`: 168
  - `healthy`: 109
  - `tungro`: 73

## 6. Reproducibility
To regenerate `bands_v10.json`:
```bash
python ml/tools/fit_reliability_bands.py
```
Outputs are written directly to:
- `model/experiments/f14_reliability/results/bands_v10.json`
- `frontend/src/features/reliability/bands_v10.json`

## Limitation (lead review, 4 Nov)
The cut points (0.98 / 0.53) were chosen on DIU half A and the band accuracies above are measured on the same 1,378 photos, so they are in-sample and likely a little optimistic. They have not been checked on an independent set yet; the next clean test set (Harvard BanglaRiceLeaf) should be used once to confirm them.
