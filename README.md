# AgroLeaf AI — এগ্রোলিফ এআই

On-device rice leaf disease screening and advisory web application for Bangladeshi farmers.

<!-- Badges placeholder: Build status / License / Platform -->

## Live demo
_coming soon_

## Problem
- Rice is Bangladesh's staple crop, yet smallholder farmers regularly encounter leaf diseases that are difficult to distinguish visually in early stages.
- Timely agricultural extension support is not always immediately accessible in remote fields when first symptoms appear.
- Rural field environments often face intermittent or slow mobile internet, making cloud-dependent image uploads slow or unusable.

## What it does
1. **Photo capture or upload:** The farmer takes or uploads a photo of a rice leaf directly on their smartphone.
2. **On-device inference:** A lightweight deep learning model (MobileNetV3) runs completely inside the browser via WebAssembly (ONNX Runtime Web). The photo is never uploaded to any external server.
3. **Calibrated screening:** The app screens for 6 target classes (`healthy`, `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`), or clearly outputs "not sure" (অনিশ্চিত) if model confidence is below a calibrated validation threshold.
4. **Actionable guidance & voice:** It presents practical Bangla and English explanations and next steps, provides audio narration in Bangla (`bn-BD`), and offers a direct click-to-call button for the national agricultural helpline `16123`.
5. **Transparency:** A dedicated "How accurate is it?" page displays measured test results and confusion matrices honestly.

## Key ideas
- **Honest "Not Sure" (Calibrated Abstention):** Rather than guessing dangerously on ambiguous, blurry, or out-of-distribution photos, AgroLeaf AI explicitly says "not sure" and advises retaking the photo or consulting an expert.
- **On-Device Privacy & Offline Readiness:** All computation happens locally in the user's browser. Leaf images remain private on the user's device, eliminating cloud server dependencies.
- **Bangla Text + Voice Advisory:** Accessible across literacy levels with native Bangla text guidance and tap-to-play audio narration.
- **Measured Accuracy Page:** In-app transparency screen presenting verified performance metrics on real test sets without unverified marketing claims.

## Tech stack
| Component | Decision | Details |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | JavaScript, mobile-first, responsive, accessible UI |
| **In-Browser ML Runtime** | ONNX Runtime Web (`onnxruntime-web/wasm`) | CPU WebAssembly build (< 25 MiB bundle), no JSEP overhead |
| **Model** | MobileNetV3-Large | float32 ONNX, input `1×3×224×224`, ImageNet normalisation |
| **Backend & Database** | None | Pure static architecture, zero hosting cost, no server maintenance |
| **Voice Advisory** | Pre-generated static MP3 | Tap-to-play audio (`bn-BD-NabanitaNeural`), user-initiated playback only |
| **Hosting** | Cloudflare Pages (Primary) / Vercel (Fallback) | Global edge static delivery |
| **ML Training** | PyTorch / TorchVision | Reproducible scripts in `ml/` executed on Kaggle GPU |

## Repository structure
```
AgroLeaf-AI/
├── data/               # Dataset documentation, inventory, and class definitions
├── disease_knowledge/  # Bilingual (Bangla/English) disease advisory and source references
├── documentation/      # Architectural specs, requirements, and design docs
├── frontend/           # React + Vite web application source code
├── handoff/            # Development roadmap, module specifications, and progress logs
├── ml/                 # Machine learning training, evaluation, and export scripts
├── model/              # Model selection, training plans, and evaluation records
└── research/           # Research synthesis, benchmark notes, and technical decisions
```

## Getting started

### Frontend development
```bash
cd frontend
npm install
npm run dev
```

### Machine learning pipeline
See `ml/README.md` for dataset preparation, training, calibration, and ONNX export instructions.

## Deployment (Cloudflare Pages)

The frontend is configured for direct deployment via GitHub integration on Cloudflare Pages:
1. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git**.
2. Select repository: `masumcit44/AgroLeaf-AI`.
3. Configure build settings:
   - **Framework preset:** `None` (or `Vite`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`
4. In **Environment variables**, set:
   - `NODE_VERSION` = `22`
5. Save and deploy. Headers from `frontend/public/_headers` are automatically applied for client caching.
6. Record the generated `*.pages.dev` deployment URL in `README.md` and `handoff/PROGRESS.md`.

## Release checklist

Before final release and competition submission (Module M09), an automated pre-release verification script audits 8 required production guards:

```bash
cd frontend
npm run check:release
```

### The 8 Release Guards:
1. **Calibration:** `public/data/calibration.json` has real temperature scaling and no placeholder flag.
2. **Production Model:** `public/models/rice-mnv3l-v1.onnx` exists, is under the Cloudflare 24 MiB asset ceiling, and begins with the ONNX protobuf magic byte (`0x08`).
3. **Model URL Wiring:** `config.js` `MODEL_URL` points directly at `rice-mnv3l-v1.onnx`, and the placeholder model (`rice-placeholder.onnx`) is deleted.
4. **Class Index Parity:** `class_index.json` matches the exact 6 target classes (`["healthy","blast","brown_spot","leaf_smut","tungro","sheath_blight"]`).
5. **Real Metrics:** `public/data/metrics-v1.json` contains verified test evaluations (`internal_test.n > 0`) with zero synthetic fixture leakage (`FIXTURE_NOT_REAL`).
6. **Sample Images:** `public/samples/manifest.json` specifies ≥ 3 sample images, and every referenced image exists on disk.
7. **Audio Narration:** `public/audio/manifest.json` lists 7 audio guidance files (warns gracefully if offline MP3s are pending user Azure Speech synthesis).
8. **Competition Branding:** The official AIgnite Buildathon competition sticker is present in both `assets/brand/` and `frontend/public/brand/`.

> [!NOTE]
> Today, running `npm run check:release` is **expected to fail (exit 1)** on items 1, 2, 3, 5, and 6 until the Kaggle-trained model run (`run1_for_app.zip`) is bundled via `python ml/tools/make_release_bundle.py` and test samples are picked via `python ml/tools/pick_samples.py`.

## Project status
Follow our step-by-step progress, module deliverables, and acceptance verification in [handoff/PROGRESS.md](handoff/PROGRESS.md).

## Responsible AI
- **Screening, Not Diagnosis:** AgroLeaf AI provides preliminary advisory screening to aid farmers, not certified laboratory diagnosis.
- **No AI-Written Chemical Dosages:** All treatment and management advice is derived strictly from public, verified Bangladesh agricultural extension sources (BAMIS/DAE). The system never improvises or hallucinates chemical recipes.
- **Extension Helpline (16123):** Farmers are encouraged to consult official local extension officers via the national agricultural call center `16123` (operator charges may apply).
- **Quality Safeguards:** Built-in client-side image checks (blur, underexposure) help prevent invalid classifications on poor-quality images.

## Built for
**Ostad Presents YUNet AIgnite Buildathon 2026**

## Data & content licences
- **Dataset Credits:** RiceLeafDiseaseBD v3 (Munna, M.M.H. et al., 2026, DOI: [10.17632/86s4jzj2m4.3](https://doi.org/10.17632/86s4jzj2m4.3)), licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Additional references documented in `research/research_references.md`.
- **Disease Guidance Content:** Disease guidance text is adapted from public Bangladesh government sources (BAMIS/DAE) and is not covered by the MIT licence.

## License
The code in this repository is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Md. Masum Akondha.
