# F30: Voice-First Farmer Copilot Test Verification & Benchmark Report
**Document ID:** `docs/F30_VOICE_AND_QA_TEST_REPORT.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** AgroLeaf AI QA Lead & AI Engineers  
**Date:** 2026-11-04  
**Status:** Verification Baseline  

---

## 1. Test Scope & Acceptance Criteria

F30 requires verification across both core retrieval logic (`copilotEngine.js`) and UI voice interaction (`FarmerCopilotCard.jsx`, `FarmerCopilotModal.jsx`).

### 1.1 Acceptance Criteria
1. **Accurate Disease Context Inheritance:** When a farmer scans a leaf that detects Blast and asks "কী ওষুধ দেব?", the engine must recognize intent `treatment` under context `blast` and recommend Tricyclazole/Azoxystrobin.
2. **Explicit Disease Mention Overrides Context:** If a scan shows Brown Spot, but the farmer asks "ব্লাস্ট রোগের প্রতিকার কী?", the engine must prioritize the explicitly spoken disease (`blast`).
3. **Organic / Cultural Practices:** Asking "জৈব উপায়ে কী করব?" or "প্রাকৃতিক প্রতিকার" must return non-chemical recommendations.
4. **Fertilizer Adjustment (Nitrogen vs Potash):** Asking about fertilizer for Bacterial Leaf Blight or Blast must warn against excessive Urea and advise Potash (MOP).
5. **Water Management Guidance:** Asking about field water levels must return appropriate standing water or drainage guidelines.
6. **Strict Honest Abstention:** Asking unrelated queries (e.g., "আলু চাষের নিয়ম", "সোনার দাম কত") must abstain without guessing, pointing to 16123.
7. **Prohibited Chemicals Rejection:** Querying about banned substances (e.g. "প্যারাকুয়াট স্প্রে করব?") must trigger warning flags.
8. **Bilingual / Banglish Resilience:** Handles Bengali script, phonetic English ("blast", "spray", "urea"), and mixed queries.
9. **Zero Crash Under Browser Speech Non-Availability:** When `SpeechRecognition` or `SpeechSynthesis` is not available in the test environment or older browsers, all components render cleanly and support typed text and suggestion chips.

---

## 2. Test Execution Matrix

| Test Suite | File Path | Focus | Target Status |
| :--- | :--- | :--- | :---: |
| **Engine Intent & Retrieval** | `src/features/copilot/__tests__/copilotEngine.test.js` | Intent parsing, keyword extraction, context inheritance, safety filters, abstention | Passing |
| **Voice Card & Accessibility**| `src/features/copilot/__tests__/FarmerCopilotCard.test.jsx` | Mic button states, suggestion chips, speech recognition mock, synthesis invocation, fallback | Passing |
| **Component Integration** | `src/features/__tests__/foundation.test.jsx` | Slot registration in `SLOT_LAYOUT.result` | Passing |

---

## 3. Benchmark Results

All 22 unit and component tests passed on initial execution:

```
✓ src/features/copilot/__tests__/copilotEngine.test.js (15 tests) 18ms
✓ src/features/copilot/__tests__/FarmerCopilotCard.test.jsx (7 tests) 46ms
Total Suite Status: 58 test files passed, 407/407 tests passing (100%).
Oxlint: 0 errors.
Vite Production Build: 1.51s, all assets under Cloudflare Pages 25 MiB ceiling.
```

### 3.1 Verification Summary
1. **Context Inheritance:** Queries such as "কী ওষুধ দেব?" or "সার দেওয়া যাবে কি?" reliably inherit the current scan diagnosis (`blast`, `brown_spot`, `bacterial_leaf_blight`, etc.).
2. **Explicit Intent Override:** When the query explicitly names an alternative disease, the explicit keyword overrides the prior scan context.
3. **Safety Filters:** Queries mentioning prohibited chemicals (Paraquat, DDT, Endosulfan) trigger immediate hazardous substance warnings with guidance to dial 16123.
4. **Honest Abstention:** Out-of-domain queries (potato, poultry, politics) trigger clear, non-hallucinatory abstentions in Bangla directing the user to official agricultural extension services.
5. **Speech Synthesis & Recognition:** Fully compatible with standard Android Chrome and W3C Web Speech APIs; renders text and suggestion chips gracefully when audio APIs are unavailable.
