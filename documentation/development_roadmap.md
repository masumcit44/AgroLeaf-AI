# Development roadmap to 5 Nov 2026 (locked stack; see `research/final_decisions.md`)

The order follows the step plan: research → dataset audit → preparation → model choice → training → integration → frontend → Bangla voice → testing.

**Rule:** at the end of every day, the live URL must still work.

## 1 Nov (evening) — start the long jobs
- [x] Research collected and reviewed; stack locked.
- [ ] **Start the RiceLeafDiseaseBD v3 download now** (about 5.25 GB, reported). Keep the zip untouched.
- [ ] Create a free Azure account (Speech, F0 tier). Generate **one** test MP3 with `bn-BD-NabanitaNeural`; have 2 people listen to it.

## 2 Nov — data + training + skeleton
- [ ] `ml/audit_dataset.py` → per-class counts, duplicates, groups; fill in `data/data_quality_report.md`.
- [ ] Group-aware 70/15/15 split → `data/splits.csv`.
- [ ] Kaggle/Colab: train **MobileNetV3-Large** (`model/training_plan.md`). Log the run in `model/experiments/`.
- [ ] Antigravity: React+Vite+Tailwind skeleton with the sticker, upload + preview → deploy to **Cloudflare Pages** (P1, P2).
- **Gate:** class counts known · baseline macro-F1 known · live URL works.

## 3 Nov — model into the app
- [ ] Temperature scaling + threshold from validation; external test on Savar and Sylhet/Dhaka (mapped classes only).
- [ ] Export the fp32 ONNX (< 25 MiB). Run the PyTorch vs onnxruntime vs browser parity check.
- [ ] Integrate `onnxruntime-web/wasm` (P3), the not-sure screen (P4), the result card (P5), 7 MP3s (P6).
- [ ] Test on a real low-end Android phone. Switch to MobileNetV3-Small if it is too slow or too big.

## 4 Nov — product polish
- [ ] Accuracy page with real numbers (P7); loading, error and onboarding states (P8).
- [ ] Secondary: quality hint, sample images, share, BAMIS quote (S1–S4).
- [ ] 5-person hallway test (`research_files/Agro_AI_Deep_Research_Result.md` §13); fix confusion.
- [ ] Deploy the second copy on Vercel. Build the 5-slide deck.

## 5 Nov — freeze
- [ ] Bug fixes only. Record the English demo video (2 min).
- [ ] Run through the release-blocker list (`research/final_decisions.md` §4).
- [ ] **Submit on Devpost by 6 PM.**

## Fallbacks
| Problem | Fallback |
|---|---|
| Dataset download too slow | Train on RiceLeafDisease-BD5 (2,545 images, 5 classes) |
| ONNX > 25 MiB or the phone is slow | MobileNetV3-Small |
| Browser inference fails on phones | FastAPI on Cloud Run / HF Spaces (`documentation/backend_fallback_spec.md`) |
| A class is weak (e.g. Leaf Smut) | Never show it as a confident answer; send it to "not sure"; say so on the Accuracy page |
| Azure voice sounds wrong, or licence doubt | Record the 7 clips yourself |
| Cloudflare deploy breaks | Vercel copy |
