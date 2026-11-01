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
