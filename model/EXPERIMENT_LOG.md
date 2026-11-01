# AgroLeaf AI — experiment log

How results are scored:
- With the app's real decision rule: `ml/app_decision.py`, which a test checks against `decide.js`, run through `ml/tools/eval_app.py`.
- **Coverage** = share of rice photos that get a named answer. **Selective accuracy** = share of those answers that are right.
- **Final tests, never used for any choice:** Sylhet (RiceLeafBD, unseen district) and Gujarat (vbookshelf; the only outside leaf-smut photos).
- **Selection data from v4 onwards:** raihan150146 external validation plus non-rice validation rows.

## Completed

### E0 — v1 baseline (deployed model)
- **Model:** MobileNetV3-Large, 6 classes, Gazipur photos only.
- **Decision rule:** threshold 0.48, temperature 0.909, Healthy needs ≥ 0.90, leaf smut always "not sure", leaf-colour gate.

| Set | Raw accuracy / macro-F1 | Coverage | Selective acc. | Diseased called Healthy |
|---|---|---|---|---|
| Internal test (1,499) | 0.869 / 0.843 | 0.815 | 0.911 | 0.2% |
| Sylhet, without its healthy folder (1,308) | 0.420 / 0.394 | 0.711 | 0.489 | 0.3% |
| Savar (3,150) | 0.336 / 0.177 | 0.359 | 0.577 | 14.9% |

- **Non-rice rejected:** everyday photos 95.6%, other crops 86.0%. A green podcast poster was called "Sheath blight" (p = 0.70).
- **Leaf smut, internal test:** precision 0.58, recall 0.71.

### E-ood1 — feature-distance rejection on v1 (kNN / Mahalanobis on 960-d features)
- Threshold constrained to reject at most 1% of outside-district rice photos (fit halves).
- Result: the poster still passes, and only 46–51% of 105 local graphics are rejected.
- **Rejected.** v1's features cannot separate posters from rice photos from a new district.

### E-v3a — EfficientNet-B0, 8 classes, v3 data (`run3_v3`)
- **Data:** Gazipur, Savar, Paddy Doctor (India), Sethy (India), Vietnam, plus not-rice examples (natural photos, PlantVillage, posters, memes, 3,000 generated graphics).
- **Training:** 14 epochs, AdamW lr 1e-3, label smoothing 0.1, class-balanced sampling.
- **Selection:** pooled in-distribution validation; threshold rule gave 0.30.
- **Status:** complete. The job crashed afterwards in the ONNX self-check (static batch), so the MobileNetV3 run never happened.

| Set | Raw accuracy / macro-F1 | Coverage | Selective acc. | Diseased called Healthy |
|---|---|---|---|---|
| Internal test | 0.877 / 0.857 | 0.910 | 0.895 | 0.4% |
| **Sylhet (1,445, held out)** | **0.456 / 0.546** | 0.816 | **0.459** | 0.5% |

- **Non-rice:** test sets 100% rejected (natural, PlantVillage, posters, memes, generated). Local graphics 98.1% (103/105). Poster → "not a rice leaf" (0.991).
- **Sylhet confusion:**
  - brown spot → blast 114, → tungro 121 (93 right);
  - tungro → brown spot 170 (211 right);
  - healthy precision 0.91, recall 0.77.
- **Leaf smut, internal:** precision 0.67, recall 0.73. When ≥ 90% confident it is right 81% of the time (n = 73).
- **Verdict:**
  - Rejection of non-rice photos: solved.
  - Disease generalization: **not improved.** On Sylhet's brown spot and tungro, v3 is worse than v1 (36% vs 42%).
  - The 0.30 threshold, tuned in-distribution, is too permissive.
  - Per-source test splits (Sethy 1.00, Savar 0.99) are inflated by within-source near-duplicates and are not evidence of generalization.

### E-v3b — ConvNeXt-Tiny (in22k), v3 data (`run3_v3_big`)
- **Training:** 12 epochs, lr 2e-4. Same crash after the first model, so EfficientNetV2-S never ran.
- **Results (kernel's simplified rule):**
  - Internal test: accuracy 0.873, macro-F1 0.856.
  - **Sylhet: accuracy 0.509, macro-F1 0.579, coverage 0.929, selective accuracy 0.547.**
  - Posters: 100% rejected.
- **Verdict:** better than EfficientNet-B0 on Sylhet, but only at v1's level. Not worth a server model on this evidence alone.

### E-energy — energy-based rejection on v3 (threshold from validation only)
- Energy over the 6 disease logits rejects 1–20% of non-rice test sets and 2.9% of local graphics.
- Energy over all 8 logits rejects 0–3%, and wrongly rejects 19% of Sylhet rice.
- The trained not-rice class rejects 100% / 98.1% and wrongly rejects 0% of rice test photos (Sylhet 1.2%).
- Combined: no gain. **Rejected.**

### Dataset verification
See `documentation/research/dataset_verification_2026-11-01.md`.
- raihan150146 ≠ vbookshelf.
- The Dhan-Shomadhan Kaggle copy has its sheath blight folder mislabelled, and is white-background only.

## Running

### E-v4 (version 2) — `run4_v4`, EfficientNet-B0, selection on outside-district Bangladeshi data
- **External validation:** raihan150146, never trained on. Used for epoch, temperature, threshold (smallest giving ≥ 90% selective accuracy) and variant choice.
- **Final tests:** Sylhet, Gujarat.
- **Reported only:** Dhan-Shomadhan, white background, labels from filename codes.
- **Checks:** EXIF correction verified per image (the run fails otherwise). Leakage guard: within 4 pHash bits of any test or external-validation image.
- **Variants:**
  - A: all countries, new augmentation (90° turns, JPEG re-compression);
  - B: Bangladesh-only rice data;
  - C: all countries, v3 augmentation.
- The v1 model is re-scored on the same sets.
- Version 1 of this run had the wrong Dhan-Shomadhan labels; its results are discarded.

## Proposals reviewed (Antigravity, 7cedb31) — not adopted without a run

| Proposal | Problem addressed | Baseline | Experiment | Selection data | Success metric | Risks |
|---|---|---|---|---|---|---|
| JPEG, blur, rotation, colour augmentation | Phone photos, messaging-app compression | v3 augmentation (blur and colour already in) | v4 A vs C | raihan external val | External-val macro-F1 and selective accuracy at ≥ 90% target coverage | Too strong hurts lesion texture; slower training |
| CutMix | Background shortcuts | v4 winner | Not run yet. Only if a background shortcut shows (e.g. white-background set very different from field) | raihan external val | Same | Mixed labels on small lesions can blur disease cues; interacts with label smoothing |
| Class-balanced loss (effective number) | Class imbalance | Already handled by class-balanced sampling | Not run: the sampler already gives every class equal mass, so the loss would double-count | – | Per-class recall gap on external val | Over-weighting tiny classes (leaf smut, 498 training images) |
| Label smoothing 0.1 | Over-confidence | In use since v3 (ECE 0.048 internal) | Not ablated | – | ECE and selective accuracy | Can blunt probabilities for the threshold |
| Energy-based rejection | Non-rice photos | Trained not-rice class | **Done (E-energy): rejected** | Validation only | – | – |

## Policies
- **Leaf smut:** stays "not sure, possibly leaf smut". It is never auto-diagnosed and never routed to `other_rice`. Reasons:
  - v3 is only 81% right even at ≥ 90% confidence;
  - there is no outside leaf-smut validation data (raihan has none). Gujarat (40) is a final test and is only reported.
- **Sylhet and Gujarat** never influence training, thresholds or selection.
