# AgroLeaf AI — এগ্রোলিফ এআই

**Private, on-device rice leaf disease screening and official agricultural guidance for smallholder farmers in Bangladesh.**

---

## Live demo
> 🔗 **Live Web App:** _Deployment in progress on Cloudflare Pages_ (Preview URL: `https://agroleaf-ai.pages.dev`)

---

## Screenshots

| 1. Home & Onboarding | 2. Screening Result (Blast) | 3. Calibrated "Not Sure" | 4. In-App Accuracy & Transparency |
|:---:|:---:|:---:|:---:|
| <img src="documentation/screenshots/release/01_home.png" width="210" alt="AgroLeaf AI Home Screen" /> | <img src="documentation/screenshots/release/02_result_blast.png" width="210" alt="Screening Result Screen for Blast" /> | <img src="documentation/screenshots/release/03_not_sure.png" width="210" alt="Calibrated Not Sure Abstention Screen" /> | <img src="documentation/screenshots/release/04_accuracy.png" width="210" alt="Accuracy Page Screen" /> |

---

## The Problem
- **Crucial Staple Crop:** Rice feeds over 170 million people in Bangladesh, representing the livelihood foundation of millions of smallholder farming families.
- **Visual Ambiguity:** Fungal, bacterial, and viral foliar symptoms (e.g. Rice Blast vs Brown Spot vs Sheath Blight) often appear deceptively similar in early growth stages, leading farmers to misidentify infections.
- **Intermittent Rural Connectivity:** Remote rural fields across haors, chars, and upazilas frequently suffer from weak, intermittent mobile connectivity. Cloud-dependent upload models fail under high latency or zero signal.
- **Dangerous Chemical Guesswork:** Misdiagnosis frequently leads to excessive, mistimed, or inappropriate chemical spraying—wasting scarce farmer income, inducing pathogen resistance, and contaminating rural water bodies.

---

## How It Works

```mermaid
flowchart LR
    A["📱 Farmer takes/uploads leaf photo"] --> B["⚡ Client-side quality check & EXIF resize"]
    B --> C["🧠 In-browser MobileNetV3 inference (WASM)"]
    C --> D["⚖️ Temperature-calibrated confidence"]
    D -->|Confidence &ge; Threshold| E["✅ Verified Bangla disease card + Audio guidance"]
    D -->|Low confidence / Ambiguous| F["⚠️ Honest 'Not Sure' (অনিশ্চিত) abstention"]
    E --> G["📞 One-tap call to DAE Helpline (16123)"]
    F --> G
```

1. **Local Capture & Validation:** The farmer captures or selects a photo. The browser corrects EXIF orientation, resizes to max 1024 px, and checks for blur or darkness.
2. **On-Device Inference:** A lightweight MobileNetV3 neural network runs completely inside the browser via WebAssembly (`onnxruntime-web/wasm`). The image is **never** uploaded to any external server.
3. **Calibrated Abstention ("Not Sure"):** Rather than blindly predicting a class when uncertain, temperature-scaled confidence thresholds route ambiguous inputs to a safe "Not Sure" (অনিশ্চিত) state.
4. **Actionable Extension Guidance:** Displays vetted, official Bangladesh agricultural extension advice (BAMIS/DAE) in native Bangla, plays tap-to-play voice narration, and provides one-click calling to the national helpline `16123`.

---

## Key Features
- **100% Private & Offline-Ready:** Zero cloud inference dependencies. Leaf photos stay strictly on the user's phone, safeguarding farmer privacy and ensuring instant execution even in remote fields.
- **Calibrated Abstention (Responsible AI):** Avoids reckless overconfidence. If lighting is poor, symptoms are atypical, or model confidence falls below threshold, it abstains honestly and instructs consulting local extension officers.
- **Native Bangla Text + Audio Narration:** High accessibility across literacy levels with clear, colloquial Bangla guidance and offline-ready audio playback (`bn-BD-NabanitaNeural`).
- **Verbatim Official Guidance:** Management and preventive actions are strictly adapted from verified public Bangladesh government sources (BAMIS / DAE).
- **One-Tap Extension Helpline (16123):** Built-in direct dialer connecting farmers directly to the Upazila agricultural extension call center.
- **Transparent In-App Accuracy Screen:** Dedicated public evaluation page showing real test dataset metrics, confusion matrices, and known model limitations.

---

## Measured Results
> **Status:** Measured results: see the in-app accuracy page (evaluation in progress).
>
> In accordance with project integrity standards, AgroLeaf AI presents zero invented or synthetic metrics in product documentation. Real validation figures, confusion matrices, and district generalization breakdowns will be published upon completion of the full benchmark run.

---

## Responsible AI Safeguards
- **Preliminary Screening, Not Final Diagnosis:** AgroLeaf AI is an advisory screening aid designed to assist smallholder farmers in early symptom awareness. It is explicitly not a laboratory-grade diagnosis or a substitute for certified agronomists.
- **Strictly No AI-Written Chemical Dosages:** The system strictly rejects generative LLM chemical hallucination. All treatment recommendations are verbatim reproductions of approved DAE/BAMIS advisories.
- **Quality Advisory Warnings:** Non-blocking heuristics alert the user if an image is underexposed or excessively blurry before running inference.
- **Helpline Integration:** Direct access to government agricultural extension officers via `16123` (standard operator call rates apply).

---

## Tech Stack
| Component | Decision | Technical Rationale |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | Fast mobile performance, modern component lifecycle, zero runtime bloat |
| **Styling** | Tailwind CSS v4 | Lightweight, fully responsive mobile-first utility styling |
| **In-Browser ML Runtime** | ONNX Runtime Web (`onnxruntime-web/wasm`) | Strict CPU WebAssembly build (14.16 MiB), avoiding 29.5 MiB JSEP overhead to stay under Cloudflare 25 MiB ceiling |
| **Classifier Architecture** | MobileNetV3-Large | Highly efficient convolutional backbone (`1×3×224×224`), exported to single-file ONNX opset 17 |
| **Backend & Database** | None (Static Architecture) | 100% static hosting, zero server maintenance, zero API cost, infinite scalability |
| **Voice Advisory** | Static Pre-synthesized Audio | Zero-latency tap-to-play audio guidance in standard Bangladeshi Bangla |
| **Hosting & Edge Delivery** | Cloudflare Pages | Global edge delivery with immutable asset caching headers |
| **ML Training Pipeline** | PyTorch / TorchVision | Fully reproducible training, calibration, and evaluation scripts in `ml/` executed on Kaggle GPU |

---

## Repository Structure
```
AgroLeaf-AI/
├── assets/             # Brand identity, competition stickers, and social preview assets
├── data/               # Dataset documentation, inventory, split manifests, and data cards
├── disease_knowledge/  # Reviewed bilingual (Bangla/English) extension advice from BAMIS/DAE
├── documentation/      # Architectural specs, QA reports, lighthouse audits, and screenshots
│   ├── qa/             # Automated smoke reports, release checklist, and QA templates
│   └── screenshots/    # Multi-device mobile screenshots (360px & 390px viewports)
├── frontend/           # React 19 + Vite web application source code
│   ├── public/         # Static assets (WASM runtime, ONNX model, audio, branding)
│   ├── scripts/        # Automated smoke test (Puppeteer) and release guard auditors
│   └── src/            # Application UI, i18n, WebAssembly ML runner, and validation rules
├── handoff/            # Development roadmap, milestone specs, and autonomous progress logs
├── ml/                 # PyTorch training, temperature calibration, and export tooling
│   ├── kaggle/         # Self-contained Kaggle GPU training notebook and runbook
│   └── tools/          # Release bundling, sample picker, and TTS generation tools
└── model/              # Model cards, metrics schemas, and experiment tracking records
```

---

## Local Development

### Prerequisites
- Node.js 20+ (recommended: Node.js 22 LTS)
- Python 3.10+ (for ML scripts and release tooling)

### 1. Run the Web Application
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. To simulate on-device testing, use Chrome DevTools Mobile Emulation (360×740 or 390×844).

### 2. Run Test Suites & Linter
```bash
cd frontend
npm test        # Run all 44 Vitest unit & component tests
npm run lint    # Run Oxlint for zero-warning static analysis
npm run build   # Production build with Cloudflare 25 MiB asset ceiling checks
```

### 3. Run Automated Puppeteer Smoke Test
```bash
cd frontend
npm run smoke   # Automated headless Chrome test across 10 routes at 360px, 390px, 1280px
```

---

## Deployment (Cloudflare Pages)

The frontend is configured for zero-configuration continuous deployment on Cloudflare Pages:
1. In Cloudflare Dashboard, go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select repository: `masumcit44/AgroLeaf-AI`.
3. Configure build settings:
   - **Framework preset:** `None` (or `Vite`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`
4. Set environment variable: `NODE_VERSION = 22`.
5. Deploy. Security and immutable caching headers in `frontend/public/_headers` are automatically applied.

---

## Release Checklist

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

---

## Project Status
Follow our step-by-step progress, module deliverables, and acceptance verification in [handoff/PROGRESS.md](handoff/PROGRESS.md).

---

## Built for
**Ostad Presents YUNet AIgnite Buildathon 2026**

---

## Data & Content Licences
- **Dataset Credits:** RiceLeafDiseaseBD v3 (Munna, M.M.H. et al., 2026, DOI: [10.17632/86s4jzj2m4.3](https://doi.org/10.17632/86s4jzj2m4.3)), licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Additional references documented in `research/research_references.md`.
- **Disease Guidance Content:** Disease guidance text is adapted from public Bangladesh government extension advisories (BAMIS/DAE) and is not covered by the MIT licence.

---

## License
The software code in this repository is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Md. Masum Akondha.
