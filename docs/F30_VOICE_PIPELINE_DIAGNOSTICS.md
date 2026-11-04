# F30 Voice Pipeline Diagnostics Report
**AgroLeaf AI — End-to-End Voice-to-Answer Telemetry & Traceability**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead Voice AI Architect & Frontend Inference Engineer

---

## 1. Executive Summary

To guarantee complete transparency and diagnose where information degradation occurs, this document traces the 15 discrete stages of AgroLeaf AI's Voice-to-Answer Copilot pipeline.

```
[1. User Tap Microphone]
           ↓
[2. Browser Audio Capture & Permission]
           ↓
[3. Web Speech ASR / Local Speech Engine]
           ↓
[4. Raw Spoken Transcript]
           ↓
[5. Transcript Lifecycle Validation (End-of-Speech)]
           ↓
[6. Bangla & Banglish Normalization (NFC Unicode)]
           ↓
[7. Token-Aware Word Boundary Segmentation]
           ↓
[8. Out-of-Domain Guardrail Filter (Non-Rice Rejection)]
           ↓
[9. Disease Entity Recognition (8 Canonical Classes)]
           ↓
[10. Active Scan Context Resolution]
           ↓
[11. Agricultural Intent Classification (12 Intents)]
           ↓
[12. Grounded BRRI/DAE Knowledge Retrieval]
           ↓
[13. Agricultural Safety & Prohibited Chemical Validation]
           ↓
[14. Bangla Language Lock & Text Display]
           ↓
[15. Bengali Speech Synthesis (TTS Audio Playback)]
```

---

## 2. Stage-by-Stage Telemetry for Golden Benchmark Queries

### Case 1: Farmer asking for immediate action on Blast
- **1. Spoken Audio:** `"আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?"`
- **2. Recognition Engine:** Web Speech API (`SpeechRecognition`, `lang = 'bn-BD'`)
- **3. Raw Transcript:** `"আমার ধানে ব্লাস্ট হয়েছে এখন কি করব"`
- **4. Normalization:** Stripped punctuation, normalized Unicode NFC, lowercased.
- **5. Tokenization:** `['আমার', 'ধানে', 'ব্লাস্ট', 'হয়েছে', 'এখন', 'কি', 'করব']`
- **6. Out-of-Domain Check:** Evaluated tokens against Non-Rice list. `'আম'` token absent; `'আমার'` identified as possessive pronoun. **Passed (No false mango trigger).**
- **7. Entity Recognition:** `'ব্লাস্ট'` matches `blast` (`Magnaporthe oryzae`).
- **8. Context Resolution:** Explicit disease takes precedence over active scan.
- **9. Intent Detection:** `'এখন কি করব'` matches `treatment` / `action`.
- **10. Knowledge Retrieval:** Retrieved `AGRICULTURAL_KB.diseases.blast.treatment`.
- **11. Safety Check:** Contains approved active ingredients (Tricyclazole 75 WP / Azoxystrobin + Difenoconazole). Passed.
- **12. Display Text (Bangla):** `"ব্লাস্ট রোগ - অনুমোদিত ওষুধ ও দমন ব্যবস্থা: রোগের লক্ষণ দেখামাত্র প্রতি লিটার পানিতে ট্রাইসাইক্লাজোল ৭৫ ডব্লিউপি..."`
- **13. TTS Audio Output:** Spoken using `SpeechSynthesisUtterance` with `bn-BD` voice.

---

### Case 2: Farmer asking about mangoes (True Out-of-Domain)
- **1. Spoken Audio:** `"আম গাছে কী সার দেওয়া লাগবে?"`
- **2. Tokenization:** `['আম', 'গাছে', 'কী', 'সার', 'দেওয়া', 'লাগবে']`
- **3. Out-of-Domain Check:** Token `'আম'` matches non-rice crop `mango`.
- **4. Decision:** Guardrail triggered.
- **5. Output (Bangla):** `"আপনি 'আম' সম্পর্কে জানতে চেয়েছেন। এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে..."`

---

### Case 3: Farmer asking a Banglish query
- **1. Spoken Audio / Typed:** `"amar dhane blast hoise ekhon ki korbo"`
- **2. Tokenization:** `['amar', 'dhane', 'blast', 'hoise', 'ekhon', 'ki', 'korbo']`
- **3. Banglish Normalization:**
  - `amar` $\to$ possessive (not mango)
  - `blast` $\to$ `blast` disease
  - `ekhon ki korbo` $\to$ `treatment` intent
- **4. Output (Bangla):** Grounded Bangla Blast treatment instructions.

---

## 3. Diagnostics Matrix: Old vs Repaired Architecture

| Failure Symptom | Defective Stage in Commit `7418bf3` | Corrected Pipeline Stage in F30 Repair |
|---|---|---|
| Saying "আমার" triggers mango error | Substring `normalized.includes('আম')` in Guardrail stage | Token-boundary regex `(^|\s)আম($|\s|[েেরর])` with pronoun exception |
| Asking "কী করব" fails intent matching | `INTENT_LEXICON.treatment` lacked action verbs | Added `কী করব`, `করণীয়`, `উপায়`, `প্রতিকার`, `দমন`, `ki korbo` |
| Disease comparison query returned Blast | Disease loop returned first match | Added dedicated `comparison` intent parsing multiple disease tokens |
| English answers on Bangla interface | No language lock enforcing Bangla text | Strict language lock validator: all answers coerced to Bengali templates |
| Voice playback silence | No fallback when Bengali TTS voice missing | Audio unavailable badge + clean readable text fallback |
