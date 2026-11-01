# OPENCODE TRACK 3 — release tooling for tonight's trained model (run headless by the lead)

All boundaries in `handoff/OPENCODE_TRACK.md` apply:
- this folder only; branch `track/opencode` only
- new files only, as listed below
- never edit `frontend/`, `handoff/PROGRESS.md`, `disease_knowledge/`, or existing `ml/*.py`
- Conventional Commits with "Why:"; push after each task
- add a "Track 3" section to `handoff/OPENCODE_PROGRESS.md`
- stop by 15:30 BST

Before starting, read `handoff/OPENCODE_PROGRESS.md` and skip tasks already done. You may be restarted on another model.

**Context:** tonight the user downloads a zip of the Kaggle run folder (from `ml/kaggle/agroleaf_train_kaggle.ipynb`). Your tools turn that into app-ready files in one command. Read first:
- `handoff/M07_real_model_and_accuracy.md`
- `handoff/X_BACKLOG.md` (the **shared contract** section: exact target paths)
- `ml/evaluate.py` (how `metrics-v1.json` is written)
- `ml/parity_test.py`
- `frontend/src/ml/config.js`
- `ml/kaggle/agroleaf_train_kaggle.ipynb` (cell 11: what the zip contains)

## O8 — `model/metrics.schema.json` + `ml/tools/check_metrics_schema.py`
- **A JSON Schema (draft 2020-12)** for `metrics-v1.json`, exactly as `ml/evaluate.py` writes it today: `model`, `calibration` (with optional `warning`), `internal_test` (with `per_class`), `external[]` (`name`, `doi`, `classes_tested`, `n`, `accuracy_mapped`, `macro_f1_mapped`, `coverage`, `selective_accuracy`, `unseen_rejection_rate`, `per_class`), `limitations`. Metric values are `number|null`, within 0..1 where applicable.
- **The checker:** standard library only. Implement the needed subset of validation by hand; don't add the `jsonschema` dependency unless it's already installed, and then make it optional. It prints errors and exits 1 if there are any.
- **Tests:** run `ml/evaluate.py` output from the toy smoke run through it. Generate that output inside the test, using the toy pipeline in a temp dir, or build a dict that matches evaluate.py's code. Also a broken copy → fails. Add `ml/tests/test_metrics_schema.py`.

## O9 — `ml/tools/make_release_bundle.py`
- **Args:** `--run-zip <path to run1_for_app.zip or an extracted folder>` · `--repo <repo root, default: this script's repo>` · `--dry-run`
- **Steps:**
  1. Extract to a temp dir if given a zip.
  2. **Validate:**
     - `class_index.json` order == the contract
     - `preprocess.json` == `ml/common.py` PREPROCESS_CONFIG
     - `calibration.json` has `temperature` + `threshold` and no `placeholder`
     - `model.onnx` < 24 MiB, first byte `0x08`, no external data, opset and op list printed (with `onnx` if installed)
     - `metrics-v1.json` passes O8
     - `parity_samples.json` present
     - PNGs present

     Any failure → print every problem and exit 1, **without copying anything**.
  3. **Copy** (never move, never delete originals) into the contract paths from `handoff/X_BACKLOG.md`: `frontend/public/models/rice-mnv3l-v1.onnx`, `frontend/public/data/{class_index,preprocess,calibration,metrics-v1,parity_samples}.json`, `frontend/public/accuracy/*.png`. Also copy `metrics-v1.json` + PNGs to `model/experiments/run1/`.
  4. **Do NOT edit** `frontend/src/ml/config.js` or delete the placeholder model. Print the exact one-line change and the file to delete, for Antigravity's M07.
  5. Print a summary: the copied files with sizes; headline metrics read from the JSON (internal macro-F1, coverage, each external set), labelled "MEASURED (from metrics-v1.json)"; and any `calibration.warning`.
- `--dry-run` validates and prints the plan without copying.
- **Tests:** build a fake run folder in a temp dir: a tiny valid ONNX exported from the placeholder script logic, or the toy run if available, plus synthetic JSONs marked `"FIXTURE_NOT_REAL": true`. Point `--repo` at a temp copy, and check what got copied. Then a bad class order → exit 1 and nothing copied. Add `ml/tests/test_release_bundle.py`.

## O10 — `ml/tools/pick_samples.py`
- **Purpose:** choose real, correctly labelled demo images from the dataset's **test split** for the app's "try a sample" strip.
- **Args:** `--data-root <resized or raw dataset root>` · `--splits data/splits.csv` · `--per-class 1` · `--classes healthy,blast,brown_spot,tungro` (default; leaf_smut and sheath_blight are optional) · `--repo` · `--seed 42`
- Picks `per-class` images from `split == "test"`, deterministically.
  - Resizes to 480 px on the long side, JPEG quality 85.
  - Writes them to `frontend/public/samples/<key>_1.jpg`.
  - Writes `frontend/public/samples/manifest.json`: `[{id, labelBn, labelEn, src, credit}]`. Take the labels from `disease_knowledge/*.json` `name_bn`/`name_en`. `credit` = "RiceLeafDiseaseBD v3, CC BY 4.0, DOI 10.17632/86s4jzj2m4.3".
  - Never modifies the dataset. Refuses if `--data-root` is inside `--repo`.
- **Tests:** toy dataset + toy splits in a temp dir → a correct manifest and images. Add `ml/tests/test_pick_samples.py`.

## O11 — `ml/TONIGHT.md`: one page, the exact command sequence for this evening
1. `prepare_dataset.py` (from O1)
2. Kaggle upload + "Run All"
3. download `run1_for_app.zip`
4. `make_release_bundle.py --dry-run`, then for real
5. `pick_samples.py`
6. tell Antigravity "continue M07"

Then optionally `generate_tts.py` once the Azure key is in `.env`. Copy-pasteable Windows commands. Expected outputs. What to do if each step fails.

## Done
Push. Add a "Track 3 summary" at the top of OPENCODE_PROGRESS.md. Print `TRACK3_DONE` as the very last line.
