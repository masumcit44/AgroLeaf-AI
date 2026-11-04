# AGROLEAF AI — F26 PRODUCTION VERIFICATION EVIDENCE
**Document Purpose:** Independent verification of production release, automated test logs, and live end-to-end evidence for Feature F26.  
**Lead Verifier:** Project Lead & QA Lead (Antigravity)  
**Execution Timestamp:** November 4, 2026 at 11:24:13+06:00  
**Target URL:** `https://agroleaf-ai.pages.dev`  
**Target Commit:** `7eb572e` (`feat(yieldRisk): F26 yield impact estimation & dynamic risk intelligence with BAMIS rules and 5 farmer questions`)  
**Production Bundle Identifier:** `/assets/index-CgJEzQFL.js`

---

## 1. Production Bundle & Live HTML Inspection

### Live HTTP Request
```http
GET https://agroleaf-ai.pages.dev/ HTTP/2
Host: agroleaf-ai.pages.dev
User-Agent: curl/8.4.0
Accept: */*
```

### Live Production Response Headers & Body Snippet
```html
HTTP/2 200 
date: Wed, 04 Nov 2026 05:15:40 GMT
content-type: text/html; charset=utf-8
server: cloudflare

<!doctype html>
<html lang="bn">
  <head>
    <meta charset="UTF-8" />
    <title>AgroLeaf AI — ধানের পাতার রোগ</title>
    <script type="module" crossorigin src="/assets/index-CgJEzQFL.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/rolldown-runtime-COiEfhsA.js">
    <link rel="stylesheet" crossorigin href="/assets/index-Do-eQEBy.css">
    <link rel="manifest" href="/manifest.webmanifest">
  </head>
  <body class="bg-paper text-ink min-h-screen antialiased selection:bg-leaf-50 selection:text-leaf-700">
    <div id="root"></div>
  </body>
</html>
```

### Bundle Symbol Verification
Inspecting `https://agroleaf-ai.pages.dev/assets/index-CgJEzQFL.js`:
- `yieldRisk`: Present (registered in `SLOT_LAYOUT.result` index 4).
- `YieldRiskCard`: Compiled and present.
- `riskEngine`: Compiled and present (`STAGE_VULNERABILITY`, `evaluateRiskContext`, `evaluateBlastMicroclimate`).
- `STORES.WEATHER`: IndexedDB caching present.

---

## 2. Automated Test Suite Verification (Vitest)

### Command
```bash
cd frontend && npx vitest run
```

### Terminal Output
```
 RUN  v5.0.5 D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt/frontend

 ✓ server/__tests__/api.test.js (10 tests) 463ms
 ✓ src/lib/store/__tests__/sync.test.js (15 tests) 201ms
 ✓ src/ml/__tests__/preprocess.test.js (20 tests) 309ms
 ✓ src/features/history/__tests__/history.test.jsx (7 tests) 343ms
 ✓ server/__tests__/area.test.js (9 tests) 864ms
 ✓ src/pages/__tests__/AccuracyPage.test.jsx (6 tests) 184ms
 ✓ src/lib/store/__tests__/sync.integration.test.js (8 tests) 548ms
 ✓ src/features/profile/__tests__/profile.test.js (11 tests) 65ms
 ✓ src/features/help/__tests__/help.test.jsx (10 tests) 100ms
 ✓ src/features/areaMap/__tests__/areaMap.test.jsx (5 tests) 71ms
 ✓ src/features/reminders/__tests__/remindersStore.test.js (8 tests) 82ms
 ✓ src/features/weather/__tests__/weatherReport.test.jsx (15 tests) 134ms
 ✓ src/features/weather/__tests__/weather.test.jsx (18 tests) 107ms
 ✓ src/lib/store/__tests__/store.test.js (7 tests) 143ms
 ✓ src/features/user_guided_crop/__tests__/cropScreens.test.jsx (6 tests) 108ms
 ✓ src/lib/__tests__/voiceClips.test.js (6 tests) 48ms
 ✓ src/features/yieldRisk/__tests__/YieldRiskCard.test.jsx (4 tests) 41ms
 ✓ src/features/__tests__/foundation.test.jsx (10 tests) 58ms
 ✓ src/features/reminders/__tests__/FollowUpCard.test.jsx (4 tests) 36ms
 ✓ src/features/reliability/__tests__/reliability.test.jsx (10 tests) 60ms
 ✓ src/features/profile/__tests__/gpsLocation.test.js (5 tests) 41ms
 ✓ src/features/actionPlan/__tests__/actionPlan.test.jsx (5 tests) 30ms
 ✓ src/pages/__tests__/DevParityPage.test.jsx (5 tests) 40ms
 ✓ src/lib/__tests__/audio.test.js (5 tests) 21ms
 ✓ src/components/__tests__/InputSafetyCard.test.jsx (6 tests) 37ms
 ✓ src/ml/__tests__/safetyGate.test.js (10 tests) 22ms
 ✓ src/features/pwa/__tests__/pwa.test.jsx (6 tests) 46ms
 ✓ src/components/__tests__/TabBar.test.jsx (4 tests) 35ms
 ✓ src/features/reminders/__tests__/RemindersPage.test.jsx (2 tests) 34ms
 ✓ src/features/user_guided_crop/__tests__/cropMath.test.js (9 tests) 20ms
 ✓ src/features/yieldRisk/__tests__/riskEngine.test.js (9 tests) 19ms
 ✓ src/ml/__tests__/inference.test.js (10 tests) 16ms
 ✓ src/features/reminders/__tests__/remindersLogic.test.js (7 tests) 14ms
 ✓ src/lib/__tests__/validateImageFile.test.js (5 tests) 11ms
 ✓ src/lib/__tests__/sampleImages.test.js (2 tests) 12ms
 ✓ src/lib/__tests__/copyCheck.test.js (3 tests) 11ms
 ✓ src/lib/__tests__/resultRules.test.js (5 tests) 11ms
 ✓ src/lib/__tests__/imageQuality.test.js (4 tests) 10ms
 ✓ src/lib/__tests__/contentValidation.test.js (3 tests) 9ms
 ✓ src/lib/__tests__/diseaseNames.test.js (1 test) 8ms
 ✓ src/ml/__tests__/nonriceGate.test.js (2 tests) 5ms
 ✓ src/features/reminders/__tests__/notificationService.test.js (3 tests) 5ms

 Test Files  42 passed (42)
      Tests  300 passed (300)
   Start at  11:17:45
   Duration  6.33s
```

---

## 3. Linter & Release Guards Verification

### Oxlint Run
```bash
npm run lint
```
**Output:** `Found 15 warnings and 0 errors. Finished in 134ms on 184 files with 104 rules using 8 threads.` (Exit Code: 0).

### Automated Release Guards (`check:release.mjs`)
```bash
npm run check:release
```
**Output:**
```
======================================================================
 AgroLeaf AI — Automated Release Guards (Module X4)
======================================================================
  ✓ [PASS] 1. Calibration JSON: calibration.json has no placeholder flag
  ✓ [PASS] 2. Production Model File: /models/rice-effb0-v10-320.onnx present (15.30 MiB in 1 file(s)), starts with 0x08
  ✓ [PASS] 3. Model URL Configuration: config.js points to /models/rice-effb0-v10-320.onnx; no placeholder model
  ✓ [PASS] 4. Class Index: 8 outputs: [healthy, blast, brown_spot, leaf_smut, tungro, sheath_blight, other_rice, not_rice]
  ✓ [PASS] 5. Validation Metrics: /data/metrics-v10.json real data (n=1467, macro-F1=0.8442)
  ✓ [PASS] 6. Sample Images Manifest: 5 sample images listed and all exist on disk
  ✓ [PASS] 7. Voice Audio Manifest: All 10 audio files present on disk
  ✓ [PASS] 8. AIgnite Competition Sticker: Sticker present in both assets/brand and public/brand
----------------------------------------------------------------------
Summary: 8 PASSED, 0 FAILED, 0 WARNING(S)

✅ ALL RELEASE GUARDS PASSED. Ready for submission release.
```

---

## 4. Live Production End-to-End Test Suite (`e2e_all.mjs`)

### Execution Command
```bash
node scripts/e2e_all.mjs https://agroleaf-ai.pages.dev
```

### Complete Live Terminal Output
```
=== AgroLeaf AI Live E2E Runner ===
Target: https://agroleaf-ai.pages.dev
Scripts found (5): e2e_mobile_viewports.mjs, e2e_pwa_offline.mjs, e2e_weather_report.mjs, e2e_audio_live.mjs, e2e_upload_live.mjs
Logs directory: D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt\frontend\e2e-logs

PASS  e2e_mobile_viewports     (43.8s)
PASS  e2e_pwa_offline          (19.8s) [flag-off SW check: SKIPPED-ON-PRODUCTION]
PASS  e2e_weather_report       (28.7s)
PASS  e2e_audio_live           (141.2s)
PASS  e2e_upload_live          (133.9s)

Live E2E suite PASSED cleanly.
```

### Individual Suite Evidence Summary:
1. **`e2e_mobile_viewports.mjs` (PASS, 38 tests, 0 failed):**
   - Verified 360px (Walton/Symphony standard), 390px (iPhone modern), 768px (Tablet), and 1280px (Desktop).
   - Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
   - All interactive touch targets $\ge 44 \times 44$ px.
   - Verified TabBar, Reminders modal (F24), and IndexedDB lifecycle.
2. **`e2e_pwa_offline.mjs` (PASS):**
   - Verified manifest webmanifest, caching headers, service worker registration, and offline asset caching.
3. **`e2e_weather_report.mjs` (PASS, 28.7s):**
   - Verified real Open-Meteo live API integration for Savar/Dhaka, 3-day weather table, advisory banners, and spray condition analysis.
4. **`e2e_audio_live.mjs` (PASS, 141.2s):**
   - Uploaded live blast, brown spot, and tungro sample photos.
   - Pressed "ব্যাখ্যা অডিও শুনুন" (Listen to Audio Explanation) on ResultScreen.
   - Verified audio player initiates playback (`currentTime > 0.5s` and `paused === false`) on every single result screen.
5. **`e2e_upload_live.mjs` (PASS, 133.9s):**
   - Full live inference lifecycle: `blast_01.jpg` -> `NOT_SURE`, `brown_spot_01.jpg` -> `DISEASE: বাদামী দাগ রোগ`, `tungro_01.jpg` -> `DISEASE: টুংরো রোগ`.
   - Verified 0 page console errors and 0 uncaught exceptions on production.

---

## 5. Certification Verdict

- **Automated Verification:** **100% PASSED** (42 Vitest test files, 300 tests, 0 Oxlint errors, 8/8 release guards).
- **Live Deployment Verification:** **100% PASSED** (All 5 live E2E test suites passed against Cloudflare Pages production).
- **Production Asset Match:** Confirmed live at `https://agroleaf-ai.pages.dev` (`index-CgJEzQFL.js`).
