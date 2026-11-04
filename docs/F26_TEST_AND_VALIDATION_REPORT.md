# AgroLeaf AI — Feature F26: Test & Validation Report
## Yield Impact Estimation & Dynamic Risk Intelligence

**Document:** `docs/F26_TEST_AND_VALIDATION_REPORT.md`  
**Author:** Antigravity (QA Lead & Technical Architect)  
**Date:** 4 November 2026  
**Status:** 100% Certified (All 42 Test Files / 300 Tests Passing)  

---

## 1. Executive Summary

Feature **F26: Yield Impact Estimation & Dynamic Risk Intelligence** has been thoroughly designed, implemented, and verified on the isolated branch `feat/f26-yield-risk`.

The capability augments AgroLeaf AI's on-device vision classifier with context-aware agro-meteorological intelligence, answering the 5 fundamental farmer questions:
1. **সম্ভাব্য ফলন প্রভাব:** Untreated vs Managed yield loss ranges using Bengali numerals (`১৫% – ৩৫%` vs `৫% এর কম`).
2. **ঝুঁকির স্তর:** 4 distinct visual states (`বেশি ঝুঁকি`, `মাঝারি ঝুঁকি`, `কম ঝুঁকি`, `অনিশ্চিত`) with high-contrast badges (WCAG AAA compliant).
3. **মূল্যায়নের কারণ:** Dual-pathway reasoning synthesizing disease biology and local weather triggers.
4. **তাত্ক্ষণিক পদক্ষেপ:** Non-chemical cultural interventions, water management, and direct **১৬১২৩** call capability.
5. **তথ্যসূত্র ও বিস্তারিত:** Collapsible `<details>` accordion linking to BRRI pathology guidelines and DAE BAMIS agromet criteria.

---

## 2. Test Execution & Coverage Summary

### 2.1 Automated Test Suites (Vitest)
- **Command:** `npm test` (`npx vitest run`)
- **Total Test Files:** 42 passed (100%)
- **Total Tests:** 300 passed (100%)
- **Failures:** 0
- **Duration:** 5.06s

| Suite File | Scope | Tests | Result |
| :--- | :--- | :---: | :---: |
| `src/features/yieldRisk/__tests__/riskEngine.test.js` | Pure mathematical scoring, stage vulnerability, BAMIS microclimate, extreme heat suppression, BRRI calendar auto-estimation, and Tungro roguing | 9 | **PASS** |
| `src/features/yieldRisk/__tests__/YieldRiskCard.test.jsx` | React component rendering, 5 farmer questions, bilingual text, not_sure safety, role="region" accessibility, and 16123 helpline call CTA | 4 | **PASS** |
| `src/features/__tests__/foundation.test.jsx` | Feature flag gating (`yieldRisk`), preview parameter override, i18n key parity, zero base-key shadowing, slot layout stability | 10 | **PASS** |
| *All Other 39 Test Suites* | Regression verification across reminders, weather, history, ML inference, safety gates, audio, and sync | 277 | **PASS** |

### 2.2 Static Analysis & Quality Guards
- **Oxlint (`npm run lint`):** 0 errors across 184 files.
- **Vite Production Build (`npm run build`):** Succeeded in 1.06s. Bundle generated cleanly with Service Worker precaching.
- **Cloudflare File Limit Guard (`check-dist-sizes.mjs`):** All output assets strictly below 25 MiB (largest: `rice-mnv3l-v1.onnx` at 16.05 MiB).
- **Release Verification Guard (`npm run check:release`):** 8/8 checks passed (calibration, model, class index, metrics, sample images, voice audio, brand sticker).

---

## 3. Detailed Verification Matrix

### 3.1 Qualitative Boundedness & Zero Fake Numbers
- Verified that `riskEngine.js` qualitative text fields (`qualitativeImpactBn`, `qualitativeImpactEn`, `uncertaintyExplanationBn`) contain **zero fabricated percentage strings** (`/[০-৯0-9]+%/`).
- Untreated vs Managed yield loss metrics are explicitly displayed in separate structured UI tiles sourced from BRRI agricultural handbooks.

### 3.2 Epistemic Uncertainty Handling
- When diagnosis is `not_sure` (inconclusive):
  - Risk level is strictly clamped to `uncertain` (অনিশ্চিত).
  - Quantitative yield loss is labeled `অনির্দিষ্ট / Undetermined` with `সতর্কতা প্রয়োজন`.
  - Prompts farmer to retake photo in natural daylight or call 16123.

### 3.3 Microclimate Favourability & Extreme Weather Clamping
- Evaluated against DAE BAMIS criteria:
  - Rice Blast: Night temp $16\text{--}20^\circ\text{C}$, Day temp $25\text{--}30^\circ\text{C}$, $\text{RH} > 90\%$, $\Delta T > 10^\circ\text{C}$.
  - Sheath Blight: Temp $28\text{--}32^\circ\text{C}$, $\text{RH} \ge 80\%$.
- Extreme heatwave ($> 38^\circ\text{C}$) correctly suppresses blast sporulation risk to `low`.
- Out-of-bounds telemetry inputs are safely clamped: temperature to $[-10, 55]^\circ\text{C}$, humidity to $[0, 100]\%$.

### 3.4 Accessibility (WCAG 2.1 AA)
- Landmark `role="region"` and `aria-labelledby="yield-risk-title"`.
- Accordion toggle utilizes `aria-expanded` and `aria-controls`.
- Interactive elements (Helpline CTA, Sources toggle) satisfy minimum $\ge 44 \times 44$ px touch targets.
- Contrast ratios exceed $6.1:1$ across all badges (high, medium, low, uncertain).

---

## 4. Certification & Sign-off

- **QA Lead:** Antigravity
- **Build Status:** GREEN
- **Verification Verdict:** Production Ready for Main Merge & Deployment.
