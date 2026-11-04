# F30 Bangla NLP & Intent Engine Architecture
**AgroLeaf AI — Token-Aware Segmentation, Pronoun Disambiguation & Entity Extraction**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead Bangla NLP Engineer & Senior Software Architect

---

## 1. Executive Summary

The primary functional failure in F30 was traced to the NLP interpretation layer: raw substring matching (`query.includes(...)`) caused possessive pronouns like "আমার" (my) and pronouns like "আমি" (I) to match the out-of-domain food crop keyword "আম" (mango).

This document specifies the re-engineered **Bangla Agricultural NLP Engine**, introducing token-aware regex segmentation, phonetic alias normalization, multi-disease comparison routing, and Banglish transliteration parsing.

---

## 2. Core Architectural Pillars

```
             ┌──────────────────────────────────────────┐
             │ Raw Input: Spoken Transcript / Typed Text│
             └────────────────────┬─────────────────────┘
                                  │
             ┌────────────────────▼─────────────────────┐
             │ Stage 1: Unicode NFC & Punctuation Clean │
             └────────────────────┬─────────────────────┘
                                  │
             ┌────────────────────▼─────────────────────┐
             │ Stage 2: Token-Aware Word Boundary Split │
             └────────────────────┬─────────────────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    ▼                             ▼                             ▼
[Pronoun & Stopword Guard]  [Disease Entity Recognizer]   [Intent Classifier]
- "আমার" ≠ "আম"             - Multi-entity detection      - 12 Agricultural Intents
- "আমি" ≠ "আম"              - Canonical 8-class mapping   - Comparison detection
- "আমাদের" ≠ "আম"           - Phonetic & Banglish aliases - Action / Treatment
    │                             │                             │
    └─────────────────────────────┼─────────────────────────────┘
                                  │
             ┌────────────────────▼─────────────────────┐
             │ Stage 3: Priority-Weighted Arbitration   │
             │ 1. Out-of-Domain Guardrail (True Mango)  │
             │ 2. Disease Comparison (Dual Diseases)    │
             │ 3. Specific Pathogen Action / Treatment  │
             │ 4. Active Scan Context Resolution        │
             │ 5. Honest Agronomic Abstention           │
             └────────────────────┬─────────────────────┘
                                  │
             ┌────────────────────▼─────────────────────┐
             │ Final Structured Knowledge Answer in BN  │
             └──────────────────────────────────────────┘
```

---

## 3. Token-Aware Disambiguation Rules

### 3.1 Resolving the "আম" (Mango) vs "আমার" / "আমি" (My / I) Conflict
To correctly classify true out-of-domain questions about mangoes (e.g. "আম গাছে পোকা লেগেছে", "আমের ফলন বাড়াব কীভাবে") while never intercepting rice questions starting with "আমার" or "আমি":

1. **Token Boundaries:** Keywords are matched as complete, isolated lexical tokens using Unicode word boundaries:
   ```javascript
   const tokenPattern = new RegExp(`(^|\\s)${escapeRegex(keyword)}(\\s|[.,!?।]|$)`, 'i');
   ```
2. **Explicit Pronoun Whitelisting:**
   If a token begins with "আম", but is identified as:
   - "আমার" (my)
   - "আমি" (I)
   - "আমাদের" (our)
   - "আমারে" / "আমারো" (dialectal my)
   it is immediately tagged as a grammatical pronoun and excluded from the fruit/crop matcher.
3. **Compound Noun Context:**
   "আম" is recognized as mango only if followed by plant/crop context (e.g. "আম গাছ", "আমের", "আমবাগান", "কাঁচা আম", "পাকা আম") or if uttered as a standalone noun without rice references.

---

## 4. Disease Entity Recognition & Aliases

The disease extractor maps diverse spoken dialect variations, common spelling errors, and Banglish transliterations to canonical classifier classes:

| Canonical Key | Standard Bangla | Spoken / Phonetic / Dialectal Aliases | Banglish Transliterations |
|---|---|---|---|
| `blast` | ব্লাস্ট রোগ | ব্লাস্ট, ব্লাষ্ট, বলাস্ট, ব্লাস্ত, মাকু দাগ, শীষ ব্লাস্ট, পাতা ব্লাস্ট, ব্লাস্ট রোগ | blast, blast rog, maku dag, shish blast, pata blast |
| `brown_spot` | বাদামি দাগ রোগ | বাদামি দাগ, বাদামী দাগ, বাদামি ফোটা, তিলের মতো দাগ, বাদামি রোগ, ব্রাউন স্পট | brown spot, brownspot, badami dag, tiler moto dag |
| `leaf_smut` | লিফ স্মাট রোগ | লিফ স্মাট, লিফস্মাট, স্মাট, কালো দাগ, ছাই দাগ, ন্যারো ব্রাউন | leaf smut, leafsmut, smut, kalo dag, narrow brown |
| `tungro` | টুংরো রোগ | টুংরো, টুংগ্রো, টংরো, টুংরু, সবুজ পাতা ফড়িং রোগ, বেঁটে রোগ, হলুদ হওয়া | tungro, tungru, tongro, sobuj pata foring, bente rog |
| `sheath_blight` | খোলপোড়া রোগ | খোলপোড়া, খোল পোড়া, শীথ ব্লাইট, শীথব্লাইট, শিথ ব্লাইট, সাপের খোলস দাগ, কাণ্ডের খোল পচা | sheath blight, sheathblight, khol pora, kholpora, shith blight |
| `healthy` | সুস্থ ধান | সুস্থ, ভালো ধান, রোগমুক্ত, তাজা ধান, কোনো রোগ নেই, সুস্থ পাতা | healthy, bhalo dhan, shustho, rog mukto |
| `other_rice` | অন্যান্য সমস্যা | হিসপা, পামরি পোকা, গান্ধি পোকা, মাজরা পোকা, ব্যাকটেরিয়াল ব্লাইট, বিএলবি, পাতা ঝলসানো | hispa, pamri poka, majra, blb, bacterial blight |
| `not_rice` | ধানের পাতা নয় | আগাছা, শ্যামা ঘাস, মাটি, হাত, জুতো, পোকা | weed, non rice, ghas, mati, hat |

---

## 5. Multi-Disease Comparison Engine

When the NLP engine detects two distinct disease entities combined with comparison tokens (e.g. "পার্থক্য", "আলাদা", "difference", "comparison", "বনাম", "vs"):
- **Example Query:** `"ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?"`
- **Detected Entities:** `['blast', 'brown_spot']`
- **Detected Intent:** `comparison`
- **Output:** Formulates a direct comparative contrast highlighting lesion geometry (spindle-shaped ash-centered blast spots vs circular yellow-halo brown spots) and management differences.
