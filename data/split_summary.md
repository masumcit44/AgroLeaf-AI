# Dataset Split Summary

- Total input images: 9769
- Total retained images: 9601 (98.3%)
- Total exclusions: 168 (1.72%)
- Train images: 6676 (69.5%)
- Val images: 1426 (14.9%)
- Test images: 1499 (15.6%)

## Perceptual Hash Group Statistics
- Total groups: 7904
- Largest group size: 19 images (guard threshold: <= 50)
- Groups with > 10 images: 23

## Exclusions Breakdown
See detailed records in `/kaggle/working/data/exclusions.csv`.
| Exclusion Reason | Count |
|---|---|
| cross_class_group | 129 |
| exact_duplicate_md5 | 39 |

## Group Leakage Verification
- Unique groups in train: 5507
- Unique groups in val: 1182
- Unique groups in test: 1179
- **Shared groups between splits:** **0** (verified)

## Class Distribution per Split
| Class Key | Train | Val | Test | Total |
|---|---|---|---|---|
| healthy | 1090 | 226 | 250 | 1566 |
| blast | 899 | 202 | 190 | 1291 |
| brown_spot | 1474 | 315 | 353 | 2142 |
| leaf_smut | 498 | 114 | 97 | 709 |
| tungro | 1545 | 318 | 355 | 2218 |
| sheath_blight | 1170 | 251 | 254 | 1675 |
