# AgroLeaf AI — Feature Implementation Status & Audit

**Document:** `docs/FEATURE_IMPLEMENTATION_STATUS.md`  
**Auditor:** Antigravity (Project Lead & Technical Architect)  
**Date:** 4 November 2026  
**Repository:** `masumcit44/AgroLeaf-AI`  
**Live Application:** `https://agroleaf-ai.pages.dev`  
**Preview Deployment:** `https://deploy-candidate-ready.agroleaf-ai.pages.dev`  

---

## 1. Feature Inventory & Audit Matrix

| Feature ID & Name | Purpose | Implementation Status | Frontend Files | Backend / API Files | DB Dependencies | Working in Live App? | Test Coverage | Required Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **F1–F4: Edge Rice Leaf Disease Classifier** | Offline, in-browser classification of 8 rice leaf disease classes via MobileNetV3 ONNX | **Implemented and verified** | `src/ml/loadModel.js`, `src/ml/classify.js`, `src/ml/decide.js`, `src/ml/config.js`, `public/model/model_v10.onnx` | None (Client-side WASM/WebGL) | None | **Yes** | Unit tests in `ml/__tests__`, live browser tests passing | Monitor performance on low-end mobile devices (ISSUE-001) |
| **F5–F7: Voice Audio Advisory** | Reads disease diagnosis, symptoms, and immediate action steps aloud in Bangla / English | **Implemented and verified** | `src/components/AudioPlayer.jsx`, `src/components/ResultCard.jsx`, `src/lib/speechSynthesis.js` | None (Web Speech API) | None | **Yes** | Unit tests in `components/__tests__` | Ensure button touch target $\ge 44$px for mobile farmers |
| **F8: Weather & Crop Disease Awareness** | Evaluates Open-Meteo weather forecast against BAMIS rules to alert favorable disease conditions | **Implemented and verified** | `src/features/weather/index.jsx`, `src/features/weather/weatherStore.js`, `src/features/weather/weatherRules.js` | `api.open-meteo.com/v1/forecast` | None | **Yes** | Rule tests in `weather/__tests__` | Remove homepage location prompt; restrict to Weather tab (ISSUE-002) |
| **F8 v2: Dedicated Weather & Agricultural Analysis Tab** | Comprehensive 10-section weather & crop report at `#/weather` (7-day forecast, humidity, BRRI crop calendar) | **Implemented and verified** | `src/features/weather/WeatherPage.jsx`, `src/features/weather/WeatherReportPage.jsx`, `src/features/weather/cropCalendar.js` | `functions/api/v1/geocode.js` (Cloudflare edge cached) | None | **Yes** (merged as `a0f865a`) | 11 E2E scenarios passing in `e2e_weather_report.mjs` | Maintain and monitor geocode rate limits |
| **F9: Progressive Web App (PWA & Offline Cache)** | Standalone home-screen installation and offline asset caching | **Implemented and verified** | `src/features/pwa/index.jsx`, `public/sw.js`, `public/manifest.json` | None (Service Worker) | CacheStorage | **Yes** | PWA E2E tests passing in `e2e_pwa_offline.mjs` | Maintain service worker cache versioning |
| **F10: This-Week Action Plan** | Practical weekly action steps for farmers adhering to strict chemical safety rules (no pesticide mixing ratios) | **Implemented and verified** | `src/features/actionPlan/index.jsx`, `src/features/actionPlan/planRules.js`, `src/features/actionPlan/i18n.js` | None | None | **Yes** (merged in `e4058b9`) | 5 test suites passing (`actionPlan.test.jsx`) | Verify mobile card spacing and readability (ISSUE-001) |
| **F11: Offline Queue & Sync** | Queues feedback, help requests, and area reports in IndexedDB when offline, auto-syncing when online | **Implemented but not fully tested** | `src/lib/store/db.js`, `src/lib/store/queue.js` | Background sync event | IndexedDB | **Partial** | Unit tests for DB store | Run live sync tests with backend endpoints |
| **F12: Anonymous Device Registration & Signing** | Anonymous device ID generation, HMAC-SHA256 request signing, and Turnstile bot protection | **Implemented but not fully tested** | `src/lib/crypto/deviceAuth.js`, `src/lib/api/client.js` | `functions/api/v1/devices/index.js`, `functions/api/v1/_middleware.js` | Cloudflare D1 `devices` table | **Partial** | Unit tests with test HMAC keys | Blocked on owner setting production Cloudflare Turnstile secret |
| **F14: Measured Reliability Bands** | High / Medium / Not Sure reliability bands with empirical Wilson score accuracy | **Implemented and verified** | `src/features/reliability/bands.js`, `src/features/reliability/index.jsx`, `bands_v10.json` | None | None | **Yes** | Unit tests in `reliability/__tests__` | Hide accuracy % on `not_sure` result screen (Item 4 polish) |
| **F16: Scan History** | Local history of past diagnoses with Bangla date formatting and image thumbnails | **Implemented and verified** | `src/features/history/index.jsx`, `src/features/history/historyStore.js` | None | IndexedDB (`STORES.HISTORY`) | **Yes** | Unit tests in `history/__tests__` | Verify mobile card tap responsiveness |
| **F20: "Was this result wrong?" Farmer Feedback** | Allows farmers/specialists to flag incorrect diagnoses for continuous dataset refinement | **Partially implemented** | `src/features/feedback/index.jsx`, `src/features/feedback/feedbackStore.js` | `functions/api/v1/feedback/index.js`, `functions/api/v1/feedback/mine.js` | Cloudflare D1 `feedback` table | **No** (flagged off) | Mock DB tests in `server/__tests__` | Complete signed POST handler and integrate modal |
| **F21: Farmer Profile** | Stores district, crop season, and variety locally | **Implemented but broken UX** | `src/features/profile/index.jsx`, `src/features/profile/profileStore.js`, `src/features/profile/gpsLocation.js` | None | IndexedDB (`STORES.PROFILE`) | **Yes (broken UX)** | Unit tests passing | Reevaluate purpose; remove GPS from homepage; simplify (ISSUE-004) |
| **F22: Expert Help Request** | Connects farmers to agricultural extension officers (DAE / 16123 helpline) | **Implemented but not fully tested** | `src/features/help/index.jsx` | `functions/api/v1/help-requests/index.js` | Cloudflare D1 `help_requests` | **Partial** (helpline link works) | UI tests passing | Verify D1 submission endpoint once backend secret configured |
| **F23: Area Disease Map** | Outbreak map displaying district-level disease density with GeoJSON overlay | **Blocked by dependency** | `src/features/areaMap/index.jsx`, `src/features/areaMap/districtGeo.js`, `public/geo/bd_districts.geojson` | `functions/api/v1/area-reports/index.js`, `functions/api/v1/area-summary/index.js` | Cloudflare D1 `area_reports` | **No** (flagged off) | Unit tests passing | Run `0002_area_district.sql` migration on prod D1 after owner approval |
| **F24: Farmer Reminder & Crop Care Scheduler** | Timely follow-up inspection reminders for diagnosed diseases and manual crop-care scheduling; works 100% offline via IndexedDB | **Implemented and verified** | `src/features/reminders/index.jsx`, `src/features/reminders/remindersStore.js`, `src/features/reminders/RemindersPage.jsx`, `src/features/reminders/FollowUpCard.jsx`, `src/features/reminders/DueBanner.jsx` | None (Local-First IndexedDB DB v2) | IndexedDB (`STORES.REMINDERS`) | **Yes** | 24 unit tests in `reminders/__tests__`, 38 E2E viewport checks | Integrated on branch `feat/f24-reminders` |
| **User-Guided Diseased Leaf Crop** | Allows farmer to zoom/crop the diseased section of the leaf before scanning | **Implemented and verified** | `src/features/user_guided_crop/CropScreen.jsx` | None (HTML5 Canvas) | None | **Yes** | Component tests passing | Optimize touch handles for narrow screens (< 360px) |

---

## 2. Categorized Feature Lists

### 1. Completed and Verified Features
1. **F1–F4 Edge Rice Leaf Classifier** (v10 ONNX MobileNetV3 client-side inference)
2. **F5–F7 Voice Audio Advisory** (Bangla Web Speech synthesis)
3. **F8 & F8 v2 Weather Awareness & Analysis** (BAMIS disease rules + 10-section crop report)
4. **F9 Progressive Web App** (Offline caching, standalone install)
5. **F10 This-Week Action Plan** (Bangla weekly non-chemical action steps & 16123 helpline)
6. **F14 Measured Reliability Bands** (Empirical Wilson score confidence bands)
7. **F16 Scan History** (Bangla-formatted IndexedDB scan records)
8. **User-Guided Leaf Crop** (Canvas-based crop box selection)
9. **F24 Farmer Reminder & Crop Care Scheduler** (Offline-first IndexedDB reminder lifecycle, follow-up card, due banner, manual scheduling)

### 2. Incomplete or Partially Implemented Features
1. **F20 Farmer Feedback:** Frontend button exists; backend signed POST endpoint and modal need integration.
2. **F11 Offline Sync:** Local queue operational; background network flush needs live end-to-end test.

### 3. Broken or Questionable Features Requiring Immediate Rework
1. **F21 Farmer Profile:** Prompts for GPS location directly on homepage; collects fields with no direct algorithmic impact; confusing to farmers. (Addressed in **ISSUE-004**).
2. **F8 Homepage Location Prompt:** Prompts for district/location on the scan landing page instead of inside the Weather tab. (Addressed in **ISSUE-002**).
3. **Mobile Layout Across Pages:** Certain typography, table widths, and button sizes are cramped or misaligned on narrow phone screens (< 380px). (Addressed in **ISSUE-001**).

### 4. Features Blocked by External Dependencies
1. **F23 Area Disease Map:** Blocked on owner running `npx wrangler d1 execute agroleaf-prod --remote --file=migrations/0002_area_district.sql`.
2. **F12 Production Turnstile Verification:** Blocked on owner inserting `TURNSTILE_SECRET` and `HASH_SALT` into Cloudflare Pages production dashboard.

### 5. Redundant or Unnecessary Elements for MVP
1. **Mandatory Farmer Profile Creation:** Forcing farmers to configure a profile before scanning adds friction. Leaf diagnosis must work in zero clicks from image capture.
2. **Detailed Acreage & Planting Date Inputs:** Not currently factored into the v10 ML model. Should not be solicited from farmers.
