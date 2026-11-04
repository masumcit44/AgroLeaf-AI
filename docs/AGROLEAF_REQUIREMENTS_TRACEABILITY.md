# AgroLeaf AI — Requirements Traceability Matrix
**Document ID:** `docs/AGROLEAF_REQUIREMENTS_TRACEABILITY.md`  
**Last Updated:** 2026-11-04T13:25:30+06:00  
**Project Lead:** Antigravity  

---

## Traceability Matrix: Requirement → Feature → Source → Test → Status

| Req # | Feature ID & Description | Source Files | Test Files | Verification Status | Operational Notes / Constraints |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **REQ-01** | **F1: Image Pipeline & Preprocessing**<br>Decodes JPEG/PNG, preserves aspect ratio with square context ROI, prevents distortion. | `src/ml/preprocess.js`<br>`src/state/useScanFlow.js`<br>`src/features/user_guided_crop/cropMath.js` | `src/ml/__tests__/preprocess.test.js`<br>`cropMath.test.js` | **Verified in Prod** (`69a48dd`) | 100% on-device WASM, 0 bit drift vs torchvision |
| **REQ-02** | **F1 Advanced: Live Guided Camera Scanner**<br>Real-time video frame guidance with directional Bangla prompts and blur/lighting quality checks. | `src/features/liveScanner/` (planned)<br>`src/lib/imageQuality.js` | `src/lib/__tests__/imageQuality.test.js` | **Design Ready** | Strict free-only; no paid detection APIs; rear camera default |
| **REQ-03** | **F5–F7: Bangla Voice Advisory**<br>Speaks diagnosis, symptoms, and primary care steps in clear Bangla. | `src/components/AudioPlayer.jsx`<br>`src/lib/speechSynthesis.js` | `src/lib/__tests__/voiceClips.test.js`<br>`src/lib/__tests__/audio.test.js` | **Verified in Prod** | Audio files cached locally in CacheStorage |
| **REQ-04** | **F8 / F8 v2: Weather & Crop Disease Risk**<br>Evaluates microclimate against BAMIS disease thresholds with a 7-day forecast. | `src/features/weather/WeatherPage.jsx`<br>`src/features/weather/weatherRules.js` | `src/features/weather/__tests__/weather.test.jsx` | **Verified in Prod** (`faa1d17`) | Open-Meteo free tier; cached in IndexedDB |
| **REQ-05** | **F9: Progressive Web App (Offline PWA)**<br>Full offline execution, Workbox service worker caching model and assets. | `src/features/pwa/index.jsx`<br>`src/features/pwa/cacheConfig.js`<br>`public/sw.js` | `src/features/pwa/__tests__/pwa.test.jsx` | **Verified in Prod** (`758ed02`) | Cache v2 auto-evicts legacy single-output model cache |
| **REQ-06** | **F10: This-Week Action Plan**<br>Practical weekly crop-care steps adhering to non-chemical safety rules. | `src/features/actionPlan/index.jsx`<br>`src/features/actionPlan/planRules.js` | `src/features/actionPlan/__tests__/actionPlan.test.jsx` | **Verified in Prod** (`e4058b9`) | 0 chemical ratios; refers to 16123 helpline |
| **REQ-07** | **F11: Explainable AI Heatmap**<br>In-graph Class Activation Mapping (CAM) showing disease focus with 3-way view. | `src/features/explainableAi/ExplainableHeatmapCard.jsx`<br>`src/features/explainableAi/heatmapRenderer.js`<br>`src/features/explainableAi/camEngine.js` | `camEngine.test.js`<br>`heatmapRenderer.test.js`<br>`ExplainableHeatmapCard.test.jsx` | **Verified in Prod** (`758ed02`) | Dual-mode palette (Amber-Crimson overlay, Thermal heatmap) |
| **REQ-08** | **F14: Photo History (Before/After)**<br>Tracks individual plants chronologically to evaluate symptom progression. | `src/features/history/historyStore.js`<br>`src/lib/store/db.js` | `src/features/history/__tests__/history.test.jsx` | **Schema Ready** | Fully independent from Confidence Score |
| **REQ-09** | **Confidence Score Feature**<br>Surfaces calibrated prediction confidence as High/Med/Low badge with retake prompts. | `src/features/confidenceScore/ConfidenceScoreCard.jsx`<br>`src/features/confidenceScore/i18n.js` | `ConfidenceScoreCard.test.jsx` (in progress) | **Implementation Underway** | Derived from temperature-scaled inference; no duplicate softmax |
| **REQ-10** | **F24: Farmer Reminder & Scheduler**<br>Follow-up inspection scheduler with customizable intervals and due banners. | `src/features/reminders/RemindersPage.jsx`<br>`src/features/reminders/remindersStore.js` | `remindersLogic.test.js`<br>`FollowUpCard.test.jsx` | **Verified in Prod** (`73787c1`) | 100% offline IndexedDB v2 store |
| **REQ-11** | **F26: Yield Impact & Risk Intelligence**<br>Dynamic risk estimation integrating weather, disease stage, and BAMIS rules. | `src/features/yieldRisk/YieldRiskCard.jsx`<br>`src/features/yieldRisk/riskEngine.js` | `riskEngine.test.js`<br>`YieldRiskCard.test.jsx` | **Verified in Prod** (`fb4e042`) | Evaluated with 5 farmer questions, WCAG AA accessible |
| **REQ-12** | **F30: Voice-First Farmer Copilot**<br>Spoken Bangla Q&A assistant with large microphone button and BRRI knowledge base. | `src/features/copilot/` (planned)<br>`public/data/agricultural_kb.json` | Unit tests planned | **Requirements Recovered** | Strictly free-only local RAG; zero paid LLM APIs |
| **REQ-13** | **F31: Disease Severity Scoring**<br>Quantifies visible affected leaf area for Blast and Brown Spot. | `src/features/severity/` (planned) | Unit tests planned | **Requirements Recovered** | Attention heatmap != lesion segmentation; dedicated scoring |
| **REQ-14** | **F32: Outbreak Early Warning & Alert**<br>Privacy-preserving community surveillance by administrative area rollup. | `src/features/communityAlerts/` (planned) | Unit tests planned | **Requirements Recovered** | Explicit opt-in; no exact coordinates; contributor deduplication |

---

## Key Invariant Verifications

1. **Feature ID Disambiguation:**
   - `F14` is strictly **Photo History (Before/After Tracking)**.
   - `Confidence Score` is a **standalone result attribute**, not F14.
2. **Model Safety & Transparency:**
   - Never fabricate an attention map or severity score when input data is missing or degraded.
   - Explicit fallback warnings must be rendered in Bangla.
3. **Cost Invariance:**
   - Zero paid cloud APIs or GPUs. All on-device WASM, Web APIs, and free-tier edge workers.
