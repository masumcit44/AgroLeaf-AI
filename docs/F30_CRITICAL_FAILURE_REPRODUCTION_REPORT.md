# F30 Critical Failure Reproduction Report
**AgroLeaf AI — Voice Copilot Diagnostic Investigation**
**Date:** 2026-11-04  
**Status:** REPRODUCED & ISOLATED  
**Author:** Lead Bengali Speech AI Engineer & QA Lead

---

## 1. Executive Summary

During real-world farmer user testing of F30 (Farmer Copilot commit `7418bf3`), users reported that the voice assistant frequently misunderstood spoken Bangla, returned irrelevant answers, and in a critical incident displayed the prompt:
> **"আপনি 'আম' সম্পর্কে জানতে চেয়েছেন।"**

when the farmer was asking a question about their rice crop:
> **"আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?"**

This report documents the exact reproduction of this critical failure, traces the voice-to-answer pipeline, and isolates the root cause in the natural language processing and guardrail filtering layer.

---

## 2. Test Environment & Reproduction Protocol

- **Target Component:** `frontend/src/features/copilot/copilotEngine.js`
- **Execution Environment:** Node.js v24.18.1 / Chrome WebBrowser Runtime
- **Input Query:** `"আমার ধানে ব্লাস্ট হয়েছে"` (Farmer spoken transcript: "My paddy has blast")
- **Context:** Active disease scan = `null` or `'blast'`

### 2.1 Reproduction Code
```javascript
import { queryAgriculturalCopilot } from './copilotEngine.js';
const response = queryAgriculturalCopilot('আমার ধানে ব্লাস্ট হয়েছে');
console.log(response);
```

### 2.2 Actual System Output (Reproduced Exactly)
```json
{
  "intent": "out_of_domain_abstention",
  "diseaseKey": null,
  "titleBn": "ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা)",
  "textBn": "আপনি \"আম\" সম্পর্কে জানতে চেয়েছেন। এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে। অন্যান্য ফসলের সঠিক পরামর্শ পেতে কৃষি কল সেন্টারে ১৬১২৩ নম্বরে বিনামূল্যে কল করুন।",
  "voiceBn": "এগ্রোলিফ এআই বর্তমানে শুধু ধানের রোগ ও পরামর্শ দিতে পারে। অন্যান্য ফসলের তথ্যের জন্য দয়া করে কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন।",
  "isAbstention": true,
  "confidence": 0.95
}
```

---

## 3. Root Cause Analysis: The "আম" vs "আমার" / "আমি" Disaster

### 3.1 The Flawed Substring Filter
In `frontend/src/features/copilot/copilotEngine.js`, lines 201–216:
```javascript
// Out of Domain Non-Rice Guardrail Filter
for (const oodKw of OUT_OF_DOMAIN_KEYWORDS) {
  if (normalized.includes(oodKw)) {
    return {
      intent: 'out_of_domain_abstention',
      diseaseKey: null,
      titleBn: 'ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা)',
      textBn: `আপনি "${oodKw}" সম্পর্কে জানতে চেয়েছেন...`
    };
  }
}
```
And in `OUT_OF_DOMAIN_KEYWORDS`:
```javascript
const OUT_OF_DOMAIN_KEYWORDS = [
  'আলু', 'গম', 'ভুট্টা', 'পাট', 'আম', 'লিচু', ...
];
```

### 3.2 Linguistic & Unicode Mechanics
In the Bengali language:
- **"আম"** (`\u0986\u09ae`) represents the noun "mango".
- **"আমার"** (`\u0986\u09ae\u09be\u09b0`) is the 1st person possessive pronoun ("my / mine").
- **"আমি"** (`\u0986\u09ae\u09bf`) is the 1st person nominative pronoun ("I").
- **"আমাদের"** (`\u0986\u09ae\u09be\u09a6\u09c7\u09b0`) is the 1st person plural possessive ("our").

Because Javascript's `String.prototype.includes('আম')` performs an unsegmented character-sequence check:
- `"আমার ধানে ব্লাস্ট হয়েছে".includes("আম")` $\implies$ **`true`**
- `"আমার ধান কি সুস্থ?".includes("আম")` $\implies$ **`true`**
- `"আমি আবার কবে ছবি তুলব?".includes("আম")` $\implies$ **`true`**

**Impact:** Virtually every natural spoken query uttered by a Bangladeshi farmer begins with "আমার ধান..." or "আমি..."! As a direct consequence, **100% of these queries were immediately intercepted by the guardrail filter and rejected as questions about mangoes!**

---

## 4. Additional Failure Modes Identified in the Audit

1. **Missing Intent Keywords for Everyday Farmer Language:**
   `INTENT_LEXICON.treatment` lacked colloquial Bangla phrases like:
   - "কী করব" / "কি করব" (what to do)
   - "কী করণীয়" / "করণীয়" (action needed)
   - "উপায় কী" (what is the way/remedy)
   - "প্রতিকার" / "দমন" (cure / control)
   - Banglish: "ekhon ki korbo", "kivabe domon korbo"
   Even when queries did not contain "আমার", asking "কী করব" failed intent detection.

2. **Zero Support for Disease Comparison:**
   When a farmer asks:
   - "ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?" (What is the difference between Blast and Brown Spot?)
   The engine only extracted the first disease encountered in the loop (`blast`) and responded with fungicidal spray instructions for Blast, completely ignoring the comparison intent.

3. **Follow-Up Scan & Progression Gap:**
   Queries like "আমি আবার কবে ছবি তুলব?" (When should I take another photo?) or "পাতার দাগ বাড়ছে, কী করব?" (Leaf spots are increasing, what should I do?) had no matching intent mapping.

4. **16123 Helpline Free Claim:**
   The knowledge base claimed the 16123 helpline is "টোল-ফ্রি" (toll-free) and "বিনামূল্যে" (free). DAE tariff policies have varied across mobile operators. Under agricultural safety standards, this must be corrected to neutral verified phrasing.

---

## 5. Conclusion & Action Plan

The failure is completely isolated to rule-based token boundaries and lexicon coverage in `copilotEngine.js`. It does not require paid external APIs or complex cloud LLMs. It requires:
1. Strict token-aware word-boundary regex matching.
2. Distinct possessive/pronoun filtering preventing pronoun collisions.
3. Expanded agricultural intent and Banglish lexicon.
4. Disease comparison and follow-up scan handlers.
5. Absolute enforcement of the Bangla answer language lock.
