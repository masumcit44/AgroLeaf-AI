# X-BACKLOG — extra preparation modules for Antigravity (autonomous, after M08b)

**Why:** M07 (real model) and M09 (release) can't start until the user brings the trained model back this evening. These modules prepare the app so that tonight's M07 is a **file swap**, and so that M09's checks are already automated.

- **No fake data in the product.** Fixtures live only in tests.
- **No new features** beyond the product spec.
- All rules in `00_READ_FIRST_ANTIGRAVITY.md` and `AUTONOMOUS_MODE.md` apply: branch per module, tag, PROGRESS.md row, stop at 15:30 BST.
- **Order:** X1 → X2 → X3 → X4. Read `handoff/_lead/REVIEW_NOTES.md` before each one.
- **Files you must NOT create** (OpenCode creates them in parallel): `ml/tools/make_release_bundle.py`, `ml/tools/pick_samples.py`, `model/metrics.schema.json`, `ml/tools/check_metrics_schema.py`.

## Shared contract with OpenCode's tools (do not change it)
The real model and its data files will arrive tonight with these exact paths:
- `frontend/public/models/rice-mnv3l-v1.onnx`
- `frontend/public/data/class_index.json`
- `frontend/public/data/preprocess.json`
- `frontend/public/data/calibration.json` (no `placeholder` key; may have `suppress: [keys]` and `warning`)
- `frontend/public/data/metrics-v1.json` (schema: `handoff/M01_ml_pipeline.md` + M01b additions: `accuracy_mapped`, nullable metrics, `doi`, `calibration.warning`)
- `frontend/public/data/parity_samples.json`
- `frontend/public/samples/manifest.json` + images
- `frontend/public/accuracy/confusion_internal.png`, `reliability_val.png`

---

## X1 — Automated smoke test: `frontend/scripts/smoke.mjs` (`npm run smoke`)
**Purpose:** the M09 checks, automated once instead of done by hand each time.
- Use the **Chrome/Edge already installed** on this PC through `puppeteer-core`, with `executablePath` found automatically. That's a dev dependency, and the only new package allowed.
- Start `vite preview` on a free port, or take a `--url` argument for the deployed site.
- For widths **360, 390 and 1280**, on the routes Home, Accuracy and About, plus the 7 result states via the dev-only `?force=` param (the dev server only; skip on `--url`):
  1. **Sticker:** `img[src*="aignite-sticker"]` exists, is visible, is inside `header`, and its bounding box is fully within the viewport, ≥ 40 px high.
  2. **No horizontal overflow:** `scrollWidth <= innerWidth`.
  3. **No console errors** (warnings allowed).
  4. **No forbidden text in the rendered page:** "diagnosis", "রোগ নির্ণয়", "100%", "free call".
  5. **Assets:** `/ort/ort-wasm-simd-threaded.wasm` returns `application/wasm` (or octet-stream), **not** text/html.
- Write `documentation/qa/smoke_report.md` with a table per check and the exit code. Exit 1 on any failure.
- Fix any real failures the smoke test finds, as separate `fix(...)` commits.

## X2 — Accuracy page renderer, ready for real data: `AccuracyPage.jsx`
**Purpose:** M07 step 6, built now against the schema, so that tonight only the data file arrives.
- Implement the full page as in `handoff/M07_real_model_and_accuracy.md` step 6. It reads `/data/metrics-v1.json`.
- **If the file is missing:**
  - show the current "মূল্যায়ন চলছে / Evaluation in progress" state
  - show the dataset credits and the limitations list
  - **no numbers at all**
- `null` values → "—". Never 0.
- Show the confusion-matrix and reliability images only if they load (`onError` hides them).
- **Tests (Vitest)** use a fixture file `src/pages/__tests__/fixtures/metrics-fixture.json`. Its values must be obviously synthetic: use `0.111`, `0.222`, etc., and add the field `"FIXTURE_NOT_REAL": true`.
  - Test that the page renders the numbers from the fixture.
  - Test that nulls render as "—".
  - Test that a missing file renders the in-progress state.
  - **The fixture must never be copied to `public/`.**
- Add a build-time guard in `check-dist-sizes.mjs`, or a new `check-release.mjs` in `postbuild`: **fail the build if `dist/data/metrics-v1.json` contains `FIXTURE_NOT_REAL`.**

## X3 — Weak-class suppression + browser parity page (M07 steps 5 and 7, prepared now)
- `decide()` honours `calibration.suppress` (an array of keys). A suppressed top-1 → `not_sure`, with that class kept in top-2 as "possible". Add unit tests. The current placeholder calibration has no `suppress`, so behaviour is unchanged today.
- Dev-only route `#/dev/parity`:
  - **excluded from the production menu**, and rendered only when `import.meta.env.DEV` is true or `?dev=1` is set
  - loads `/data/parity_samples.json`; if it is missing, shows "no parity samples"
  - **Check A:** feed the stored preprocessed values → compare with the expected probabilities (tolerance 1e-3)
  - **Check B:** run the full pipeline on the sample images → compare top-1
  - shows the max absolute difference and pass/fail
- Test it now with a parity file **you generate locally from the placeholder model**, using `ml/parity_test.py` logic on the placeholder ONNX. Keep that file **out of `public/`**; use a test fixture path instead.

## X4 — Release guards (M09 blockers, automated)
`frontend/scripts/check-release.mjs`, run with `npm run check:release`. Not in the normal build; M09 runs it. It fails (exit 1, listing every failure) unless **all** of these hold:
1. `public/data/calibration.json` has no `placeholder: true`.
2. `public/models/rice-mnv3l-v1.onnx` exists, is < 24 MiB, and starts with byte `0x08`.
3. `config.js` `MODEL_URL` points at it, and the placeholder model file is gone.
4. `class_index.json` classes equal `["healthy","blast","brown_spot","leaf_smut","tungro","sheath_blight"]`.
5. `metrics-v1.json` exists, has no `FIXTURE_NOT_REAL`, and `internal_test.n > 0`.
6. `samples/manifest.json` has ≥ 3 entries, and every listed file exists.
7. `audio/manifest.json` lists 7 files that exist; otherwise **warn only**: voice is pending the user's key.
8. The sticker files exist.

Document it in README "Release checklist". **It is expected to FAIL today.** Commit it with the failing report, showing which items still need tonight's model.

## Done
After X4, or at 15:30: write the autonomous report section in PROGRESS.md, and stop.
