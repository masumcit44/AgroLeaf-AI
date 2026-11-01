# M07 Rehearsal Notes (Toy Run Validation)

**Date / Time:** 01 Nov 2026, 09:30 BST  
**Execution Context:** Module Y1 on temporary branch `rehearsal/m07-toy` (never pushed, deleted after test).

## 1. Summary of What Worked
- **Release Bundling Tool (`make_release_bundle.py`):**
  - Successfully extracted the zip archive, validated the single-file opset 17 ONNX model (`model.onnx`, 6.1 MB, 10 operator types), and verified exact class order against `common.py`.
  - Audited `metrics-v1.json` against `model/metrics.schema.json` with 0 schema violations.
  - Copied 11 artifacts cleanly into `frontend/public/` (`models/rice-mnv3l-v1.onnx`, `data/class_index.json`, `data/preprocess.json`, `data/calibration.json`, `data/metrics-v1.json`, `data/parity_samples.json`, `accuracy/confusion_internal.png`, `accuracy/reliability_val.png`) and archived evidence in `model/experiments/run1/`.
- **Config & Model Switch (M07 Steps 2–3):**
  - Updated `frontend/src/ml/config.js` `MODEL_URL` to point to `/models/rice-mnv3l-v1.onnx`.
  - Removed `frontend/public/models/rice-placeholder.onnx`.
- **Build & Cloudflare Size Verification:**
  - `npm run build` ran successfully.
  - `check-dist-sizes.mjs` confirmed `rice-mnv3l-v1.onnx` is 5.82 MiB (well below Cloudflare's 25 MiB ceiling) and verified zero fixture leakage.
- **Unit & Component Testing (`npm test`):**
  - Vitest: 44/44 tests passed across 11 test suites.
- **Automated Smoke Test (`npm run smoke`):**
  - Puppeteer passed all 10 routes at 360px, 390px, and 1280px viewports with zero horizontal overflow, 0 console errors, clean copy without forbidden phrases, and competition sticker $\ge 40$ px.
- **Release Guards Audit (`npm run check:release`):**
  - 6 of 8 production guards passed:
    - ✓ 1. Calibration JSON (no placeholder flag)
    - ✓ 2. Production Model File (`rice-mnv3l-v1.onnx` present, < 24 MiB, starts with byte `0x08`)
    - ✓ 3. Model URL Configuration (`config.js` points to `rice-mnv3l-v1.onnx`, placeholder deleted)
    - ✓ 4. Class Index (exact 6 target classes)
    - ✓ 5. Validation Metrics (real data present)
    - ✓ 8. Competition Sticker (present in both `assets/brand/` and `public/brand/`)
  - 1 Warning: 7. Voice Audio Manifest (missing: gracefully warns that audio is pending user's Azure Speech key).
  - 1 Expected Failure: 6. Sample Images Manifest (missing: pending `pick_samples.py`).

## 2. Issues / Fixes Required
- **App Code:** No bugs found. All pages rendered cleanly with the bundled toy metrics and model.
- **OpenCode Tooling:**
  - `make_release_bundle.py` performed flawlessly in both `--dry-run` and actual copy modes.
  - The reminder message printed by `make_release_bundle.py` accurately guides the developer through the manual steps for `config.js` and deleting `rice-placeholder.onnx`.

## 3. Conclusion
The M07 deployment pipeline is fully validated and ready. As soon as `D:\Desktop\AIgnite 2026\kaggle_runs\run1\run1_for_app.zip` arrives, executing `make_release_bundle.py` followed by switching `config.js` will complete M07 smoothly without blockers.
