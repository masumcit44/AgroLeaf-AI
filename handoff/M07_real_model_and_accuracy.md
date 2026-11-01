# M07 — Real model integration + "How accurate is it?" page

**Goal:** swap the placeholder for the trained model, prove the browser matches Python, and publish the measured results honestly.
**Branch:** `feat/m07-real-model` · **Tag:** `m07`
**User gate:** the Kaggle run folder (`run1/`) is downloaded to `D:\Desktop\AIgnite 2026\kaggle_runs\run1\`. Until then, mark this module ⛔ and continue with M08.

## Steps
1. **Check the run folder** contains: `model.onnx`, `class_index.json`, `preprocess.json`, `calibration.json`, `metrics-v1.json`, `parity_samples.json`, `samples/`, and the PNGs. If anything is missing, stop and report.
2. **Check the contracts:**
   - `class_index.json` classes == `["healthy","blast","brown_spot","leaf_smut","tungro","sheath_blight"]` (exact order)
   - `preprocess.json` == the M01 values
   - `calibration.json` has no `placeholder` and has a `threshold` from validation
   - `model.onnx` < 24 MiB
3. **Copy into the app** (versioned names):
   - `model.onnx` → `frontend/public/models/rice-mnv3l-v1.onnx`
   - the JSONs → `frontend/public/data/` (`metrics-v1.json` as is)
   - `samples/*` → `frontend/public/samples/` (CC BY dataset images; credit them on About)

   Delete `rice-placeholder.onnx` in the same commit. Update `src/ml/config.js` only.
4. **Copy the evidence into the repo docs:**
   - `metrics-v1.json` + PNGs → `model/experiments/run1/`
   - fill in `model/experiments/YYYY-MM-DD_mnv3_large.md` from the template, with the **real** numbers
   - fill in the `[TODO]` cells of `data/data_quality_report.md` from the audit output the user ran
5. **Browser parity page** (dev only; hash `#/dev/parity`, excluded from the production menu):
   - loads `parity_samples.json` + sample images
   - **Check A (runtime):** feed the stored preprocessed tensor values into the session → probabilities must match the Python values within **1e-3**
   - **Check B (end to end):** run the normal pipeline on the sample images → top-1 must match the Python top-1 on all 5. Small probability differences are expected from canvas vs PIL resizing; report the max difference.
   - Record both results in PROGRESS.md and in the PR. **If check A fails, it is a release blocker. Stop.**
6. **AccuracyPage.jsx**, rendered **only from `metrics-v1.json`** (no hard-coded numbers):
   - Plain-language summary in Bangla first, e.g. "অন্য জেলার ছবিতে পরীক্ষা: … টির মধ্যে মডেল উত্তর দিয়েছে … % ক্ষেত্রে; যেগুলোতে উত্তর দিয়েছে তার … % সঠিক" ("Tested on photos from other districts: the model answered …% of the time; of those answers, …% were correct"). Numbers are formatted from the JSON.
   - Tables:
     - internal test (n, macro-F1, coverage, selective accuracy)
     - per-class precision/recall
     - each external set (classes tested, n, mapped macro-F1, coverage, unseen-class rejection rate)
   - The confusion-matrix image from `model/experiments/run1/` (copy the PNG into `public/`).
   - "সীমাবদ্ধতা / Limitations" list from `metrics.limitations`, **plus** always:
     - "এটি প্রাথমিক ধারণা দেয়, চূড়ান্ত রোগ নির্ণয় নয়" ("This gives a preliminary idea, not a final diagnosis")
     - "লিফ স্মাট রোগের জন্য বাইরের কোনো পরীক্ষা ডেটা নেই" ("There is no external test data for Leaf Smut")
   - Model facts: architecture, ONNX size (from the JSON), runs on the phone, dataset credit with DOI.
   - **If any metric is null or missing, show "—", never 0.**
7. **Weak-class policy:** if a class's external recall < 0.6 (or it has no external data and its internal recall < 0.8), add its key to `calibration.json` → `"suppress":["leaf_smut"]`. `decide()` then returns `not_sure` for those classes, with the class in top-2 as "possible". Add a unit test. Mention it on the Accuracy page.
8. Remove the "Demo model" banner logic only if `placeholder` is absent.

## Acceptance checks
- [ ] Parity check A passes (max diff < 1e-3). Check B top-1 matches 5/5.
- [ ] The real model loads on the deployed Cloudflare URL. The postbuild size check passes.
- [ ] The Accuracy page shows real numbers that match `metrics-v1.json` exactly. Spot-check 3 values.
- [ ] A non-rice photo (e.g. a hand, a mango leaf) → most often "not sure". Record the result of 10 tries honestly in PROGRESS.md.
- [ ] Commits (examples):
  - `feat(model): integrate trained MobileNetV3-Large v1`
  - `test(parity): add browser vs Python parity check page`
  - `feat(accuracy): render measured internal and external results`
  - `feat(safety): suppress weak classes into not-sure`
  - `docs(model): log run1 metrics and data audit results`
