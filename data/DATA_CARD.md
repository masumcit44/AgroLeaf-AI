# AgroLeaf AI — Data Card

This card covers the datasets **actually used** by AgroLeaf AI: one training set and two external test sets. Every dataset is CC BY 4.0, so the DOI and attribution must stay visible in the app and the repo. Values that are not known yet are marked `[[TBD]]`; they are filled from the audit, not guessed.

---

## 1. Summary

| Dataset | Role | Images | Licence | DOI | Used for |
|---|---|---|---|---|---|
| RiceLeafDiseaseBD v3 | Primary training | 9,769 published; `[[TBD after download]]` received | CC BY 4.0 | 10.17632/86s4jzj2m4.3 | Train / validation / internal test |
| RiceLeafDisease-BD5 (RiceLeafBD, Savar) | External test | 2,545 | CC BY 4.0 | 10.17632/sjkptpgv79.2 | External test + unseen-class rejection |
| RiceLeafBD (Sylhet–Dhaka) | External test | 1,555 | CC BY 4.0 | 10.17632/kx9rx8p2mz.1 | External test + unseen-class rejection |

All datasets are rice leaf images from Bangladesh. None is used to train on the external test sets.

---

## 2. Primary training set — RiceLeafDiseaseBD v3

| Field | Value |
|---|---|
| Source | https://data.mendeley.com/datasets/86s4jzj2m4/3 |
| DOI / version | 10.17632/86s4jzj2m4.3 (v3, published 2026-09-01) |
| Licence | CC BY 4.0 |
| Location / season | Gazipur, Dhaka, Bangladesh; Summer 2025 |
| Devices / resolution | CMF Phone 2 Pro and Google Pixel 5; 1024×1024 |
| Format | Six class folders plus YOLO bounding-box files (21,460 boxes) |
| Published total | 9,769 images |
| Per-class counts | Not published on the page; `[[TBD after audit]]` |
| Download date / zip SHA256 | `[[TBD]]` |

**Class mapping**

| Folder | Model class | Bangla |
|---|---|---|
| Healthy | `healthy` | সুস্থ পাতা |
| Blast | `blast` | ব্লাস্ট |
| Brown spot | `brown_spot` | বাদামী দাগ |
| Leaf smut | `leaf_smut` | পাতার স্মাট / পাতায় কালো দাগ (term to be confirmed) |
| Rice Tungro | `tungro` | টুংরো |
| Sheath blight | `sheath_blight` | খোল পোড়া |

The class index is fixed by the folder order discovered at preparation time and written to `class_index.json`. The app, `ml/common.py` and the disease JSON must use that same order.

**Known issues**
- Training used the Kaggle mirror `shahiismyname/riceleafdiseasebd-dataset` (`Original images` folder, 9,769 images, matching the Mendeley v3 count; class folder labels only).
- Its YOLO box files are an older annotation version (about 70k boxes vs 21,460 in v3); boxes are not used by this classifier.
- Never train on the `Annotated images (visual with labels)` folder: it has boxes drawn on the photos.
- **One district, one season, two phones.** Domain shift is expected; this is why external testing is mandatory.
- Class imbalance is unknown until the audit. Class weights are decided after the audit, not before.
- Field photos are often burst shots, so near-duplicates are likely. They must be grouped and never split across train and test.
- Images may contain more than one disease (about 2.2 boxes per image), but the MVP trains at image level and ignores boxes.
- The Mendeley page mentions expert validation; the kappa value in older team files is not on the page and is **not** claimed.
- The YOLO boxes are not used: no localisation, no lesion crops.

**De-duplication and split method**
1. `ml/audit_dataset.py` reads every image, records MD5 and perceptual hash, and reports exact duplicates, cross-class duplicates and near-duplicate groups.
2. `ml/make_splits.py` removes exact duplicates (keeps one), removes every group that spans more than one class, and records all exclusions in `data/exclusions.csv`.
3. Near-duplicate groups use Hamming distance ≤ 6 by default. If the largest group exceeds 50 images or exclusions exceed 5%, the run stops and advises `--phash-dist 4`.
4. Splits are 70/15/15 train/val/test with `StratifiedGroupKFold`, grouped by perceptual-hash `group_id`, seed 42. Zero shared groups is asserted.
5. The test split is not touched until the final evaluation. Validation is used for early stopping, temperature scaling and the threshold.
6. Images are resized to 320 px only for the Kaggle upload. Training/evaluation still use the 256 → 224 centre-crop contract.

Exclusion counts, largest group and retained per-class counts: `[[TBD after audit]]`.

---

## 3. External test set — RiceLeafDisease-BD5 (RiceLeafBD, Savar)

| Field | Value |
|---|---|
| Source | https://data.mendeley.com/datasets/sjkptpgv79/2 |
| DOI / version | 10.17632/sjkptpgv79.2 (v2, published 2026-07-28) |
| Licence | CC BY 4.0 |
| Location / season | Savar, Akran, Birulia, Dhaka District; Oct–Nov 2024 |
| Devices | Consumer smartphones; resolution not stated |
| Format | Class folders |
| Total | 2,545 images |
| Class map | `ml/external_maps/riceleafdisease_bd5.json` |
| Prepare | `ml/prepare_external.py --layout folders ...` (see `ml/EXTERNAL_DATA.md`) |

**Class mapping**

| Folder | Model class | Images (inventory) |
|---|---|---|
| Normal Leaf | `healthy` | 923 |
| Blast | `blast` | 339 |
| Sheath Blight | `sheath_blight` | 454 |
| Tungro | `tungro` | 500 |
| Narrow Brown Spot | `__unseen__` | 329 |

**Known issues**
- **Narrow Brown Spot is not Brown Spot.** It must never be mapped to `brown_spot`; it is used only to test "not sure".
- This set has **no Brown Spot and no Leaf Smut**. Do not report a score for a class the set does not contain; `evaluate.py` reports `null` and that is not a zero.
- It is a different district from training, so it is an external test only. Never train on it for the main result.
- Folder names must match the map exactly. Unmapped folders make `evaluate.py` stop rather than silently ignore them.

---

## 4. External test set — RiceLeafBD (Sylhet–Dhaka)

| Field | Value |
|---|---|
| Source | https://data.mendeley.com/datasets/kx9rx8p2mz/1 |
| DOI / version | 10.17632/kx9rx8p2mz.1 (v1, published 2025-11-07) |
| Licence | CC BY 4.0 |
| Location / season | Sylhet and Dhaka; Aman season |
| Devices | Samsung Galaxy S21 Ultra; Redmi Note 9 |
| Format | Images + a CSV label file |
| Total | 1,555 images |
| Class map | `ml/external_maps/riceleafbd_sylhet.json` |
| Prepare | `ml/prepare_external.py --layout csv --csv ... --image-col ... --label-col ...` (see `ml/EXTERNAL_DATA.md`) |

**Class mapping**

| CSV label | Model class | Images (inventory) |
|---|---|---|
| Healthy | `healthy` | 252 |
| Brown Spot | `brown_spot` | 356 |
| Tungro Virus | `tungro` | 530 |
| Bacterial Leaf Blight | `__unseen__` | 417 |

**Known issues**
- **Bacterial Leaf Blight is not a training class.** It is used only to test whether the model says "not sure".
- No Leaf Smut and no Sheath Blight in this set.
- The actual CSV column names are `[[TBD]]` until the file is opened; pass them with `--image-col` and `--label-col`. Do not guess.
- Images are copied (never moved) and resized to 320 px; originals remain in the download folder.
- Related preprint: arXiv:2501.08912 (context only; not a metric source).

---

## 5. Handling rules common to all sets

- **Freeze originals.** Raw downloads live outside the repo and are never edited. Preparation reads them and writes a new folder.
- **Copy, don't move.** External preparation copies images into `<out>/<label>/`; the source is verified unchanged by the smoke test.
- **No augmentation for evaluation.** External sets are never augmented. For RiceyLeafDisease (not used yet), only originals would be allowed because the published augmented copies must never enter a test set.
- **Do not merge labels across datasets.** Brown Spot ≠ Narrow Brown Spot; Tungro ≠ Tungro Virus as a folder *name* but both map to `tungro`; Bacterial Leaf Blight has no class.
- **Provenance.** `ml/prepare_external.py` writes `<out>/PROVENANCE.md` with source path, DOI, date and per-label counts. Keep it with the prepared set.
- **Attribution.** CC BY 4.0 requires credit. DOIs appear in the About/Accuracy pages, this card, the model card and the README.
- **No personal data is intended.** The datasets are leaf photos. If a photo contains an incidental person, it is not used for anything beyond training/evaluation and is never uploaded by the app.
- **Report nulls honestly.** A class absent from a test set is reported as `null`/not tested, never as 0% or 100%.

---

## 6. Datasets in the inventory that are NOT used

These appear in `data/dataset_inventory.csv` but are not part of the current training or evaluation. They are listed so the omission is explicit.

| Dataset | Why not used now |
|---|---|
| RiceyLeafDisease (10.17632/t46kkgh2yw.1) | Optional external test. No class-map file yet. If used, **originals only** (1,701); the 5,188 augmented copies must never be in a test set. |
| Dhan-Shomadhan (10.17632/znsxdctwtt.1) | Optional extra; white-background/lab-like images, low priority. No map. |
| BanglaRiceLeaf (10.7910/DVN/XAOBYW) | Record not verified; do not use until confirmed. |
| Eggplant, Chili, Tomato, Potato datasets | Future crops; outside this rice MVP. |

---

## 7. Update procedure

1. After download, fill the received count, download date, zip SHA256 and per-class counts from `data/audit_output/audit_summary.md` and `images.csv`.
2. Fill exclusion counts and largest group from `data/split_summary.md`.
3. After external preparation, keep `PROVENANCE.md` and confirm every source label appears in the map.
4. After evaluation, record which external sets were used and which classes were absent in `model/experiments/<date>_mnv3_large.md` and on the Accuracy page.
5. If a dataset, version, licence or DOI changes, update this card, `model/MODEL_CARD.md` and the app credits together.
