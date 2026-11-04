# AgroLeaf AI — Current Project State Technical Audit
**Document ID:** `docs/AGROLEAF_CURRENT_PROJECT_STATE_AUDIT.md`  
**Audit Date:** 2026-11-04T13:26:45+06:00  
**Auditor:** Antigravity (Lead Software Architect & QA Lead)  
**Production Commit:** `758ed02`  
**Target Host:** Cloudflare Pages (`https://agroleaf-ai.pages.dev`)  

---

## 1. Full-Stack Architectural State

### A. Frontend Architecture
- **Framework:** React 19 + Vite 8 (using Rolldown bundler) + Tailwind CSS v4.
- **Routing:** Hash-based client routing (`#/`, `#/weather`, `#/reminders`, `#/history`, `#/about`). Works natively with offline PWA.
- **State Management:** Modular Zustand/vanilla-hook architecture (`useScanFlow.js`, `weatherStore.js`, `remindersStore.js`, `yieldRiskStore.js`).
- **Slot Component Architecture:** Dynamic injection via `src/features/slots.jsx` and `flags.js`. Features render cleanly without coupling core scan flows.
- **Localization:** 100% bilingual (Bangla `bn` primary default, English `en` secondary). Strict key parity verified by `contentValidation.test.js`.
- **Mobile Touch Usability:** Tested across 360px, 375px, 390px, and 412px viewports. Minimum touch target $\ge 44$px strictly enforced.

### B. Backend & Data Architecture
- **Local-First Core:** All critical farmer diagnostics, reminders, and history persist in browser **IndexedDB** (`agroleaf-db` v2) via `src/lib/store/db.js`.
- **Edge Functions:** Cloudflare Pages Functions (`functions/api/v1/`) support geocoding, device registration, and anonymous area aggregation.
- **Edge Proxy:** `functions/api/v1/geocode.js` caches Open-Meteo reverse geocoding on Cloudflare's global edge network.

### C. AI / Machine Learning Inference Pipeline
- **Model:** `public/models/rice-effb0-v10-320.onnx` (15.34 MiB).
- **Architecture:** EfficientNet-B0 with custom 8-class classification head and in-graph CAM extraction.
- **Runtime:** ONNX Runtime WebAssembly CPU SIMD (`ort-wasm-simd-threaded.wasm` 14.16 MiB). Runs 100% on-device in browser. Zero server upload.
- **Input Geometry:** $320 \times 320$ RGB tensor normalized with ImageNet mean/std (`[0.485, 0.456, 0.406]`, `[0.229, 0.224, 0.225]`).
- **Outputs:**
  1. `logits`: $[1, 8]$ unnormalized class scores.
  2. `cam_maps`: $[1, 8, 10, 10]$ spatial class activation feature maps.
- **Calibration:** Temperature scaling ($T = 0.66$) and decision thresholding ($0.30$) defined in `public/data/calibration.json`.
- **Latency:** ~250–450 ms inference latency on mid-range Android smartphones.

### D. Progressive Web App (PWA) & Offline Cache
- **Service Worker:** Generated via Vite-PWA (Workbox).
- **Runtime Model Cache:** `agroleaf-model-cache-v2`. Large ONNX model and WASM binaries are runtime cached on first download and served `CacheFirst` offline.
- **Legacy Invalidation:** Automated startup eviction for `agroleaf-model-cache-v1` to ensure all returning clients get the enhanced CAM model.
- **Audio Cache:** `agroleaf-audio-cache-v1` caches Bangla voice advice MP3 clips.

---

## 2. Feature Classification Inventory

| Feature | Category | Exact Classification | Detailed Technical Findings |
| :--- | :--- | :--- | :--- |
| **F1: Preprocessing & Aspect Integrity** | Core AI | **Complete & Verified** | Aspect ratio distortion resolved with square context ROI (`cropSquareContextCanvas`). 20 tests pass. |
| **F1 Advanced: Live Guided Camera** | CV | **Requires Implementation** | Architecture audited; requires integrating `navigator.mediaDevices.getUserMedia` with per-frame blur and framing guidance. |
| **F5–F7: Voice Audio Advisory** | Voice | **Complete & Verified** | Speaks diagnosis in Bangla; pre-recorded audio cached in Workbox. |
| **F8 / F8 v2: Weather & Disease Awareness** | Agronomy | **Complete & Verified** | Open-Meteo 7-day forecast with BAMIS disease threshold rules. 33 tests pass. |
| **F9: Progressive Web App** | Platform | **Complete & Verified** | Service worker caching, offline execution, and update prompts verified. |
| **F10: This-Week Action Plan** | Advisory | **Complete & Verified** | Non-chemical weekly steps; strict prohibition against pesticide mixing ratios verified. |
| **F11: Explainable AI Heatmap** | XAI | **Complete & Verified** | Dual-mode palette (thermal vs high-contrast overlay) and fallback state deployed in `758ed02`. 24 tests pass. |
| **F14: Photo History (Before/After)** | Tracking | **Implemented, Needs E2E Polish**| IndexedDB schema ready; requires dedicated comparison viewer to evaluate plant recovery over time. |
| **Confidence Score Feature** | AI UX | **In Progress** | Component and i18n created; needs unit tests and insertion into `ResultScreen.jsx`. |
| **F24: Farmer Reminders & Scheduler** | Crop Care | **Complete & Verified** | Follow-up cards, customizable intervals, and due banners functioning offline in IndexedDB. |
| **F26: Yield Impact Estimation & Risk** | Agronomy | **Complete & Verified** | BAMIS dynamic risk rules, 5 farmer questions, WCAG AA compliant. Verified in `fb4e042`. |
| **F30: AI-Powered Disease Q&A** | Voice AI | **Requires Implementation** | Planned as a local RAG assistant over verified BRRI/DAE knowledge base with a large microphone button. |
| **F31: Disease Severity Scoring** | Quant AI | **Requires Implementation** | Planned as an IRRI 0–9 scale lesion quantifier for Blast and Brown Spot. |
| **F32: Outbreak Early Warning** | Community| **Requires Implementation** | Planned as an opt-in, privacy-preserving administrative area surveillance rollup. |
| **F12: Anonymous Device Registration** | Auth | **Blocked by External Cloudflare Secret**| Ready locally with HMAC-SHA256, but requires production `TURNSTILE_SECRET` and `HASH_SALT`. |
| **F23: Area Disease Map** | Geo | **Blocked by External Cloudflare Migration**| Frontend GeoJSON map ready; blocked on owner applying `0002_area_district.sql` to prod D1. |

