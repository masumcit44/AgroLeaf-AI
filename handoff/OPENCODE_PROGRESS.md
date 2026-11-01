# OpenCode track — progress

Branch: `track/opencode` · Agent: opencode (second implementation agent)
Final summary is added at the top after O5 (or a stop condition).

## Track 3 summary

**Status:** O8–O11 complete, 2026-11-01 ~08:46 BST, pushed on `track/opencode`.
No existing file was changed except this progress file; `frontend/`, the
existing `ml/*.py` scripts and `main` were not touched.

- **O8:** `model/metrics.schema.json` (draft 2020-12) covers every key
  `ml/evaluate.py` writes, with metrics as `number|null` in 0..1 and optional
  `calibration.warning`; `ml/tools/check_metrics_schema.py` is a stdlib-only
  validator (no new dependency) that prints every error and exits 1. Tests build
  a document matching evaluate.py's code, accept nulls, and reject 11 broken
  copies.
- **O9:** `ml/tools/make_release_bundle.py` accepts a zip or extracted run,
  finds the nested `run1/`, validates class order, preprocess, calibration (no
  `placeholder`), ONNX (< 24 MiB, first byte `0x08`, no external data, opset +
  operators when `onnx` is installed), the metrics schema, parity samples and
  PNGs. It prints all problems and copies nothing on failure; on success it
  copies to the M07 contract paths plus `model/experiments/run1/`, prints sizes
  and a `MEASURED (from metrics-v1.json)` summary, and leaves `config.js` and the
  placeholder model untouched. `--dry-run` stops before copying.
- **O10:** `ml/tools/pick_samples.py` deterministically picks real test-split
  images, resizes to 480 px on the long side (JPEG q85), writes
  `frontend/public/samples/<key>_<n>.jpg` + `manifest.json` with the Bangla/
  English names from `disease_knowledge/` and the CC BY 4.0 DOI credit, and
  refuses a `--data-root` inside `--repo`.
- **O11:** `ml/TONIGHT.md` is the one-page Windows sequence (prepare → Kaggle
  upload/Run All → download zip → dry-run → real bundle → pick samples → tell
  Antigravity "continue M07"), with expected output lines and failure advice,
  plus the optional Azure TTS step.

**Tests:** `python ml/tests/test_metrics_schema.py`,
`python ml/tests/test_release_bundle.py` and
`python ml/tests/test_pick_samples.py` all PASS; `py_compile` on all six new
Python files is clean. The release-bundle test builds a tiny valid ONNX and
checks zip input, dry-run, bad class order and multiple problems (nothing copied
in either failure case). No real Kaggle run exists yet, so every real number is
still unmeasured. `handoff/X_BACKLOG.md` referenced by the brief is not present;
the exact paths listed in `OPENCODE_TRACK_3.md` were used instead.

## Track 2 summary

**Status:** O6 and O7 complete, 2026-11-01 ~08:15 BST. Pushed on
`track/opencode`. No existing file was changed except this progress file; no
branch was switched and `main` was not touched.

- **O6 — QA templates:** `documentation/qa/qa_checklist_v1.md` is a blank
  template with a two-device header (device, Android, browser, network, date),
  all 11 M09 on-device checks for each of the two devices, the 8 release
  blockers, and the 7 sticker rules. `documentation/qa/hallway_test_v1.md` has a
  bilingual consent line, the 5 tasks written to read aloud in simple Bangla
  with English beside them, a per-participant result table (T1–T5, wrong taps,
  time to first result, confirmed-result belief, audio understanding, quote),
  the four pass criteria, and a "Fixes made after the test" table.
- **O7 — Glossary:** `documentation/glossary_bn_en.md` lists all 7 class/disease
  names, every JSON key in the BN/EN knowledge files, the 9 fixed UI terms, and
  **10 inconsistencies for the lead to review**. Bangla was copied exactly from
  the JSON, not corrected.

**Checks run:** every Bangla disease name, the disclaimer and the helpline were
asserted present in the glossary by a Python check against
`disease_information_bn.json`; all glossary tables have 5 columns; the QA row
sets were checked against M09 §1, `01_MODULE_PLAN.md` and
`competition_compliance.md`. No result cells were filled and no number was
invented.

**Open items for the lead:** decide the 10 glossary inconsistencies (retake
wording, not-sure title, BN/EN field parity, Leaf Smut name, the two placeholder
BAMIS quotes, etc.). The QA and hallway files still need the user's real
on-device and 5-person test results.

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
| O6 — QA templates | ✅ done | `documentation/qa/qa_checklist_v1.md`, `documentation/qa/hallway_test_v1.md` |
| O7 — Bangla/English glossary | ✅ done | `documentation/glossary_bn_en.md` |
| O8 — metrics schema + checker | ✅ done | `model/metrics.schema.json`, `ml/tools/check_metrics_schema.py`, `ml/tests/test_metrics_schema.py` |
| O9 — release bundle tool | ✅ done | `ml/tools/make_release_bundle.py`, `ml/tests/test_release_bundle.py` |
| O10 — real demo samples | ✅ done | `ml/tools/pick_samples.py`, `ml/tests/test_pick_samples.py` |
| O11 — tonight's run sheet | ✅ done | `ml/TONIGHT.md` |

## Track 3 — release tooling (O8–O11)

**Status:** done — 2026-11-01 ~08:46 BST

**Files added**
- `model/metrics.schema.json` — draft 2020-12 schema for `metrics-v1.json`:
  `model`, `calibration` (+ optional `warning`), `internal_test` (+ `per_class`),
  `external[]` with all ten measured fields, `limitations`. Metric fields are
  `number|null` in 0..1; counts are non-negative integers.
- `ml/tools/check_metrics_schema.py` — stdlib-only subset validator (`type`,
  `required`, `properties`, `additionalProperties`, `items`, `enum`, numeric
  bounds, `anyOf`, local `$ref`); prints every error and exits 1. `jsonschema`
  is not required.
- `ml/tools/make_release_bundle.py` — `--run-zip` (zip or folder), `--repo`,
  `--dry-run`; safe extraction, nested `run1/` detection, all O9 checks, all-or-
  nothing copy to `frontend/public/models/rice-mnv3l-v1.onnx`,
  `frontend/public/data/{class_index,preprocess,calibration,metrics-v1,parity_samples}.json`,
  `frontend/public/accuracy/*.png`, and `model/experiments/run1/`. It prints
  sizes, the `MEASURED (from metrics-v1.json)` summary and the M07 config change.
- `ml/tools/pick_samples.py` — deterministic test-split picking, 480 px long
  side at JPEG q85, `frontend/public/samples/<key>_<n>.jpg`, `manifest.json`
  (`id`, `labelBn`, `labelEn`, `src`, `credit`), refuses a data root inside the
  repo.
- `ml/tests/test_metrics_schema.py`, `ml/tests/test_release_bundle.py`,
  `ml/tests/test_pick_samples.py`, `ml/TONIGHT.md`.

**How tested**
```bash
python ml/tests/test_metrics_schema.py
python ml/tests/test_release_bundle.py
python ml/tests/test_pick_samples.py
python -m py_compile ml/tools/check_metrics_schema.py ml/tools/make_release_bundle.py ml/tools/pick_samples.py
```
Schema test: valid evaluate.py-shaped document, null external metrics, and 11
broken copies (missing blocks, out-of-range, wrong types, null counts).
Bundle test: synthetic run with a tiny valid ONNX (`0x08` first byte),
`FIXTURE_NOT_REAL` metrics, JSON/PNGs; checks copies, dry-run, zip with
`run1/` prefix, bad class order and missing parity (exit 1, nothing copied).
Samples test: toy dataset + splits → 4 deterministic images at 480 px, exact
labels/credit, repeated run identical, source unchanged, unsafe paths refused.

**Notes / problems**
- No real Kaggle run exists here, so the tools were not run against real
  artefacts and no number was invented; `metrics-v1.json` stays
  `[[TBD after training]]`.
- `handoff/X_BACKLOG.md` (referenced for the shared contract) is missing from
  this worktree; the exact destination paths in `OPENCODE_TRACK_3.md` were used.
- `onnx` inspection is optional: without it the checker still does the size,
  first-byte and `.data` checks.
- The tools copy into `frontend/public/**` by design (O9/O10), but this branch
  did not edit `frontend/src/ml/config.js` or delete the placeholder model.

## O6 — QA templates (release module M09)

**Status:** done — 2026-11-01 ~08:10 BST

**Files added**
- `documentation/qa/qa_checklist_v1.md` — blank QA template with a test-session
  header for two devices (device name, Android version, browser + version,
  network type, date). Section A has the 11 M09 §1 checks for Device 1 and the
  same 11 for Device 2; section B has release blockers 1–8 from
  `handoff/01_MODULE_PLAN.md`; section C has the 7 sticker rules from
  `documentation/competition_compliance.md`. Columns are ID · Check · Device ·
  Result (✅/❌) · Notes. A sign-off block records the ❌ counts.
- `documentation/qa/hallway_test_v1.md` — consent in Bangla and English (no
  personal data; first names or initials only), the 5 tasks read aloud in simple
  Bangla with English beside them, a results table for P1–P5 (completed without
  help on T1–T5, wrong taps, time to first result, thought it was a confirmed
  result, audio understood, short quote), the four pass criteria from
  `handoff/OPENCODE_TRACK_2.md`, and a "Fixes made after the test" table.

**How tested**
- Checked the row text against M09 §1 (11 bullets), the 8 blockers and the 7
  sticker bullets; no row omitted.
- Checked that no result cell, pass/fail mark or participant row was pre-filled.
- Markdown tables checked for a consistent 5-column shape.

**Notes / problems**
- The QA checklist duplicates the device checks for the second device because
  M09 requires both a low-end Android phone and a second device. If the lead
  prefers one row per check with two result columns, the D-12…D-22 block can be
  folded into D-01…D-11.
- The hallway tasks point to the not-sure screen without naming it in the
  spoken instruction; the facilitator hands over a blurry/non-rice photo first.
- `research_files/Agro_AI_Deep_Research_Result.md` §13 is not in this repo, so
  the task wording was written from `handoff/M09_release.md` §2 and the brief.

## O7 — Bangla/English glossary

**Status:** done — 2026-11-01 ~08:15 BST

**File added**
- `documentation/glossary_bn_en.md` — five-column table (Key · Bangla ·
  English · Where used · Notes) covering:
  - §1: all 7 class/disease names;
  - §2: every `_meta` key and every per-class field in both JSONs, including the
    `official_guidance` sub-keys;
  - §3: the 9 fixed UI terms from `documentation/frontend_spec.md` and the
    `handoff/M0*.md` files;
  - §4: 10 inconsistencies for the lead to review.

**How tested**
- Python check loaded `disease_information_bn.json` and asserted that every
  `name_bn`, `_meta.disclaimer_bn` and `_meta.helpline` appears verbatim in the
  glossary, and that all 9 fixed UI terms are present.
- All tables are 5 columns; no Bangla spelling was re-typed from memory.
- No fix was applied to the JSON; the inconsistencies are listed, not changed.

**Notes / problems**
- Real inconsistencies found (not fixed): three retake wordings, the not-sure
  class name vs card title, the "রোগ" suffix difference with
  `data/disease_classes.md`, the unconfirmed Leaf Smut Bangla name, the
  `frontend_spec.md` "বেশ নিশ্চিত" wording vs M05's high/moderate confidence,
  BN/EN field parity, the bracketed BAMIS placeholders in `tungro` and
  `sheath_blight`, the shared BAMIS URL, the two written forms of the helpline,
  and the different BN/EN `_meta.status` text.
- `model/class_index.json` (referenced by `_meta.keys_must_match`) is not in the
  repo yet because the model has not been trained; recorded in the glossary.

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
