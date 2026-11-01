# OpenCode track — progress

Branch: `track/opencode` · Agent: opencode (second implementation agent)
Final summary is added at the top after O5 (or a stop condition).

## Final summary

_Not finished yet._

## Status

| Task | Status | Files |
|---|---|---|
| O1 — one-command data preparation | ✅ done | `ml/prepare_dataset.py`, `ml/tests/test_prepare_dataset.py` |
| O2 — external test-set preparation | ⬜ not started | — |
| O3 — Kaggle notebook | ⬜ not started | — |
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

_Not started._

## O3 — Kaggle notebook

_Not started._

## O4 — model card and data card

_Not started._

## O5 — submission drafts

_Not started._
