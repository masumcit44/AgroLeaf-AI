# v1 vs v4-B release decision — protocol fixed before results

Written and committed before the six-model evaluation results (`agroleaf-eval-unified`, job version 2) were read. Nothing below changes after the results are seen.

## Data
- **Comparison set:** raihan150146 external validation, the 1,794 rice photos in v4's `extval` set (Bangladeshi phone photos from outside Gazipur; never trained on).
  - The evaluation job checks the image list against v4's prediction files.
  - Model files are checked against SHA-256 sums.
- **Non-rice check:** the non-rice validation rows (natural, PlantVillage, posters, memes, generated).
- **Final tests:** Sylhet and Gujarat are read once, after the decision below, for the chosen model and for v1. They change nothing.

## Rule applied to both models
The app's full decision rule (`ml/app_decision.py`, verified against `decide.js`):
- Healthy needs ≥ 0.90;
- leaf smut is always "not sure";
- not_rice and other_rice answers are never named;
- ties are "not sure";
- v1 keeps its leaf-colour gate.

Coverage is changed only through the main threshold.

## What is reported
At fixed coverages of 20%, 40%, 60% and v1's deployed coverage on raihan:
- each model's threshold for that coverage;
- answered and not-answered counts;
- selective accuracy, with a 95% bootstrap interval (2,000 resamples of images);
- per-class answered-and-correct rates;
- false-Healthy rate and unsupported-disease escape rate.

Also: raw accuracy and macro-F1 on the 5 diagnosable classes present (raihan has no leaf smut), the confusion matrix, ECE, and non-rice rejection.

## Minimum useful coverage
**30% of rice photos answered.** Below that, "not sure" dominates and the app gives a farmer almost nothing, so a model is not considered at an operating point under 30%.

## GO for v4-B only if all of these hold
1. **Correctness at v1's deployed coverage on raihan (or 30%, whichever is higher):** B's selective accuracy beats v1's by at least 5 percentage points, and the 95% bootstrap interval of the difference (B − v1, paired by image) is above 0.
2. **Raw macro-F1** on raihan's diagnosable classes is higher for B.
3. **Safety:** at that operating point, B's false-Healthy rate and unsupported-disease escape rate are each no more than v1's + 2 points.
4. **Non-rice rejection** on every non-rice validation set is ≥ v1's.

If GO, B ships with the threshold that gives that coverage on raihan. Otherwise v1 stays deployed unchanged, and its limits are documented.
