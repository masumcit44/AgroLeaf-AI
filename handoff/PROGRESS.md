# PROGRESS — updated by Antigravity after every module

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
| M07 | Real model + accuracy page | ⬜ | | | |
| M08 | Polish | ⬜ | | | |
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
_(none yet)_

## Proposals (not implemented)
_(none yet)_
