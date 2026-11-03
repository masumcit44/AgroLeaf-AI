# Antigravity — finish R10c, then R11 with leaf isolation (Batch 1)

Read `B1_COMMON_RULES.md` (same folder) first.

## Task 1 — finish R10c (in progress)
Continue `handoff/R10c_TEST_SET_CHECKS_AND_DEDUP.md` in `D:\Desktop\AIgnite 2026\AgroLeaf_AI_AIgnite_2026` (branch `feat/r10-dataset-expansion`).

**Your finding** that only about 996 of the 5,678 frozen-test files are original camera photos (the rest augmented) is exactly the kind of check needed. Then:
- rebuild the frozen test from the **originals only**;
- report the new per-class counts and capture groups;
- re-run the ≤ 8-bit overlap check against v10's training sources, both DIU halves and the old test sets.

**If fewer than about 800 originals remain** after the checks, say so. The lead will decide whether to add a second Bangladeshi source to the frozen test. Do not choose silently.

## Task 2 — R11 robust preprocessing, now including the owner's leaf-isolation request
Your existing brief is `handoff/R11_ROBUST_PREPROCESSING_PIPELINE.md`. **Add** the owner's leaf-isolation idea to it as candidate methods under the same protocol, gate and leakage rules.

### Setup
A new worktree, so R10 work is not mixed in:

```
git -C "D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt" worktree add "D:/Desktop/AIgnite 2026/AgroLeaf_antigravity_r11" -b feat/r11-preprocessing origin/deploy/candidate-ready
```

**Exclusive grant for this task:** you may change `frontend/src/ml/preprocess.js`, `frontend/src/ml/predict.js` and add files under `frontend/src/ml/isolation/`. No other agent touches `frontend/src/ml/**`. Also yours: `ml/preprocessing/**` and `documentation/preprocessing/**`.

### What the owner asked for (summary)
Isolate the rice leaf from cluttered backgrounds, keep every symptom, crop with padding, and feed the classifier a clean leaf. Compare background strategies **by measurement, not by looks**:
- A — original;
- B — leaf on white;
- C — leaf on neutral grey;
- D — leaf on a natural/green background;
- E — background blurred;
- F — tight crop keeping the original background around the leaf.

Plus candidate methods: classical colour/texture mask (must include yellow, brown and orange diseased tissue), a pretrained segmentation model (licence, size and browser speed checked), or a small custom segmenter. A detector or segmenter must be MIT / Apache / BSD, not AGPL.

### Facts the lead already knows: test them, do not assume
1. **Training-distribution risk.** v10 was trained on mixed backgrounds, and **some sources are white-background** (DIU close-ups; the Dhan-Shomadhan white-background set). Putting every photo on white (strategy B) may push predictions toward those sources' classes.
   - **Measure the class-prediction shift per strategy** on the dev set before anything else.
2. **Training uses RandomResizedCrop(scale 0.25–1.0)**, so the model has seen tight crops. Strategy F (a crop with real background) is therefore the most in-distribution option.
   - If B–E only work after retraining with background augmentation, say so: that becomes a **v11 training proposal** to the lead, not something to ship now.
3. **Lesion-preservation check:** RiceLeafDiseaseBD v3 (Gazipur) has YOLO lesion boxes. Report the share of lesion area lost by each mask/crop.
4. **Model input is fixed:** 320 × 320, ImageNet normalisation, EfficientNet-B0, 8 outputs. No stretching.
5. **When isolation fails** (no leaf, leaf too small, mask unsure), the app must ask for a better photo, using the texts from R11 §5, instead of predicting.

### Deliverables
As in R11 §8, plus:
- a strategy comparison table A–F: per class P/R/F1, accuracy, right-among-answered, wrong answers, lesion area lost, latency;
- a test of whether the classifier's predictions change because of the background itself.

**The gate in R11 §4 decides.** If no strategy passes, report it, and propose the v11 training change (background randomisation) to the lead.
