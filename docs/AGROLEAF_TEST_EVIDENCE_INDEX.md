# AgroLeaf AI — Test Evidence & Verification Index
**Document ID:** `docs/AGROLEAF_TEST_EVIDENCE_INDEX.md`  
**Last Verified:** 2026-11-04T12:56:00+06:00  
**Git Head:** `758ed02`  
**Vitest Version:** v5.0.5  

---

## 1. Automated Test Suite Summary

- **Total Test Files:** 45 passed (100%)
- **Total Unit/Integration Tests:** 330 passed (100%)
- **Static Analysis (Oxlint):** 0 errors, 3 pre-existing tooling warnings
- **Production Asset Ceiling:** All assets under Cloudflare Pages' 25 MiB ceiling
- **Build Execution Time:** 1.26s

---

## 2. Comprehensive Test File Index

| Category | Test File Path | Tests | Status | Verification Scope |
| :--- | :--- | :---: | :---: | :--- |
| **Explainable AI (F11)** | `src/features/explainableAi/__tests__/heatmapRenderer.test.js` | 13 | PASS | Dual-mode palette (overlay vs heatmap), bilinear upsampling, crop math |
| **Explainable AI (F11)** | `src/features/explainableAi/__tests__/camEngine.test.js` | 5 | PASS | In-graph CAM extraction, ReLU activation, min-max normalization |
| **Explainable AI (F11)** | `src/features/explainableAi/__tests__/ExplainableHeatmapCard.test.jsx` | 6 | PASS | 3-way view tab switching, opacity slider, null CAM fallback notice |
| **Image Preprocessing (F1)**| `src/ml/__tests__/preprocess.test.js` | 20 | PASS | ImageNet normalization, Pillow-exact bilinear resize, CenterCrop |
| **User-Guided Crop (F1)** | `src/features/user_guided_crop/__tests__/cropMath.test.js` | 13 | PASS | Square context ROI preservation, aspect ratio clamping |
| **User-Guided Crop (F1)** | `src/features/user_guided_crop/__tests__/cropScreens.test.jsx` | 6 | PASS | Crop viewport touch bounds, full photo fallback |
| **Yield Impact & Risk (F26)**| `src/features/yieldRisk/__tests__/riskEngine.test.js` | 10 | PASS | Dynamic risk estimation, multiplicative microclimate coupling |
| **Yield Impact & Risk (F26)**| `src/features/yieldRisk/__tests__/YieldRiskCard.test.jsx` | 5 | PASS | Farmer question inputs, non-chemical advisory display |
| **Farmer Reminders (F24)** | `src/features/reminders/__tests__/remindersLogic.test.js` | 7 | PASS | Due date math, status transitions, follow-up intervals |
| **Farmer Reminders (F24)** | `src/features/reminders/__tests__/remindersStore.test.js` | 8 | PASS | IndexedDB CRUD lifecycle, offline persistence |
| **Farmer Reminders (F24)** | `src/features/reminders/__tests__/RemindersPage.test.jsx` | 2 | PASS | Responsive reminder list rendering, empty state |
| **Farmer Reminders (F24)** | `src/features/reminders/__tests__/FollowUpCard.test.jsx` | 4 | PASS | Follow-up scheduling card in scan result |
| **Farmer Reminders (F24)** | `src/features/reminders/__tests__/notificationService.test.js`| 3 | PASS | Browser notification permission and dispatch |
| **PWA & Offline (F9)** | `src/features/pwa/__tests__/pwa.test.jsx` | 6 | PASS | Cache warming, service worker controller detection, update prompt |
| **Reliability & Confidence**| `src/features/reliability/__tests__/reliability.test.jsx` | 10 | PASS | Wilson score confidence bands, calibration thresholding |
| **Safety Gate** | `src/ml/__tests__/safetyGate.test.js` | 10 | PASS | Green leaf pixel ratio, leaf thresholding |
| **Non-Rice Gate** | `src/ml/__tests__/nonriceGate.test.js` | 2 | PASS | Second-model gate rejecting non-rice photographs |
| **ML Inference** | `src/ml/__tests__/inference.test.js` | 10 | PASS | ONNX Runtime session execution, softmax scaling |
| **Weather & BAMIS (F8)** | `src/features/weather/__tests__/weather.test.jsx` | 18 | PASS | Weather card rendering, BAMIS risk trigger evaluation |
| **Weather Report (F8 v2)** | `src/features/weather/__tests__/weatherReport.test.jsx` | 15 | PASS | 7-day forecast, humidity charts, BRRI crop calendar |
| **Action Plan (F10)** | `src/features/actionPlan/__tests__/actionPlan.test.jsx` | 5 | PASS | Non-chemical guidance, Bangla translation parity |
| **History (F16)** | `src/features/history/__tests__/history.test.jsx` | 7 | PASS | IndexedDB scan storage, date localization |
| **Audio & Voice (F5–F7)** | `src/lib/__tests__/voiceClips.test.js` | 6 | PASS | Pre-recorded voice clip manifest verification |
| **Audio Player (F5–F7)** | `src/lib/__tests__/audio.test.js` | 5 | PASS | Web Audio API playback, pause, and stop controls |
| **Image Validation** | `src/lib/__tests__/validateImageFile.test.js` | 5 | PASS | MIME type checks, corrupted byte detection |
| **Image Quality** | `src/lib/__tests__/imageQuality.test.js` | 4 | PASS | Blur variance, underexposure/overexposure checks |
| **Sample Images** | `src/lib/__tests__/sampleImages.test.js` | 2 | PASS | Built-in sample leaf assets integrity |
| **Disease Knowledge** | `src/lib/__tests__/diseaseNames.test.js` | 1 | PASS | 8-class disease name taxonomy consistency |
| **Content Validation** | `src/lib/__tests__/contentValidation.test.js` | 3 | PASS | Bilingual JSON parity across disease guides |
| **Result Rules** | `src/lib/__tests__/resultRules.test.js` | 5 | PASS | Classification decision tree and fallback routes |
| **UI Components** | `src/components/__tests__/TabBar.test.jsx` | 4 | PASS | Touch navigation bar switching |
| **UI Safety** | `src/components/__tests__/InputSafetyCard.test.jsx` | 6 | PASS | Image warning indicators and retake guidance |
| **Help Requests (F22)** | `src/features/help/__tests__/help.test.jsx` | 10 | PASS | Helpline links, extension officer guidance |
| **Area Map (F23)** | `src/features/areaMap/__tests__/areaMap.test.jsx` | 5 | PASS | GeoJSON district boundaries rendering |
| **Farmer Profile (F21)** | `src/features/profile/__tests__/profile.test.js` | 11 | PASS | Local storage profile settings |
| **GPS Location (F21)** | `src/features/profile/__tests__/gpsLocation.test.js` | 5 | PASS | Geolocation resolution to district |
| **Server API (Mock)** | `server/__tests__/api.test.js` | 10 | PASS | Feedback, help request mock endpoints |
| **Server Area (Mock)** | `server/__tests__/area.test.js` | 9 | PASS | District aggregation mock handlers |
| **IndexedDB Store** | `src/lib/store/__tests__/store.test.js` | 7 | PASS | IDB transaction lifecycle and store migration |
| **Offline Sync Queue** | `src/lib/store/__tests__/sync.test.js` | 15 | PASS | Queueing requests offline, replay mechanics |
| **Sync Integration** | `src/lib/store/__tests__/sync.integration.test.js` | 8 | PASS | End-to-end sync queue flush |
| **Accuracy Page** | `src/pages/__tests__/AccuracyPage.test.jsx` | 6 | PASS | Public scientific validation report page |
| **Dev Parity Page** | `src/pages/__tests__/DevParityPage.test.jsx` | 5 | PASS | Model parity comparison against PyTorch |
| **Foundation** | `src/features/__tests__/foundation.test.jsx` | 10 | PASS | Feature flag toggling and slot component rendering |
| **Copy Validation** | `src/lib/__tests__/copyCheck.test.js` | 3 | PASS | Prohibited terms check (no unverified pesticide ratios) |

---

## 3. Verification Commands

To reproduce these results at any time:

```bash
# 1. Run all 45 Vitest test files
npm --prefix frontend test

# 2. Run static analysis
npx --prefix frontend oxlint .

# 3. Verify production build and asset sizes
npm --prefix frontend run build
```
