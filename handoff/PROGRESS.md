# PROGRESS — updated by Antigravity after every module

## Autonomous run report 01 Nov 2026
- **Modules completed in this run:** `m02`, `m03`, `m04`, `m05`, `m06`, `m08-partial`
- **What was built:**
  - **M02:** React 19 + Tailwind v4 + Vite mobile frontend scaffold, official competition sticker in sticky navbar (44-52px), persisted Bangla/English i18n switcher, Cloudflare Pages immutable caching headers, and asset size limit enforcement script.
  - **M03:** Leaf image upload pipeline with dual camera/gallery file picker, pure validation rules (max 10MB, JPG/PNG/WebP), client-side EXIF orientation correction and max 1024px canvas downscaling, pure luminance and 3x3 Laplacian blur quality heuristics, and non-blocking advisory warnings on preview screen.
  - **M04:** On-device WebAssembly ML inference engine using `onnxruntime-web/wasm` (strict CPU WASM, strictly preventing the 29.5 MB JSEP build to observe Cloudflare 25 MiB ceiling), ImageNet channel-first normalization, temperature-calibrated softmax, placeholder MobileNetV3-small ONNX model (`1x3x224x224` -> `1x6`), and background idle model prefetching.
  - **M05:** Farmer-friendly result and "not sure" screens. Synchronized build-time validation against `disease_information_bn.json` / `_en.json`, qualitative confidence wording ("উচ্চ আস্থা" / "মাঝারি আস্থা", no percentages), collapsible verbatim BAMIS/DAE official advice (hidden if unverified placeholder brackets exist), direct click-to-call `tel:16123` helpline button, and automated Chrome headless screenshot capture of all 7 states in `documentation/screenshots/m05/`.
  - **M06:** Zero-dependency offline Bangla TTS batch generator (`ml/tools/generate_tts.py`) for Azure Speech F0 (`bn-BD-NabanitaNeural`) with safety character quota audit (<20k chars) and `--dry-run`, plus tap-to-play `AudioExplain.jsx` component with single-active playback, `preload="none"`, and silent fallback degradation when MP3 files are pending.
  - **M08 (Partial):** Dismissible 3-step farmer onboarding strip persisted in `localStorage`, friendly Bangla `ErrorBoundary` without raw stack traces, offline network check before cold model download, 4 sample leaf images with CC BY 4.0 attribution, native Web Share API with clipboard copy fallback, tuned agricultural lighting/blur thresholds (`DARK_MAX=40`, `BLUR_MIN=50`), comprehensive About transparency page (privacy, BAMIS links, dataset DOIs, AI voice note), 1200x630 social OG image and meta tags.
- **How tested:**
  - Vitest: 26 unit and validation tests passing (`100% pass`).
  - Oxlint: 0 warnings and 0 errors across 54 files.
  - Vite build: production client bundle succeeds, and `check-dist-sizes.mjs` verifies every asset is strictly below Cloudflare Pages 25 MiB limit (WASM is 14.16 MiB).
  - Headless Chrome: verified end-to-end rendering and captured screenshots for all 7 screening states.
- **What YOU must do next:**
  1. **Kaggle GPU Training (Unblocks M07):** Follow `ml/kaggle/KAGGLE_RUNBOOK.md` to train MobileNetV3 on the real RiceLeafDiseaseBD v3 dataset on Kaggle T4 GPU, run calibration, export the production ONNX model (`rice-model-v1.onnx`), and place the output files into `frontend/public/models/` and `frontend/public/data/`.
  2. **Azure Speech Key (Optional for M06 voice files):** If you wish to synthesize the offline audio files, create a free Azure Speech F0 resource, put credentials in `.env`, and run `python ml/tools/generate_tts.py`. (Audio player already functions and degrades gracefully without crashing).
  3. **Cloudflare Pages Connect (For deployment & remote Lighthouse):** Connect the GitHub repository `masumcit44/AgroLeaf-AI` to Cloudflare Pages with root directory `frontend`, build command `npm run build`, output directory `dist`, and environment variable `NODE_VERSION=22`.
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
- [DONE by Antigravity 08:12] merged track/opencode (track 1 + track 2: QA templates & glossary)
- [DONE by Antigravity 08:58] merged track/opencode track 3 (QA templates, glossary, release bundle tooling, sample picker)
- Quality thresholds are provisional; to be tuned in M07 on real dataset images.

## Proposals (not implemented)
_(none yet)_
