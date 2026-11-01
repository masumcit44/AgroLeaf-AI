# Final technical decisions (R9 cross-AI review)

**Date:** 1 Nov 2026 · **Inputs:** 5 files in `research_files/`
- `claud.txt` (Claude, R4–R6)
- `deepseek.txt` (DeepSeek, R4–R6)
- `Agro_AI_Deep_Research_Result.md` (consolidated R1–R9, likely ChatGPT)
- `Agro AI App Build Research.pdf` (Gemini, R1–R9)
- `AgroLeaf_AI_Final_Research_and_Implementation_Report.pdf` (synthesis + R8)

**Method:**
- Decisions are made by evidence and feasibility, not by votes.
- The decision-critical claims were re-checked by me on 1 Nov 2026 (table in §3).
- **Every tool chosen is free.**

---

## 1. Locked decisions
| Domain | Decision | Fallback | Switch trigger |
|---|---|---|---|
| Frontend | **React + Vite + Tailwind**, mobile-first, Bangla first | Plain HTML/JS | React setup blocks inference work by more than 3 h |
| PWA | **No** service worker in the MVP; rely on HTTP caching | Minimal SW for versioned assets | Only after the live build is stable |
| Inference | **In the browser, with `import * as ort from 'onnxruntime-web/wasm'`**, executionProviders `['wasm']` | Same ONNX on FastAPI (Cloud Run / HF Spaces) | Real Android phone crashes or takes more than about 5 s per prediction after warm-up |
| Backend | **None** | FastAPI `POST /predict` (documentation/backend_fallback_spec.md) | As above, or when accounts/history are added |
| Database | **None.** Versioned static JSON | Supabase | Accounts, history or feedback (future) |
| Model | **MobileNetV3-Large**, ImageNet-pretrained, fine-tuned, **ONNX float32** | **MobileNetV3-Small** (same recipe) | ONNX file > 24 MB, phone too slow, or Small gives equal macro-F1 |
| Quantisation | **None for the MVP** | Static INT8 (calibrated) | Only if measured faster in the browser **and** macro-F1 drops ≤ 0.5 pts |
| Input | 224×224 RGB, ImageNet normalisation; **one `preprocess.json` shared by Python and JS** | — | A mismatch is a release blocker |
| "Not sure" | Temperature scaling + **threshold chosen on validation** for a target precision (e.g. ≥ 90%). **Not a hard-coded 0.60** | Raw softmax threshold | Calibration code cannot be validated |
| OOD | Image-quality checks (decode, dark, blur) + threshold. **Energy score only if time allows**, and only after evaluating it on non-rice images | — | — |
| YOLO boxes | **Not used** in the MVP | Future: lesion crops / explanations | — |
| Voice | **Pre-generated MP3s, Azure `bn-BD-NabanitaNeural`**, made once, about 48–64 kbps mono; play on tap; transcript beside the player; label "AI-generated voice" | Human-recorded clips (free, fully safe licence-wise) | Native speakers find the pronunciation poor, or the licence is unclear |
| Hosting | **Cloudflare Pages** (free) | **Vercel Hobby** (free), deployed as a second copy | Deploy fails, or an asset is over 25 MiB |
| Monitoring | UptimeRobot free ping (optional) | — | — |

## 2. Where the AIs disagreed, and the ruling
| Topic | Claims | Ruling and why |
|---|---|---|
| INT8 quantisation | Gemini: `quantize_dynamic` → ~5 MB, "negligible" loss. DeepSeek: INT8 is ~4× slower in WASM, so always fp32 | **fp32, no quantisation.** The official ORT docs recommend **static** quantisation for CNNs and dynamic for RNN/transformers ([ORT quantization docs](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)), so Gemini's recipe goes against the docs. DeepSeek's "4× slower" comes from an unattributed blog (unverified). fp32 MobileNetV3-Large fits under 25 MiB anyway |
| Model size / variant | DeepSeek: Large, 20.9 MB. Claude: Small first. Final PDF: benchmark both | **Large primary, Small fallback.** TorchVision lists Large at 5.48M params with a 21.1 MB weights file. Measure the exported ONNX size (must be < 25 MiB) |
| Bounding boxes | DeepSeek: 74,836. Others: 21,460 | **21,460 (v3).** 74,836 is the old v2 figure. Use v3 only |
| Threshold | DeepSeek: ~0.60 | **Chosen on validation.** No universal value exists |
| Frontend | Gemini, ChatGPT, final PDF: React+Vite. My first plan: plain JS | **React+Vite.** The UI has many async states and you build with AI coding agents. Plain JS is the fallback |
| Cloudflare bandwidth | DeepSeek/Gemini: "unlimited" | **Don't claim it.** The official limits page lists no bandwidth figure. Irrelevant at demo scale |
| Netlify | Gemini: "300 credits ≈ 15 GB" | Not verified; not used |
| Bangla audio as an innovation | My earlier plan: a differentiator | **Not unique.** TBS reports Dr. Chashi can read out all instructions ([TBS](https://www.tbsnews.net/node/630290)); Rice Solution lists voice-from-text. Build it for accessibility, not as a uniqueness claim |
| "Not sure" as an innovation | My earlier plan: a differentiator | **Partly exists.** Rice Solution rejects non-paddy photos (team files). Our angle: **calibrated abstention + top-2 + published external-district metrics** |
| 16123 | Several: "free helpline" | **Don't say free.** The final PDF found conflicting charge/hours info. Use `tel:16123`, "charges may apply" |

## 3. Claim verification (checked by me, 1 Nov 2026)
| Claim | Status | Evidence |
|---|---|---|
| RiceLeafDiseaseBD v3: 9,769 imgs, 1024², 6 classes, 21,460 boxes, CC BY 4.0, 1 Sep 2026 | ✅ Verified | [Mendeley v3](https://data.mendeley.com/datasets/86s4jzj2m4/3) |
| Download ≈ 5.25 GB | Reported (consolidated MD) | Not checked; plan for it |
| Azure TTS lists **bn-BD-NabanitaNeural (F) / bn-BD-PradeepNeural (M)** | ✅ Verified on the official page | [Azure language support (TTS)](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts) |
| Azure F0: 0.5 M neural TTS characters free/month | ✅ Verified on the official pricing page | [Azure Speech pricing](https://azure.microsoft.com/en-gb/pricing/details/speech/) |
| Free-tier Azure audio may be redistributed in an app | ⚠️ **Unverified** (Q&A answers only) | Mitigate: label it as AI voice; human recording is the zero-risk fallback |
| Cloudflare Pages: 25 MiB max per asset, 20,000 files and 500 builds/month on Free | ✅ Verified (page updated 5 Sep 2026) | [CF Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| **Default `onnxruntime-web` import loads `ort-wasm-simd-threaded.jsep.wasm` = 29.5 MB (> 25 MiB)** | ✅ **Measured by me** (npm onnxruntime-web 1.31.1) | **Use `onnxruntime-web/wasm`**, which loads `ort-wasm-simd-threaded.wasm` = **14.8 MB** |
| Vercel Hobby: 100 MB static uploads; non-commercial | Reported with official links (consolidated MD) | Fine for a student buildathon |
| ORT dynamic quantisation is suited to CNNs | ❌ Contradicted | Official docs: static for CNNs |
| MobileNetV3 38 ms warm WASM on Snapdragon 778G | ⚠️ Unverified (unattributed blog) | **Measure on your phone** |
| "Neuro-symbolic rice" ECE 1.65→1.35; "leakage-guarded" 0.997 at 60% coverage (2026 papers) | ⚠️ Not checked; no DOIs given | Don't cite |
| Rahman et al. 2020, 93.3% two-stage CNN | Reported with DOI 10.1016/j.biosystemseng.2020.03.020 | OK as context only; not our expected score |
| Dr. Chashi: Bangla read-aloud, 92% accuracy (self-reported), offline (third-party listing) | Press/listing reports | [TBS](https://www.tbsnews.net/node/630290), [AppBrain](https://www.appbrain.com/app/dr-chashi/com.medinatech.drchashi) |
| WASM memory ≈ 4× model size (Gemini) | ⚠️ Unverified | Measure memory on the phone |

## 4. Release blockers (build must not ship until each is ✅)
1. `onnxruntime-web/wasm` import is used and the `.wasm` file is served correctly (not rewritten to index.html).
2. The exported ONNX is < 25 MiB.
3. PyTorch vs ONNX vs browser outputs match on the same images.
4. Class order is identical in the model, `class_index.json` and the disease JSON.
5. The threshold comes from validation data.
6. It works on a real low-end Android phone (fresh load and cached load).
7. No pesticide dose appears unless it is quoted verbatim from BAMIS with a link.
8. The sticker is visible in the navbar.

## 5. Notes on the threaded WASM file
- `ort-wasm-simd-threaded.wasm` uses multiple threads only when the page is cross-origin isolated (COOP/COEP headers).
- Without those headers ORT runs single-threaded, which is fine for MobileNetV3.
- **Do not add COOP/COEP** unless you measure a real gain. They can break loading of Google Fonts and other third-party assets.
- Set `ort.env.wasm.numThreads = 1` explicitly so behaviour is predictable.
