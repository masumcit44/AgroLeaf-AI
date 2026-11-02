# v7 protocol — fixed before training (2 Nov 2026, ~08:25 BST)

**Why v7:** on DIU half A (`run5_v5/HALF_A_RESULT.md`), v1, v5 and v6 all fail on Bangladeshi close-ups of single leaves, background removed, with early symptoms.
- Blast is mostly called Healthy (v1) or brown spot (v6).
- Tungro is mostly called Healthy.
- The training data is mainly whole-leaf field photos.

**Hypothesis:** the models rely on the scene, not the lesion. Two changes should help:
- teach lesions independent of the background (background replacement);
- add Bangladeshi white-background photos (Dhan-Shomadhan).

Supported by: Paul 2026, arXiv 2609.31709 (strong augmentation +0.070 cross-dataset macro-F1) and R1 Exp 1.

## Variants (identical to v5 otherwise: EfficientNet-B0, 14 epochs, seed 42, strong augmentation, not_rice data, calibration rule)
- **V7_bg:** v5 rice data (Gazipur, Savar, raihan) + background replacement.
  - With p = 0.5 on rice training rows, the leaf is cut out with a colour mask (closing + hole fill) and pasted on white, grey or plain colour.
  - Skipped when the mask covers < 5% or > 80% of the image (canopy shots).
- **V7_bg_dhan:** V7_bg + Dhan-Shomadhan white-background photos (769; labels from filename codes, as in v6), moved from report set to training (80/10/10 pHash split).

## Never trained on (leakage guard: ≤ 4 pHash bits dropped from training/val)
- **DIU:** half A = selection, half B = final.
- **Aman 2025 Bangladesh** (Hugging Face `Project-AgML/rice_leaf_disease_classification_bd`, Zenodo 10.5281/zenodo.21140529, CC BY 4.0, iPhone field photos, 773). A **new final test**.
  - Mapping: healthy, leaf_blast → blast, brown_spot; bacterial_leaf_blight, leaf_scald, narrow_brown_spot → other_rice.
- **Sylhet and Gujarat:** not loaded.
- The kernel saves DIU and Aman logits but **prints no metrics for them**.

## Selection (DIU half A, app preprocessing and rule, `ml/tools/eval_diu_app_path.py`)
1. Between V7_bg and V7_bg_dhan: more right answers at max(live coverage on A, 30%). Ties go to V7_bg.
2. The selected variant must beat the live system (v1 + G1) on half A (amendment 2). Otherwise NO-GO, and half B stays unread.

Note: half A is now used for a second selection round, so its numbers become optimistic. This is why half B and Aman decide.

## Release gate (read once: DIU half B and Aman 2025)
GO only if **all** hold:
1. **DIU half B:** `PROTOCOL.md` conditions unchanged:
   - at max(live coverage, 30%), ≥ +5 points right answers, with the paired bootstrap 95% CI above 0;
   - higher raw macro-F1;
   - false-Healthy and unsupported-escape each ≤ live + 2 points.
2. **Aman 2025:** at max(live coverage on Aman, 30%):
   - right answers ≥ live − 2 points;
   - false-Healthy ≤ live + 2 points.
3. **Non-rice rejection** on the not_rice test splits ≥ 99% (live G1: 100%).
4. **Gazipur internal test:** answered share ≥ 70%, right ≥ 85% (v1: 94.7% / 88.7%).
5. **Model size** ≤ 25 MiB (Cloudflare per-file limit). Browser inference must work in the decode-path test.

GO → deploy:
- the candidate replaces v1 + G1 (it has its own not_rice output);
- previous files kept for rollback;
- live checks on real photos.

NO-GO → the live system stays and the result is reported.
