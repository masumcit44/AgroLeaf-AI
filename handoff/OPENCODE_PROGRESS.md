# OpenCode track — progress

Branch: `track/opencode` · Agent: opencode (second implementation agent)
Final summary is added at the top after O5 (or a stop condition).

## Final summary

**Completed:** O1–O5, 2026-11-01 (started 07:46 BST, finished about 08:20 BST —
well before the 15:30 stop). All work is on `track/opencode` and pushed to
`origin/track/opencode`; the lead can review and merge. No files outside this
worktree were read or changed, no branch was switched, and `main` was not touched.

**Done**
- **O1:** `ml/prepare_dataset.py` — one command finds the nested six-class root,
  audits, splits, resizes, builds `kaggle_upload.zip` (+ `splits.csv`), refuses a
  work dir inside raw, and prints the `--phash-dist 4` retry advice.
- **O2:** `ml/prepare_external.py` — folders and CSV layouts, 320 px copies,
  unmapped-label warnings, `PROVENANCE.md`; docs in `ml/EXTERNAL_DATA.md`.
- **O3:** `ml/kaggle/agroleaf_train_kaggle.ipynb` — 11-cell Run-All notebook
  (clone/install, config, loud GPU check, train → calibrate → evaluate →
  export_onnx → parity → display → zip without `best.pt`).
- **O4:** `model/MODEL_CARD.md` and `data/DATA_CARD.md` — intended use/limits,
  ethics, provenance, and `[[TBD after training]]` metrics.
- **O5:** `documentation/submission/` — Devpost story, 2-minute English video
  script + shot list, 5-slide deck outline, and submission checklist.

**Tests / checks run**
- `python ml/tests/test_prepare_dataset.py` → PASS (nested root, raw unchanged,
  72 resized images, zip contents, work-inside-raw refusal).
- `python ml/tests/test_prepare_external.py` → PASS (CSV + nested folders,
  resize, unmapped-label warning, provenance, source unchanged).
- `python -m py_compile` on both scripts and both tests → OK.
- `nbformat.validate` + `json.load` + `ast.parse` on every code cell → valid
  11-cell nbformat 4 notebook (not executed; no Kaggle GPU/data here).
- Facts in both cards checked against `data/dataset_inventory.csv`,
  `data/disease_classes.md`, `research/final_decisions.md`, `model/*plan.md`
  and the external maps. No invented metric; every unknown is `[[TBD...]]`.

**Open questions / user actions**
- Real dataset is not downloaded yet, so O1 has not been run on real data and
  O3 has not been executed. All metrics stay `[[TBD after training]]`.
- RiceLeafBD CSV column names are unknown; `ml/EXTERNAL_DATA.md` says to read
  the CSV and pass the real `--image-col` / `--label-col` names.
- User actions from the checklist: official sticker file, live URLs, Azure voice
  terms (or human clips), earlier-research collaborator agreement, student proof.
- `handoff/OPENCODE_TRACK.md` was supplied as an untracked input and is left
  untouched/uncommitted (it is not one of my deliverables).
- At start `track/opencode` was 6 commits behind `origin/main`. Per the hard
  boundaries I did not merge/rebase; the branch is based on that older point and
  only adds new files, so the lead's review/merge should be clean.

**Commits:** one Conventional Commit per task (five), plus a small O2 fix commit
for dotted CSV filenames; all have "Why:" bodies and were pushed task by task.
Final tree is clean apart from the supplied `handoff/OPENCODE_TRACK.md`.

## Status

| Task | Status | Files |
|---|---|---|
| O1 — one-command data preparation | ✅ done | `ml/prepare_dataset.py`, `ml/tests/test_prepare_dataset.py` |
| O2 — external test-set preparation | ✅ done | `ml/prepare_external.py`, `ml/tests/test_prepare_external.py`, `ml/EXTERNAL_DATA.md` |
| O3 — Kaggle notebook | ✅ done | `ml/kaggle/agroleaf_train_kaggle.ipynb` |
| O4 — model card and data card | ✅ done | `model/MODEL_CARD.md`, `data/DATA_CARD.md` |
| O5 — submission drafts | ✅ done | `documentation/submission/{devpost_story,demo_script_en,deck_outline,submission_checklist}.md` |

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

**Status:** done — 2026-11-01 ~08:05 BST

**Files added**
- `model/MODEL_CARD.md` — intended use and users, out-of-scope uses,
  architecture/input contract, training data, evaluation protocol, all metrics
  as `[[TBD after training]]`, calibration and "not sure", limitations (one
  district/season, Leaf Smut external gap, sheath symptoms), ethics (no doses,
  16123 referral with "charges may apply", on-device privacy), and the update
  procedure.
- `data/DATA_CARD.md` — the three datasets actually used (RiceLeafDiseaseBD v3,
  RiceLeafDisease-BD5, RiceLeafBD), with DOI, licence, location, class mapping,
  known issues, de-duplication/split method, provenance rules, and a list of
  inventory datasets that are not used and why.

**How tested**
- Read-only docs; checked every fact against `data/dataset_inventory.csv`,
  `data/disease_classes.md`, `data/data_quality_report.md`,
  `research/final_decisions.md`, `model/*plan.md` and the external maps.
- `grep` for forbidden claims (no "first/only" claims, no "100% accurate",
  no free-call claim, no partnership, no doses). Unknown values are `[[TBD]]`.

**Notes / problems**
- The real per-class counts, exclusions, ONNX size and all metrics stay
  `[[TBD after training]]`; they must be copied from `metrics-v1.json` later.
- RiceyLeafDisease/Dhan-Shomadhan are documented as not used (no maps yet).

## O5 — submission drafts

**Status:** done — 2026-11-01 ~08:20 BST

**Files added**
- `documentation/submission/devpost_story.md` — Inspiration · What it does ·
  How I built it · Challenges · Accomplishments · What I learned · What's next ·
  Built with. Uses "I" (solo), includes the earlier team-research transparency,
  mentions the official sticker in the navbar, and keeps every performance
  number as `[[TBD after training]]`.
- `documentation/submission/demo_script_en.md` — 2-minute English script with
  timestamps and a 16-shot list: problem → sample photo → Bangla result + voice
  → blurry/non-rice photo → "not sure" → accuracy page → privacy → close.
- `documentation/submission/deck_outline.md` — exactly five slides from
  `documentation/buildathon_presentation_notes.md`, with short on-slide text,
  speaker notes and screenshot placeholders. Slide 4 uses the required
  `[[name, university, skills]]`.
- `documentation/submission/submission_checklist.md` — built from
  `documentation/competition_compliance.md`: mandatory sticker/live app/deck,
  all 15 rules, Devpost fields, safety/content checks, technical/privacy checks,
  submission order and open unknowns.

**How tested**
- Cross-checked every factual claim against `competition_compliance.md`,
  `buildathon_presentation_notes.md`, `MVP_requirements.md`, `frontend_spec.md`,
  `research/final_decisions.md` and `disease_classes.md`.
- `grep` for banned claims and invented metrics; no doses, no partnership, no
  free-call claim, no "first/only" claim, no 100%-accuracy claim. All metrics
  remain `[[TBD after training]]`.
- No execution needed (Markdown drafts).

**Notes / problems**
- The deck's rural-internet figure (43.6% vs 75.7%) comes from the repo notes
  but its source is not recorded there; the slide flags `[[add source]]`.
- Live URLs, video URL and participant details are placeholders for the user.
