# Manual smoke-test images (AgroLeaf AI)

**Purpose:** a small set of images for uploading by hand to the real app, to see that the full flow works with the actual deployed model: upload → in-browser model → result card → voice → 16123.

**Not for:** training, threshold tuning, model selection, or any official evaluation. These images were chosen without looking at the model's output and say nothing about accuracy. The measured accuracy is on the in-app accuracy page (`frontend/public/data/metrics-v1.json`).

## How to test
1. Open https://agroleaf-ai.pages.dev (or `cd frontend && npm run build && npx vite preview`).
2. Tap **গ্যালারি / Gallery** and choose one image from a folder below.
3. Tap **পরীক্ষা করুন / Check** and compare the result with the "expected" column.
4. On a result card, tap ▶ to hear the Bangla voice, and check that the 16123 button opens the dialer.
5. Repeat for each image. Note any mismatch (image, result shown, expected).

## The deployed model (checked in the repo on 2 Nov 2026)
- **Model:** `frontend/public/models/rice-mnv3l-v1.onnx` (v1).
- **Classes:** exactly 6, from `frontend/public/data/class_index.json`: `healthy`, `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`. There is **no** bacterial blight class.
- **App rules** (`frontend/src/ml/decide.js`, `frontend/public/data/calibration.json`):
  - Healthy is shown only at ≥ 90% confidence; below that, a "may be healthy, not sure" card.
  - **Leaf smut is always shown as "not sure"**, with leaf smut as a possibility.
  - A leaf-colour check rejects images that don't look like a leaf ("not a rice leaf").
  - Anything below the confidence threshold is "not sure".

## Images and expected outcome
| File | True label (source) | Expected app outcome | Label status |
|---|---|---|---|
| `healthy/healthy_01.jpg` | healthy | Healthy (or "may be healthy, not sure" if below 90%) | verified by the dataset |
| `healthy/healthy_02.jpg` | healthy | same as above | verified by the dataset |
| `blast/blast_01.jpg` | blast | Blast, or "not sure" | verified by the dataset |
| `blast/blast_02.jpg` | blast | Blast, or "not sure" | verified by the dataset |
| `brown_spot/brown_spot_01.jpg` | brown spot | Brown spot, or "not sure" | verified by the dataset |
| `brown_spot/brown_spot_02.jpg` | brown spot | Brown spot, or "not sure" | verified by the dataset |
| `leaf_smut/leaf_smut_01.jpg` | leaf smut | **"not sure"** (by design), possibly listing leaf smut | verified by the dataset |
| `leaf_smut/leaf_smut_02.jpg` | leaf smut | **"not sure"** (by design) | verified by the dataset |
| `tungro/tungro_01.jpg` | tungro | Tungro, or "not sure" | verified by the dataset |
| `tungro/tungro_02.jpg` | tungro | Tungro, or "not sure" | verified by the dataset |
| `sheath_blight/sheath_blight_01.jpg` | sheath blight | Sheath blight, or "not sure" | verified by the dataset |
| `sheath_blight/sheath_blight_02.jpg` | sheath blight | Sheath blight, or "not sure" | verified by the dataset |
| `unsupported_disease/bacterial_leaf_blight_01.jpg` | bacterial leaf blight (**not supported by the app**) | Ideally "not sure". **Known limitation:** v1 often shows one of its 6 diseases for unsupported diseases (67.6% on Sylhet), so a wrong disease name here is a documented weakness, not a new bug. | verified by the dataset |
| `unsupported_disease/bacterial_leaf_blight_02.jpg` | bacterial leaf blight (not supported) | same as above | verified by the dataset |
| `not_rice/not_rice_01_sticker.png` | not a rice leaf (competition sticker) | "This does not look like a rice leaf" (observed in the lead QA run, check F2) | certain (it is our own logo file) |
| `not_rice/not_rice_02_app_screenshot.png` | not a rice leaf (screenshot of the app's home page) | "not a rice leaf" or "not sure"; must **not** show a disease | certain (app screenshot) |
| `unclear/unclear_01_closeup.jpg` | unclear: an 80×80 crop of the app's brown-spot sample | "not sure" (observed in the lead QA run, check F1) | derived image, see note |

## Sources (files copied byte for byte; originals untouched)
| File | Original | Dataset / licence |
|---|---|---|
| `healthy/healthy_01.jpg` | `Original images/Healthy/Healthy_100.jpg` | RiceLeafDiseaseBD v3 (Gazipur), DOI 10.17632/86s4jzj2m4.3, CC BY 4.0; Kaggle copy `shahiismyname/riceleafdiseasebd-dataset` |
| `healthy/healthy_02.jpg` | `Original images/Healthy/Healthy_1003.jpg` | same |
| `blast/blast_01.jpg` | `Original images/Blast/blast_100.jpg` | same |
| `blast/blast_02.jpg` | `Original images/Blast/blast_1014.jpg` | same |
| `brown_spot/brown_spot_01.jpg` | `Original images/Brown spot/brown spot_1008.jpg` | same |
| `brown_spot/brown_spot_02.jpg` | `Original images/Brown spot/brown spot_102.jpg` | same |
| `leaf_smut/leaf_smut_01.jpg` | `Original images/Leaf smut/Leaf smut_102.jpg` | same |
| `leaf_smut/leaf_smut_02.jpg` | `Original images/Leaf smut/Leaf smut_111.jpg` | same |
| `tungro/tungro_01.jpg` | `Original images/Rice Tungro/Rice Tungro_100.jpg` | same |
| `tungro/tungro_02.jpg` | `Original images/Rice Tungro/Rice Tungro_1003.jpg` | same |
| `sheath_blight/sheath_blight_01.jpg` | `Original images/Sheath blight/Sheath blight_1008.jpg` | same |
| `sheath_blight/sheath_blight_02.jpg` | `Original images/Sheath blight/Sheath blight_1012.jpg` | same |
| `unsupported_disease/bacterial_leaf_blight_01.jpg` | `paddy-disease-classification/train_images/bacterial_leaf_blight/100023.jpg` | Paddy Doctor (India), Kaggle `imbikramsaha/paddy-doctor`, listed as CC0 |
| `unsupported_disease/bacterial_leaf_blight_02.jpg` | `.../bacterial_leaf_blight/100049.jpg` | same |
| `not_rice/not_rice_01_sticker.png` | `assets/brand/aignite-sticker-original.png` | this repository |
| `not_rice/not_rice_02_app_screenshot.png` | `documentation/screenshots/release/01_home.png` | this repository |
| `unclear/unclear_01_closeup.jpg` | `documentation/screenshots/release/inputs/not_sure_closeup.jpg` | this repository (a crop of the app's `brown_spot_1` sample) |

## How the images were chosen (no cherry-picking)
- **Rice classes:** the first two files by name in each class of the v1 **internal test split** (`data/splits.csv`, split = `test`). Never the training split. Chosen before running any model on them.
- **Bacterial leaf blight:** the first two files by name in Paddy Doctor's `bacterial_leaf_blight` folder. Paddy Doctor is not one of v1's evaluation sets.
- **Never used:** Sylhet and Gujarat (final tests), raihan (the model-selection set), or any personal photos.
- **Checks (2 Nov 2026):**
  - every downloaded file's MD5 equals the value recorded by the Kaggle data audit (`agroleaf-data-audit`);
  - every file opens (Pillow verify);
  - no exact or near duplicates (pHash ≤ 6 bits) inside this folder or against `frontend/public/samples/`.

## Known limitations
- **Gazipur images are the model's home district** (internal test split), so the app does well on them (91% of answered internal-test photos right). Real fields elsewhere are much harder; see the accuracy page (Sylhet 53.7% of answers right, raihan 9.8%).
- **No local images of other crops' leaves.** Licensed sets exist (PlantVillage), but their licence is unclear, so none were added.
- **The unclear image is derived** (a crop), not a natural blurry photo.
- **Two images per class** is a smoke test, not a measurement.
