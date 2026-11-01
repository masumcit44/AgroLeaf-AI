# OpenCode track — progress

Branch: `track/opencode` · Agent: opencode (second implementation agent)
Final summary is added at the top after O5 (or a stop condition).

## Final summary

_Not finished yet._

## Status

| Task | Status | Files |
|---|---|---|
| O1 — one-command data preparation | ✅ done | `ml/prepare_dataset.py`, `ml/tests/test_prepare_dataset.py` |
| O2 — external test-set preparation | ✅ done | `ml/prepare_external.py`, `ml/tests/test_prepare_external.py`, `ml/EXTERNAL_DATA.md` |
| O3 — Kaggle notebook | ✅ done | `ml/kaggle/agroleaf_train_kaggle.ipynb` |
| O4 — model card and data card | ⬜ not started | — |
| O5 — submission drafts | ⬜ not started | — |

## O1 — `ml/prepare_dataset.py`

**Status:** done — 2026-11-01 ~07:55 BST

**Files added**
- `ml/prepare_dataset.py` — finds the folder that directly holds the six class
  folders (up to 3 levels below `--raw`), runs `audit_dataset.py`,
  `make_splits.py`, `resize_for_upload.py` via `subprocess`/`sys.executable`,
  copies `splits.csv` into `--work`, and builds `kaggle_upload.zip`
  (`RiceLeafDiseaseBD_v3_320/` + `splits.csv`). Refuses a `--work` inside
  `--raw` and never writes to the raw folder. If the split guard fails it
  prints the `--phash-dist 4` re-run command.
- `ml/tests/test_prepare_dataset.py` — plain-assert smoke test.

**How tested**
```bash
python ml/tests/test_prepare_dataset.py
```
Creates the toy dataset at `ml/toy_data/nested/extra/raw`, runs
`prepare_dataset.py --raw ml/toy_data/nested --work ml/toy_data/work`, and asserts:
nested class root found, 72 images resized to 320×320, `splits.csv` inside the
zip, raw folder unchanged (MD5 snapshot), and a `--work` inside `--raw` is refused.

Not run on the real dataset (not downloaded yet). No new packages.

**Notes / problems**
- Added an optional `--data-dir` (default `<repo>/data`) so the smoke test does
  not overwrite real `data/splits.csv`; the documented O1 command is unchanged.
- `data/audit_output/`, `data/splits.csv`, `data/split_summary.md` and
  `data/exclusions.csv` are generated only by a real run; not committed.

## O2 — `ml/prepare_external.py`

**Status:** done — 2026-11-01 ~07:50 BST

**Files added**
- `ml/prepare_external.py` — prepares external test sets in either layout:
  `--layout folders` (nested class-folder search, shared with O1) or
  `--layout csv --csv <file> --image-col <name> --label-col <name>`.
  Copies (never moves) images into `<out>/<label>/`, resizes them to 320 px by
  importing `resize_image` from `ml/resize_for_upload.py`, skips and warns about
  labels absent from the `--map` JSON, and writes `<out>/PROVENANCE.md` with
  source, DOI, date and counts.
- `ml/tests/test_prepare_external.py` — toy CSV test (required) plus a nested
  folders test.
- `ml/EXTERNAL_DATA.md` — download links/DOIs from `data/dataset_inventory.csv`,
  prepare commands for RiceLeafDisease-BD5 and RiceLeafBD, the RiceyLeafDisease
  caveat (originals only, no map yet), and the Kaggle `--external` syntax.

**How tested**
```bash
python ml/tests/test_prepare_external.py
```
Creates a toy CSV dataset with 4 mapped labels and one unmapped label; asserts
320×320 output folders, the unmapped label is skipped with a warning, source
files are unchanged, and `PROVENANCE.md` has the DOI. The folders test asserts
nested class-root detection and the same resize/skip behaviour.

**Notes / problems**
- Real CSV column names for RiceLeafBD are not known yet; `EXTERNAL_DATA.md`
  tells the user to open the CSV and pass the actual headers. No names invented.
- `evaluate.py` uses `rsplit(":", 1)`, so Windows drive-letter paths in
  `--external` are safe; documented.
- O1 and O2 tests write only under the git-ignored `ml/toy_data/`.

## O3 — Kaggle notebook

**Status:** done — 2026-11-01 ~07:55 BST

**File added**
- `ml/kaggle/agroleaf_train_kaggle.ipynb` — valid nbformat 4 notebook with 11
  cells matching `KAGGLE_RUNBOOK.md`: title/instructions (dataset, GPU T4,
  Internet), clone + filtered `pip install`, config (`DATA_ROOT`, `SPLITS_CSV`,
  `RUN_DIR`, `ARCH`, `EPOCHS`, `EXTERNAL`), loud GPU check, train → calibrate →
  evaluate (adds one `--external` per `EXTERNAL` entry) → export_onnx →
  parity_test, inline `metrics-v1.json` + PNG display, and the zip without
  `best.pt` plus download/copy instructions.

**How tested**
- `nbformat.validate` passed when the file was generated; `json.load` confirms
  11 cells; every code cell was parsed with `ast.parse` (syntax OK).
- The notebook was **not executed** (no Kaggle GPU/dataset here).

**Notes / problems**
- The runbook's `!python ... "$DATA_ROOT"` uses shell syntax for a Python
  variable; the notebook uses `subprocess.run([sys.executable, ...])` so the
  config values actually reach the scripts.
- Default `EXTERNAL = []`; add specs from `ml/EXTERNAL_DATA.md` when those
  private datasets are attached.

## O4 — model card and data card

_Not started._

## O5 — submission drafts

_Not started._
