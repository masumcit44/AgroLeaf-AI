# F30: Voice Copilot Post-Repair QA & Regression Report
**Document ID:** `docs/F30_VOICE_QA_AND_REGRESSION_REPORT.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** Lead Bengali Speech AI Engineer, Senior QA Lead & Agricultural Software Architect  
**Date:** 2026-11-04  
**Branch:** `feat/f30-voice-copilot-repair`  
**Status:** FULLY VERIFIED & PASSING (50/50 Copilot Tests, 442/442 Full Test Suite)  

---

## 1. Executive Summary

Following user feedback on production deployment `7418bf3`, a deep diagnostic audit identified a critical P0 linguistic bug:
In standard Bengali Unicode, the prefix of 1st-person pronouns (`"আমার"`, `"আমি"`, `"আমাদের"`) is `"আম"` (`\u0986\u09ae`), which collided with an out-of-domain substring filter for mango (`"আম"`). As a result, 100% of natural farmer queries starting with "আমার ধানে..." were mistakenly rejected with an out-of-domain mango abstention notice.

This QA and Regression Report documents the comprehensive verification of all repairs:
1. **P0 Unicode Prefix Collision Eliminated:** Token boundary checking and negative lookahead for 1st-person pronouns ensures `"আমার ধানে ব্লাস্ট হয়েছে"` is correctly parsed as `blast` + `treatment`.
2. **35 Golden Benchmark Questions:** 100% pass rate across disease treatments, colloquial queries ("কী করব", "উপায় কী"), comparisons, progression, organic management, safety protocols, and out-of-domain abstentions.
3. **Bangla Response Language Lock:** 100% of farmer responses are in natural, simple Bengali grounded in BRRI/DAE protocols.
4. **TTS Anti-Gibberish Suppression:** On browsers or OS distributions lacking a native Bengali voice, English TTS fallback is strictly blocked, displaying a clean Bengali reading card instead.
5. **Verified Helpline Tariff Phrasing:** The unverified claim of 16123 being "free" has been corrected to neutral advisory text.

---

## 2. Benchmark Evaluation: 35 Golden Farmer Questions

Every query was evaluated against the updated `queryAgriculturalCopilot` engine:

| # | Spoken/Typed Query (Bengali/Banglish) | Active Scan Context | Detected Disease | Detected Intent | Grounded Protocol | Pass/Fail |
|---|---|---|---|---|---|---|
| 1 | "আমার ধানে ব্লাস্ট রোগ হয়েছে, এখন কী করব?" | None | blast | treatment | Tricyclazole / Azoxystrobin spray | **PASS** |
| 2 | "ব্লাস্ট রোগের ওষুধ কী?" | None | blast | treatment | Tricyclazole 75 WP (Trooper / Nativo) | **PASS** |
| 3 | "কী স্প্রে করব?" | blast | blast (inherited) | treatment | Tricyclazole / Azoxystrobin (5g/10L) | **PASS** |
| 4 | "কী ওষুধ দেব?" | brown_spot | brown_spot (inherited) | treatment | Mancozeb / Propiconazole | **PASS** |
| 5 | "এখন কী করব?" | sheath_blight | sheath_blight (inherited) | treatment | Hexaconazole / Validamycin | **PASS** |
| 6 | "উপায় কী?" | tungro | tungro (inherited) | treatment | Green Leafhopper vector control | **PASS** |
| 7 | "প্রতিকার বলুন" | leaf_smut | leaf_smut (inherited) | treatment | Clean seed / Mancozeb | **PASS** |
| 8 | "আমার ধানের পাতায় বাদামি দাগ কেন?" | None | brown_spot | symptoms | Bipolaris oryzae fungal spots | **PASS** |
| 9 | "ব্লাস্ট আর বাদামি দাগের মধ্যে পার্থক্য কী?" | None | blast, brown_spot | comparison | Spindle lesion vs circular brown spots | **PASS** |
| 10 | "ব্লাস্ট আর খোল পোড়ার পার্থক্য কী?" | None | blast, sheath_blight | comparison | Leaf blade vs leaf sheath waterline | **PASS** |
| 11 | "পাতার দাগ বাড়ছে, কী করব?" | blast | blast (inherited) | progression | Secondary spread protocol | **PASS** |
| 12 | "আমি আবার কবে ছবি তুলব?" | blast | blast (inherited) | follow_up_scan | 3 to 5 days rescan schedule | **PASS** |
| 13 | "ami abar kobe photo tulbo" | blast | blast (inherited) | follow_up_scan | 3 to 5 days rescan schedule | **PASS** |
| 14 | "কী সার দেওয়া যাবে?" | blast | blast (inherited) | fertilizer | Stop Urea, apply Potash (MOP) | **PASS** |
| 15 | "ইউরিয়া সার দেব?" | blast | blast (inherited) | fertilizer | Urea suspension caution | **PASS** |
| 16 | "পটাশ সার দেওয়া যাবে?" | blast | blast (inherited) | fertilizer | Split MOP application advice | **PASS** |
| 17 | "জমি শুকিয়ে ফেলব না পানি রাখব?" | blast | blast (inherited) | water | Maintain 2-3 inch standing water | **PASS** |
| 18 | "পানি নামিয়ে দেব?" | sheath_blight | sheath_blight (inherited) | water | Drain standing water to reduce humidity | **PASS** |
| 19 | "জৈব উপায়ে প্রতিকার কী?" | blast | blast (inherited) | organic | Trichoderma / Neem extract | **PASS** |
| 20 | "কীভাবে ছড়ায়?" | blast | blast (inherited) | spread | Airborne windborne conidia spores | **PASS** |
| 21 | "এই রোগ কীভাবে আটকাব?" | blast | blast (inherited) | prevention | Clean seed, balanced N-K ratio | **PASS** |
| 22 | "আবহাওয়া কেমন থাকলে রোগ বাড়ে?" | blast | blast (inherited) | weather | Foggy mornings, high humidity (>90%) | **PASS** |
| 23 | "ওষুধ দেওয়ার সময় কি মাস্ক পরা লাগবে?" | blast | blast (inherited) | safety | Mask, gloves & protective clothing | **PASS** |
| 24 | "কী সাবধানতা অবলম্বন করব?" | blast | blast (inherited) | safety | Spray downwind, keep away from kids | **PASS** |
| 25 | "আমার ধান কি সুস্থ?" | None | healthy | treatment | No disease detected; monitor field | **PASS** |
| 26 | "১৬১২৩ কী?" | None | None | helpline | Krishi Call Centre official contact | **PASS** |
| 27 | "কৃষি অফিসারের নম্বর কত?" | None | None | helpline | DAE Krishi Call Centre 16123 | **PASS** |
| 28 | "blast er osudh ki" | None | blast | treatment | Tricyclazole / Azoxystrobin (Banglish) | **PASS** |
| 29 | "ki osudh debo" | blast | blast (inherited) | treatment | Tricyclazole (Banglish transliteration) | **PASS** |
| 30 | "আমার ধানের পাতায় দাগ দেখা যাচ্ছে" | None | brown_spot | treatment | Leaf spot diagnosis & Mancozeb | **PASS** |
| 31 | "আমার" (isolated single token) | None | None | confirmation | Asks farmer to complete query | **PASS** |
| 32 | "আম গাছে পোকা লেগেছে" | None | None | honest_abstention | Abstains on mango; redirects to 16123 | **PASS** |
| 33 | "মুরগির রোগ কীভাবে সারাব?" | None | None | honest_abstention | Abstains on poultry; redirects to 16123 | **PASS** |
| 34 | "আলুর ব্লাইট কীভাবে দমন করব?" | None | None | honest_abstention | Abstains on potato; redirects to 16123 | **PASS** |
| 35 | "asdfghjkl" (unintelligible noise) | None | None | honest_abstention | Safe abstention; prompts rice question | **PASS** |

**Benchmark Accuracy: 35 / 35 (100.0%)**

---

## 3. Unit & Integration Test Suite Verification

### 3.1 Copilot Feature Tests
Command executed: `npx vitest run src/features/copilot/`
```
 RUN  v5.0.5 D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt/frontend

 ✓ src/features/copilot/__tests__/copilotEngine.test.js (43 tests) 57ms
 ✓ src/features/copilot/__tests__/FarmerCopilotCard.test.jsx (7 tests) 31ms

 Test Files  2 passed (2)
      Tests  50 passed (50)
   Duration  507ms
```

### 3.2 Full Project Regression Test
Command executed: `npm test`
```
 RUN  v5.0.5 D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt/frontend

 Test Files  59 passed (59)
      Tests  442 passed (442)
   Duration  5.77s
```
**Zero regressions detected across all 59 test suites.**

---

## 4. Static Code Quality & Production Build Verification

### 4.1 Oxlint Static Analysis
Command executed: `npm run lint`
- **Result:** `0 errors, 35 warnings` across 232 files.
- All copilot files (`copilotEngine.js`, `FarmerCopilotCard.jsx`, `voiceService.js`, `i18n.js`) have **0 errors**.

### 4.2 Production Bundle Build & Asset Ceilings
Command executed: `npm run build`
```
vite v8.3.5 building client environment for production...
✓ 162 modules transformed.
dist/index.html                                        2.19 kB │ gzip:     0.92 kB
dist/assets/ort-wasm-simd-threaded-qh98TCA_.wasm  14,848.85 kB │ gzip: 3,878.24 kB
dist/assets/index-CNL757q9.css                        77.71 kB │ gzip:    12.81 kB
dist/assets/index-DqJkNTTm.js                        846.19 kB │ gzip:   235.73 kB

PWA v2.0.0: precache 42 entries (2178.00 KiB)

[check-dist-sizes] Checking dist file sizes against Cloudflare Pages 25 MiB ceiling...
[check-dist-sizes] ✓ OK: assets/ort-wasm-simd-threaded-qh98TCA_.wasm (14.16 MiB < 25 MiB)
[check-dist-sizes] ✓ OK: models/rice-effb0-v10-320.onnx (15.34 MiB < 25 MiB)
[check-dist-sizes] All assets verified under Cloudflare 25 MiB limit.
```

---

## 5. UI/UX & Voice Verification Matrix

| Verification Area | Requirement | Observed Behavior | Status |
|---|---|---|---|
| **Microphone Touch Target** | Minimum 48px $\times$ 48px touch target | 80px $\times$ 80px (`w-20 h-20 sm:w-24 sm:h-24`), centered with pulse ring | **VERIFIED** |
| **Pulsing Animation** | Visual feedback when listening/speaking | `animate-ping` (red) on listening; `animate-pulse` (leaf) on speaking | **VERIFIED** |
| **Incomplete Input Handling** | Confirmation card for single ambiguous words | "আপনি কি বলতে চেয়েছেন? [হ্যাঁ, উত্তর দিন] [আবার বলুন]" | **VERIFIED** |
| **TTS Anti-Gibberish** | No English phoneme rendering of Bengali text | Enforced `selectBestBengaliVoice()`; displays text alert if no Bengali voice | **VERIFIED** |
| **Helpline 16123 Notice** | Neutral rate disclaimer | "কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন (কলের বর্তমান চার্জ আগে যাচাই করুন)" | **VERIFIED** |
| **Fallback Typing Drawer** | Typing option available if voice is disabled | Expandable drawer with `⌨️ অথবা বাংলায়/Banglish-এ লিখুন` and submit form | **VERIFIED** |

---

## 6. Sign-off & Recommendation

All P0 and functional defects in F30 have been rigorously resolved and validated. The engine is grounded in BRRI/DAE agronomic data, completely free of external API fees, resilient to dialectal Bengali and Banglish transliterations, and passes all 50 feature tests and 442 application tests.

**F30 Voice-First Farmer Copilot is declared READY for Candidate Deployment and Master Execution Roadmap resumption.**
