# 01 — Module plan (build order, dependencies, timeline)

**Why this order:**
- The **trained model is the slowest item**: data audit, Kaggle upload and training. So the ML scripts (M01) are written **first**, and the user can start Kaggle while the app is built.
- The app is built against a **placeholder model** (M04), so frontend work never waits for training.
- The real model drops in at M07, with no code changes except the model files.

| # | Module | File | Depends on | User action gate | Target |
|---|---|---|---|---|---|
| M00 | Repo bootstrap + first push | `M00_repo_bootstrap.md` | — | Git sign-in on first push | 1 Nov night |
| M01 | ML pipeline scripts (audit → resize → split → train → calibrate → export → parity → eval) | `M01_ml_pipeline.md` | M00 | Dataset downloaded (to run, not to write) | 1–2 Nov |
| M02 | Frontend scaffold, layout, i18n, sticker, Cloudflare deploy | `M02_frontend_scaffold.md` | M00 | Sticker file; Cloudflare Pages connect | 2 Nov |
| M03 | Image input + quality checks | `M03_image_input.md` | M02 | — | 2 Nov |
| M04 | Inference engine (onnxruntime-web/wasm) + placeholder model + unit tests | `M04_inference_engine.md` | M03 | — | 2–3 Nov |
| M05 | Result + "not sure" screens, content sync, 16123, official guidance | `M05_results_and_content.md` | M04 | — | 3 Nov |
| M06 | Bangla audio: TTS generation script + player | `M06_bangla_audio.md` | M05 | Azure Speech key (free F0) | 3 Nov |
| M07 | Real model + calibration + "How accurate is it?" page | `M07_real_model_and_accuracy.md` | M04, M05, **trained Kaggle outputs** | Kaggle outputs copied into the repo | 3–4 Nov |
| M08 | Readiness polish (states, a11y, perf, headers, samples, share, privacy) | `M08_polish.md` | M05–M07 | — | 4 Nov |
| M09 | QA, Vercel fallback, release v1.0.0, submission assets | `M09_release.md` | all | Real-phone test; Vercel connect; Devpost submit | 4–5 Nov |

**Parallel tracks:**
- Track A (user + Kaggle): download dataset → run M01 scripts → train → export.
- Track B (Antigravity): M02 → M03 → M04 → M05 → M06.
- They meet at **M07**.

**Release blockers** (from `research/final_decisions.md` §4). All must be ✅ before M09 tags v1.0.0:
1. `onnxruntime-web/wasm` import; the `.wasm` file is served correctly.
2. ONNX file < 25 MiB.
3. PyTorch ≈ ONNX ≈ browser outputs (parity test passes).
4. Class order identical in the model, `class_index.json` and the disease JSON.
5. Threshold from validation data (in `calibration.json`).
6. Works on a real low-end Android phone (fresh load and cached load).
7. No dose shown unless quoted verbatim with a link; placeholders hidden.
8. Sticker visible in the navbar.
