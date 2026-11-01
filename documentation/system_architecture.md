# System architecture (MVP), locked 1 Nov 2026

Decisions and evidence: [../research/final_decisions.md](../research/final_decisions.md). **Everything is free.**

```
Farmer's Android browser
        │  HTTPS (static files only)
        ▼
Cloudflare Pages (free)   ── second copy on Vercel Hobby (fallback)
  ├─ React + Vite + Tailwind app (sticker in the navbar)
  ├─ /ort/ort-wasm-simd-threaded.wasm + .mjs   (from onnxruntime-web/wasm, 14.8 MB)
  ├─ /models/rice-mnv3l-v1.onnx                (fp32, must be < 25 MiB)
  ├─ /data/class_index-v1.json, preprocess-v1.json, calibration-v1.json
  ├─ /data/disease_info_bn-v1.json, disease_info_en-v1.json
  └─ /audio/<class>-v1.mp3  (7 files, Azure bn-BD-NabanitaNeural, pre-generated)
        │
        ▼  everything below runs in the phone's memory; the photo is never uploaded
 decode + EXIF-correct ─► quality check (too dark / blurry → advice)
 ─► resize 256 → center-crop 224 → ImageNet normalise (from preprocess.json)
 ─► ONNX inference (one session, created once) ─► logits / T (temperature)
 ─► top prob ≥ threshold ? result card : "not sure" card (top-2 shown as "possible")
 ─► Bangla/English text from JSON ─► ▶/⏸ MP3 (on tap only) ─► tel:16123
```

No backend, no database, no accounts, no analytics that could carry the photo.

## Components
| Component | Choice | Key details |
|---|---|---|
| Frontend | React + Vite + Tailwind | `vite build` → static `dist/`. Fonts: Noto Sans Bengali, fallback Hind Siliguri |
| Inference | `import * as ort from 'onnxruntime-web/wasm'` | `executionProviders: ['wasm']`, `ort.env.wasm.numThreads = 1`. Copy the `.wasm`/`.mjs` from `node_modules/onnxruntime-web/dist/` to `public/ort/` and set `ort.env.wasm.wasmPaths = '/ort/'`. **Never use the default import:** its JSEP wasm is 29.5 MB, over Cloudflare's 25 MiB limit |
| Model | MobileNetV3-Large fp32 ONNX; fallback MobileNetV3-Small | No quantisation in the MVP |
| Knowledge | Versioned static JSON | Keys = class ids from `class_index.json` |
| Voice | Static MP3 | Generated once in Azure Speech Studio or by REST with the free F0 key. Label: "AI-generated voice" |
| Hosting | Cloudflare Pages + Vercel copy | `_headers` file below |

## `public/_headers` (Cloudflare Pages)
```
/ort/*
  Cache-Control: public, max-age=31536000, immutable
/models/*
  Cache-Control: public, max-age=31536000, immutable
/audio/*
  Cache-Control: public, max-age=31536000, immutable
/data/*
  Cache-Control: public, max-age=3600, must-revalidate
/index.html
  Cache-Control: no-cache
```
Use versioned file names (`-v1`, `-v2`) so immutable caching never traps an old model.

## Bangla voice: verified options
| Option | Status (1 Nov 2026) | Use |
|---|---|---|
| Azure `bn-BD-NabanitaNeural` / `bn-BD-PradeepNeural` | Listed on the official language-support page. F0 tier = 0.5 M chars/month free | **Primary generator.** 7 scripts × about 900 characters ≈ 1% of the free quota |
| Human recording (native speaker) | Always available | Fallback; no licence question |
| Browser `speechSynthesis` | Voice availability depends on the device | Last resort only |
| Google Cloud TTS | Reports say bn-IN only (not checked by me) | Not used |

## Ready for future features (not built now)
- **More crops:** one ONNX per crop + a crop selector; JSON keyed by `crop/class`.
- **Accounts or history:** add FastAPI + Supabase. The frontend already isolates `predict()`.
- **Weather, chatbot:** separate modules. The MVP does not depend on them.
