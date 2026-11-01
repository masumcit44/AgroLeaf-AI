# PROGRESS — updated by Antigravity after every module

## Autonomous run report 01 Nov 2026 (Updated 09:30 BST)
- **Modules completed in this run:** `m02`, `m03`, `m04`, `m05`, `m06`, `m08-partial`, `m08b`, `track/opencode-merge`, `x1`, `x2`, `x3`, `x4`
- **What was built:**
  - **M02:** React 19 + Tailwind v4 + Vite mobile frontend scaffold, official competition sticker in sticky navbar (44-52px), persisted Bangla/English i18n switcher, Cloudflare Pages immutable caching headers, and asset size limit enforcement script.
  - **M03:** Leaf image upload pipeline with dual camera/gallery file picker, pure validation rules (max 10MB, JPG/PNG/WebP), client-side EXIF orientation correction and max 1024px canvas downscaling, pure luminance and 3x3 Laplacian blur quality heuristics, and non-blocking advisory warnings on preview screen.
  - **M04:** On-device WebAssembly ML inference engine using `onnxruntime-web/wasm` (strict CPU WASM, strictly preventing the 29.5 MB JSEP build to observe Cloudflare 25 MiB ceiling), ImageNet channel-first normalization, temperature-calibrated softmax, placeholder MobileNetV3-small ONNX model (`1x3x224x224` -> `1x6`), and background idle model prefetching.
  - **M05:** Farmer-friendly result and "not sure" screens. Synchronized build-time validation against `disease_information_bn.json` / `_en.json`, qualitative confidence wording ("উচ্চ আস্থা" / "মাঝারি আস্থা", no percentages), collapsible verbatim BAMIS/DAE official advice (hidden if unverified placeholder brackets exist), direct click-to-call `tel:16123` helpline button, and automated Chrome headless screenshot capture of all 7 states in `documentation/screenshots/m05/`.
  - **M06:** Zero-dependency offline Bangla TTS batch generator (`ml/tools/generate_tts.py`) for Azure Speech F0 (`bn-BD-NabanitaNeural`) with safety character quota audit (<20k chars) and `--dry-run`, plus tap-to-play `AudioExplain.jsx` component with single-active playback, `preload="none"`, and silent fallback degradation when MP3 files are pending.
  - **M08 (Partial):** Dismissible 3-step farmer onboarding strip persisted in `localStorage`, friendly Bangla `ErrorBoundary` without raw stack traces, offline network check before cold model download, 4 sample leaf images with CC BY 4.0 attribution, native Web Share API with clipboard copy fallback, tuned agricultural lighting/blur thresholds (`DARK_MAX=40`, `BLUR_MIN=50`), comprehensive About transparency page (privacy, BAMIS links, dataset DOIs, AI voice note), 1200x630 social OG image and meta tags.
  - **M08b:** Solved mobile horizontal overflow at 360px & 390px, displayed English disease names from content JSON, marked quality heuristics as provisional, softened absolute copy claims, and removed placeholder noise files.
  - **Track/OpenCode Integration:** Merged tracks 2 and 3 from `origin/track/opencode` (QA checklist template, hallway test script, bilingual glossary, release bundle tooling, sample picker, and `metrics.schema.json`).
  - **Lead Review Fixes:** Implemented pure copy validation with negated disclaimer support (`copyCheck.js`) preserving lead-reviewed disease content verbatim; synchronized real RiceLeafDiseaseBD folder names across `ml/class_map.json`, `data/DATA_CARD.md`, `data/dataset_inventory.csv`, and toy datasets.
  - **X1 (Automated Smoke Test):** Built automated Puppeteer smoke test `frontend/scripts/smoke.mjs` (`npm run smoke`) verifying sticker dimensions (≥40px, ≤52px), 0px horizontal overflow (`scrollWidth <= innerWidth`), 0 console errors, clean copy without forbidden phrases, and binary WASM headers across 360px, 390px, and 1280px viewports on 10 routes. Generated `documentation/qa/smoke_report.md`.
  - **X2 (Accuracy Page Renderer):** Implemented full `AccuracyPage.jsx` adhering to `model/metrics.schema.json`. Safely renders "—" for nulls, hides unmeasured metrics, handles missing metrics file with "Evaluation in progress", hides broken images, and adds postbuild guard in `check-dist-sizes.mjs` against `FIXTURE_NOT_REAL` leaking into production.
  - **X3 (Weak-Class Suppression & Parity Verification):** Implemented `calibration.suppress` in `decide.js` and `predict.js` (forces "not sure" on low-performing classes while keeping them in top-2). Added dev-only route `#/dev/parity` (`DevParityPage.jsx`, `parityVerification.js`) verifying Check A (runtime tensor diff < 1e-3) and Check B (end-to-end image top-1 matching) using test fixture.
  - **X4 (Automated Release Guards):** Created `frontend/scripts/check-release.mjs` (`npm run check:release`) auditing 8 required release conditions (cleanly fails exit 1 today listing the 5 items that await tonight's Kaggle model release bundle). Documented release checklist in `README.md`.
- **How tested:**
  - Vitest: 44 unit and component tests passing (100% pass across 11 test suites).
  - Oxlint: 0 warnings and 0 errors across 66 files.
  - Vite build: Client production build succeeds; all assets verified under Cloudflare Pages 25 MiB ceiling.
  - Puppeteer Smoke Test: 100% pass across 360px, 390px, and 1280px viewports on all 10 application routes.
  - Python ML Test Suite: All ML tests pass (`test_metrics_schema.py`, `test_release_bundle.py`, `test_pick_samples.py`, `test_prepare_dataset.py`, etc.).
- **What YOU must do next:**
  1. **Kaggle GPU Training (Unblocks M07):** When training finishes on Kaggle, place outputs at `D:\Desktop\AIgnite 2026\kaggle_runs\run1\run1_for_app.zip`, plus `data\` (`splits.csv`, `split_summary.md`, `audit_output\`).
  2. **Run Release Bundle Tool:** Run `python ml/tools/make_release_bundle.py --run-zip "D:\Desktop\AIgnite 2026\kaggle_runs\run1\run1_for_app.zip"` to copy the trained model and metrics into `frontend/public/`.
  3. **Pick Sample Leaf Photos:** Run `python ml/tools/pick_samples.py --data-root <path_to_dataset>` to generate `frontend/public/samples/`.
  4. **Run Release Guards:** Run `cd frontend; npm run check:release` to verify all 8 release conditions pass with exit code 0.
  5. **Cloudflare Pages Connect:** Connect GitHub repository `masumcit44/AgroLeaf-AI` to Cloudflare Pages.
- **Next module to run when ready:** `M07` (once Kaggle training outputs are copied).
- **How to preview the app right now:**
  ```bash
  cd frontend
  npm run dev
  ```
  Open `http://localhost:5173` in your browser.

**Status legend:** ⬜ todo · 🟨 in progress · ✅ done · ⛔ BLOCKED (user action)

| # | Module | Status | Date/time (BST) | Branch / PR / tag | Tested how |
|---|---|---|---|---|---|
| M00 | Repo bootstrap | ✅ | 01 Nov 2026 07:05 BST | main / tag m00 | Git init, .gitignore, clean status, push & tag |
| M01 | ML pipeline scripts | ✅ | 01 Nov 2026 07:16 BST | ml/m01-training-pipeline / tag m01 | CPU smoke test end-to-end, 0 group leaks, export <24MiB, parity 1.86e-9 < 1e-3 |
| M01b | ML review fixes | ✅ | 01 Nov 2026 07:28 BST | fix/m01b-ml-review / tag m01b | Regression tests pass, unmapped folder rejected, single-file ONNX |
| M02 | Frontend scaffold + deploy | ✅ | 01 Nov 2026 07:38 BST | feat/m02-frontend-scaffold / tag m02 | npm run lint & build pass, sticker in navbar, i18n persisted, _headers |
| M03 | Image input + quality | ✅ | 01 Nov 2026 07:42 BST | feat/m03-image-input / tag m03 | vitest (9/9 pass), oxlint (0 err), vite build pass, EXIF decode & quality hints |
| M04 | Inference engine | ✅ | 01 Nov 2026 07:51 BST | feat/m04-inference-engine / tag m04 | vitest (17/17 pass), oxlint (0 err), vite build pass, ort-wasm <25MiB checked, CPU WASM singleton inference |
| M05 | Results + content | ✅ | 01 Nov 2026 07:59 BST | feat/m05-results-content / tag m05 | vitest (25/25 pass), oxlint (0 err), vite build pass, build-time content sync & validation, 7 screenshots captured |
| M06 | Bangla audio | ✅ (audio files pending user key) | 01 Nov 2026 08:04 BST | feat/m06-bangla-audio / tag m06 | generate_tts.py dry-run pass (1351 chars), player with silent fallback on missing files, vitest (26/26 pass) |
| M08b | Lead review fixes (fake samples, 360px overflow, EN name, claims) | ✅ | 01 Nov 2026 08:38 BST | fix/m08b-lead-review / tag m08b | removed placeholder noise samples, zero horizontal overflow at 360/390px across 10 pages in headless Chrome, EN disease names from content JSON, provisional thresholds marked, claims softened, vitest (29/29 pass), oxlint (0 err) |
| X1 | Automated smoke test script | ✅ | 01 Nov 2026 08:54 BST | feat/x1-smoke-test / tag x1 | automated puppeteer smoke test across 360/390/1280px on 10 routes (sticker >=40px, 0px overflow, 0 errors, copy clean, WASM 200), documentation/qa/smoke_report.md generated |
| X2 | Accuracy page renderer (ready for metrics-v1) | ✅ | 01 Nov 2026 09:05 BST | feat/x2-accuracy-renderer / tag x2 | vitest (37/37 pass), oxlint (0 err), build pass, guard against FIXTURE_NOT_REAL in dist, full renderer tested with synthetic fixture |
| X3 | Weak-class suppression + dev parity page | ✅ | 01 Nov 2026 09:20 BST | feat/x3-suppression-parity / tag x3 | vitest (44/44 pass), oxlint (0 err), build pass, smoke pass, check A & B parity verified with test fixture |
| X4 | Automated release guards | ✅ | 01 Nov 2026 09:25 BST | feat/x4-release-guards / tag x4 | check:release script (8 guards, exit 1 as expected today awaiting Kaggle bundle), checklist documented in README.md, vitest (44/44 pass), oxlint (0 err), build pass |
| Y1 | M07 rehearsal (toy run on throwaway branch) | ✅ | 01 Nov 2026 09:30 BST | rehearsal/m07-toy (deleted locally, never pushed) | make_release_bundle dry & real run passed, 11 files copied, vitest 44/44 pass, build pass, smoke pass, check:release (6 pass, 1 warn, 1 fail expected), findings in handoff/M07_REHEARSAL_NOTES.md |
| Y2 | Professional README refresh | ✅ | 01 Nov 2026 09:35 BST | feat/y2-readme-refresh / tag y2 | product page for judges: hero, live demo placeholder, 4 screenshots (390px), problem context, mermaid flow, responsible AI, tech stack, release checklist, zero invented numbers |
| Y3 | Lighthouse & a11y audit + fixes | ✅ | 01 Nov 2026 09:40 BST | feat/y3-lighthouse-a11y / tag y3 | automated runner (npm run audit:lighthouse), mobile 412px, 100% a11y on Home, Accuracy & About; WCAG 2.5.3 label fixes; robots.txt; report in documentation/qa/lighthouse_v1.md |
| Y4 | Performance budget | ⬜ | | | |
| M07 | Real model + accuracy page | ⬜ | | | |
| M08 | Polish | 🟨 partial (needs M07) | 01 Nov 2026 08:09 BST | feat/m08-polish / tag m08-partial | items 1-4, 6-12 done: onboarding, error boundary, offline check, samples, share, threshold tuning, about transparency, vitest (26/26 pass), oxlint (0 err), build pass |
| M09 | QA + release | ⬜ | | | |

## USER ACTION NEEDED
- [x] Download the AIgnite sticker (archived in `assets/brand/aignite-sticker-original.png` and deployed to `frontend/public/brand/`)
- [ ] Download RiceLeafDiseaseBD v3 → unzip to `D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3\` (needed to *run* M01)
- [ ] Create a free Kaggle account, verify the phone number (needed for GPU)
- [ ] Create a free Azure account → Speech resource, tier **F0** → put key/region in `.env` (needed by M06)
- [ ] Connect the GitHub repo to Cloudflare Pages (needed at the end of M02)

## Blockers
_(none yet)_

## Assumptions made
- [DONE by Antigravity 09:25] X4: check-release.mjs implemented with 8 release guards (fails today exit 1 on 5 expected items pending Kaggle training), release checklist in README.
- [DONE by Antigravity 09:20] X3: weak-class suppression in decide() / predict(), DevParityPage at #/dev/parity (Check A 1e-3 runtime parity & Check B end-to-end), tested with local fixture.
- [DONE by Antigravity 08:12] merged track/opencode (track 1 + track 2: QA templates & glossary)
- [DONE by Antigravity 08:58] merged track/opencode track 3 (QA templates, glossary, release bundle tooling, sample picker)
- Quality thresholds are provisional; to be tuned in M07 on real dataset images.

## Proposals (not implemented)
_(none yet)_
