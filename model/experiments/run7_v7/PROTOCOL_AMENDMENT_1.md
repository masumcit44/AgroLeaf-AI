# v7 protocol amendment 1 — Aman 2025 is partly copied from other datasets

Written 2 Nov 2026, ~08:45 BST.
- v7 is still training.
- No v7 output has been read.
- No system has been scored on Aman 2025.

## Finding (consolidated manifest, `data_manifest/`, run 2)
Many Aman 2025 images (Hugging Face `Project-AgML/rice_leaf_disease_classification_bd`) have an **exact 64-bit pHash match** in another dataset. They are resized copies (480×640 vs 1024×1024 originals), almost always with the same label:

| Source | Aman images within 4 bits | Exact pHash | Same label |
|---|---|---|---|
| Gazipur | 163 | 156 | 132 |
| Paddy Doctor (India) | 74 | 68 | 73 |
| Sethy (India) | 65 | 61 | 65 |
| Dhan-Shomadhan | 16 | 14 | 16 |
| Sylhet | 10 | 9 | 10 |
| raihan | 6 | 4 | 5 |

So the dataset card's "iPhone photos, Aman 2025" does not describe the whole set.

## Change
Aman is scored **only on images with no pHash match within 8 bits in any other source of the manifest**: 422 of 773.
- healthy 48
- blast 52
- brown spot 59
- other rice problems 263

The list is fixed now, before any reading: `aman_unique_gt8.txt`. It holds row indices of the Hugging Face parquet, in file order.

v7's training kernel already drops training rows within 4 bits of any Aman image (leakage guard). The release-gate condition on Aman is unchanged, but now applies to this subset.

**Limitations:**
- 159 images in the named classes is a small test: confidence intervals will be wide.
- No independent origin is confirmed for the remaining images either, only that they are not copies of the datasets we hold.
