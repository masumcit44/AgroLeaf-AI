# v5 protocol — fixed before training (2 Nov 2026, ~02:45 BST)

**Hypothesis:** training on all three Bangladeshi field sources (Gazipur v1 train split, Savar, raihan) plus a not_rice class, with strong augmentation, generalizes better than the live system (v1 + G1 gate) to Bangladeshi field photos from a source never used before.

## Data
- **Training (rice):** gazipur (v1 train split), savar, raihan150146. 80/10/10 group split by pHash. Labels from verified folder mappings; Dhan-Shomadhan stays report-only.
- **Training (not_rice):** natural, PlantVillage, posters, memes, generated (as in v4).
- **Excluded entirely:** India and Vietnam rice data. In v4 these hurt Bangladeshi generalization.
- **Selection and calibration** (epoch, temperature, threshold): the pooled in-domain **val** splits only.
- **Final test, read once after training:** DIU "Rice Leaf Disease and Pest Dataset" raw subset.
  - Source: Hugging Face `Project-AgML/rice_disease_classification_bangladesh`, `raw/`; Mendeley 10.17632/vwv3nry3wr.1; CC BY 4.0; Hasan et al. 2025, *Data in Brief* 111977.
  - Mapping: Healthy → healthy, Rice Blast → blast, Rice Tungro → tungro; Leaf Scald, Insect, Leaffolder, Stripes → other_rice (unsupported rice problem); "Rice" (unclear) → excluded.
- **Leakage guard:** training/val rows within 4 pHash bits of any DIU image are dropped and counted.
- **Not loaded:** Sylhet and Gujarat.

## Model and training
EfficientNet-B0 (timm, ImageNet pretrained), 14 epochs, AdamW lr 1e-3, label smoothing 0.1, class-balanced sampling, strong augmentation (90° turns, JPEG re-compression, RandomResizedCrop 0.25–1, colour jitter, blur, erasing). Seed 42.

## Calibration
- **Temperature:** fitted on the pooled val.
- **Threshold:** the smallest value giving ≥ 92% right named answers on the pooled val rice rows.
- **App rules unchanged:** Healthy ≥ 0.90, leaf smut "not sure", not_rice / other_rice never named.

## Decision on DIU (both systems scored with the same images and the app's rule)
- **Live system:** v1 (deployed calibration + colour gate) + G1 gate (v4-B argmax == not_rice → "not a rice leaf").
- **Candidate:** v5 with the calibration above.

GO only if **all** hold:
1. At the live system's coverage on DIU rice photos (or 30%, whichever is higher), v5's share of right answers is ≥ 5 points higher, and the paired bootstrap 95% CI of the difference is above 0.
2. v5 raw macro-F1 on DIU's diagnosable classes is higher.
3. v5's false-Healthy and unsupported-escape rates are each ≤ the live system's + 2 points.

Otherwise NO-GO and the live system stays. DIU contains no brown spot, sheath blight or leaf smut, so a GO says nothing about those classes, and that limitation must be stated.
