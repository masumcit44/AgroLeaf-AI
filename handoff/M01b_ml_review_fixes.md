# M01b — Fixes from the lead's review of M01 (do this before M02)

**Why:** M01 passed its smoke test. The lead's code review (1 Nov) found issues that would make the **published accuracy numbers wrong or misleading**, or could silently break the real Kaggle run. The toy dataset can't reveal them. Small, targeted fixes only. **No refactors.**
**Branch:** `fix/m01b-ml-review` · **Tag:** `m01b` · **User gate:** none.

## 0. Clean the working tree first
After the M01 commit, 13 files in `ml/` showed as modified. The **only** change was an extra blank line at the end of each file, added by the editor about 45 s after the commit. Run `git diff --stat`.
- If every change is a trailing blank line, run `git restore ml/` before starting.
- Before **and** after this module's final push, wait 60 s, run `git status` again, and restore any trailing-newline-only changes.

## 1. `ml/evaluate.py` — external metrics (most important)
1. **Macro-F1 on external sets must only use the classes that set actually contains.**
   - Right now `f1_score(t_labels, p_classes, average="macro")` also counts classes the model predicted but the set doesn't have (e.g. `leaf_smut`). Each of those adds an F1 of 0, which unfairly drags the score down.
   - Use `labels=sorted(set(t_labels))`.
   - Also compute **mapped-class accuracy** (`accuracy_mapped`).
2. **Per-class external results:** fill `per_class` with `{precision, recall, support}` for each mapped class (using the same `labels=` list).
3. **No fake zeros.** If a set has 0 mapped images, write `null` (Python `None`) for its metrics, not `0.0`. The same applies to `unseen_rejection_rate` when there are no unseen images. The app shows "—" for null.
4. **Never ignore folders silently.**
   - Collect every first-level folder name found under the external root.
   - If any is **not** a key in the map file (ignoring keys that start with `__`), stop with an error that lists the found folders and the map keys. Do this before running the model.
   - If 0 images get mapped, also stop with an error.
   - (Some Mendeley sets have an extra parent folder, or use a CSV instead of folders. The user must then point `--external` at the folder that directly contains the class folders.)
5. **Windows-safe spec parsing:** parse `name=root:mapfile` with `path_part.rsplit(":", 1)`, not `split(":", 1)`. `D:\...` contains a colon.
6. **DOI:** let each map file carry an optional `"__doi__"` key. Copy it into the result's `"doi"` field. Add the DOIs to the two map files:
   - `riceleafdisease_bd5.json` → `"__doi__": "10.17632/sjkptpgv79.2"`
   - `riceleafbd_sylhet.json` → `"__doi__": "10.17632/kx9rx8p2mz.1"`
7. **Calibration warning:** if `calibration.json` has a `warning`, copy it into `metrics-v1.json` → `calibration.warning`, and add it to `limitations`.
8. Accept `.webp` and `.bmp` images on external sets too.

## 2. `ml/make_splits.py` — protect against a giant near-duplicate group
**The risk:** the audit links photos whose perceptual hashes are within distance 6, and **chains** them (union-find). On field photos of green leaves, chains can grow into one huge group. Then:
- a group spanning classes gets *entirely excluded*, which could silently drop thousands of images; or
- one group dominates a fold.

**Fixes:**
1. Compute group-size statistics: number of groups, largest group, groups > 10 images. Write them in `split_summary.md`.
2. **Stop with a clear error** if:
   - any group has **> 50 images**, **or**
   - exclusions are **> 5 %** of all images.

   The message should tell the user to re-run the audit with a lower `--phash-dist` (try 4, then 2), and to keep a note of the value used.
3. Add `--max-group 50` and `--max-exclusion-frac 0.05` flags, with those defaults.
4. In `split_summary.md`, also print the exclusion counts **by reason**.

## 3. `ml/export_onnx.py` — use the stable exporter, single file
- Call `torch.onnx.export(..., dynamo=False)` **first**: the TorchScript exporter is stable and writes everything into one file. Use the dynamo exporter only as a fallback, and then pass `external_data=False`.
- After export:
  - **fail** if any initializer has `data_location == EXTERNAL`, or if any `*.data` file appears next to `model.onnx`. The browser must load one single file.
  - print the opset and the list of operator types.
- Reason (put it in the commit body): newer PyTorch versions on Kaggle may default to the dynamo exporter, which can save weights to a separate `.data` file. That would break `fetch('/models/rice-mnv3l-v1.onnx')`.

## 4. `ml/train.py` + runbook — speed on Kaggle
1. Default `--num-workers 4`. Use `--num-workers 4` in `KAGGLE_RUNBOOK.md` too; Kaggle notebooks have 4 CPU cores.
2. Print and log seconds per epoch (add an `epoch_seconds` column to `history.csv`).
3. Runbook: add a "Check before training" step:
   - open `data/split_summary.md`
   - confirm exclusions < 5 % and the largest group ≤ 50
   - confirm every class has ≥ 50 training images (a class with fewer won't train well; tell the lead)

## 5. Tests
Re-run the full M01 smoke test. Add these small checks to `ml/tests/` (plain Python asserts, no pytest needed):
- `test_external_f1.py`: fake labels/preds where the model predicts an absent class → macro-F1 is computed over the present classes only.
- `test_spec_parse.py`: `"Name=D:\\a\\b:ml\\map.json"` parses correctly.
- `test_null_metrics.py`: an external set with 0 unseen images → `unseen_rejection_rate` is `None`.

## Acceptance checks
- [ ] Smoke test passes. New tests pass (`python ml/tests/test_*.py`).
- [ ] A toy external folder with an unknown subfolder name → a clear error listing the names.
- [ ] The exported toy ONNX is one file; the opset and op list are printed.
- [ ] `git status` is clean 60 s after the final push.
- [ ] Commits (examples):
  - `fix(eval): compute external macro-F1 over mapped classes only`
  - `fix(eval): report null instead of zero and fail on unmapped folders`
  - `fix(data): guard against oversized perceptual-hash groups`
  - `fix(export): prefer TorchScript exporter and forbid external data`
  - `perf(train): use 4 data-loader workers and log epoch time`
  - `test(ml): add evaluation and parsing regression checks`
