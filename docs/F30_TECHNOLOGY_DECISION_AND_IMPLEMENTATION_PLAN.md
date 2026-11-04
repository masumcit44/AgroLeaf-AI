# F30 Technology Decision & Implementation Plan
**AgroLeaf AI — Architectural Blueprint for Voice-First Farmer Copilot Repair**
**Date:** 2026-11-04  
**Status:** APPROVED & SCHEDULED  
**Author:** Lead Software Architect & Chief AI Engineer

---

## 1. Architectural Decisions Summary

Based on rigorous empirical research and failure reproduction, the following architectural decisions are locked:

1. **ASR Engine: Hybrid Native Web Speech API (`bn-BD`)**
   - Instant startup (< 50 ms), zero model download bloat (0 MB vs 100+ MB for WASM), native mobile hardware acceleration, 100% free with zero cloud bills.
2. **Post-Processing: Token-Aware Regex & Linguistic Segregation**
   - Full migration away from substring `includes()` matching.
   - Distinct classification of pronouns ("আম" $\neq$ "আমার" / "আমি" / "আমাদের").
   - Multi-token entity extraction and Banglish stem mapping.
3. **Intent Engine: Priority-Weighted Multi-Intent Classifier**
   - 14 agricultural intents covering treatment, fertilizer, water, spread, symptoms, organic, comparison, follow-up scan, and safety.
4. **Knowledge Grounding: BRRI / DAE Evidence-Locked KB**
   - 100% grounded in official Bangladeshi extension protocols.
   - Removal of misleading "free / toll-free" claims for helpline 16123.
5. **Language Lock: 100% Bangla Enforcement in Bangla Mode**
   - Complete elimination of English leaks in UI and audio.
   - Rejection of English fallback messages.

---

## 2. Implementation Work Breakdown Structure (WBS)

### Task 1: Update `agricultural_kb.js`
- Harmonize disease entities with canonical 8-class ontology (`healthy`, `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`, `other_rice`, `not_rice`).
- Add comparisons (`blast_vs_brown_spot`, `blast_vs_sheath_blight`).
- Add follow-up scan guidance (`follow_up_scan`).
- Update helpline 16123 phrasing to neutral verified wording.

### Task 2: Rebuild `copilotEngine.js`
- Implement `normalizeQuery()` with Unicode NFC and punctuation stripping.
- Implement token-aware `isOutOfDomain()` with pronoun guardrail ("আম" $\neq$ "আমার").
- Implement `detectExplicitDiseases()` returning all matching disease entities.
- Implement `detectIntent()` with expanded action keywords (`কী করব`, `প্রতিকার`, `দমন`, `ki korbo`).
- Add disease comparison handler (`comparison`).
- Add follow-up scan handler (`follow_up_scan`).
- Enforce Bangla language lock on all returned payloads.

### Task 3: Upgrade `voiceService.js`
- Enhance `selectBestBengaliVoice()` with tiered fallback.
- Suppress audio playback when no Bengali voice exists (preventing English phonetic gibberish).
- Add error mapping with polite Bangla messages.

### Task 4: Enhance `FarmerCopilotCard.jsx`
- Add transcript quality validator (prevents answering premature incomplete phrases).
- Add confirmation modal ("আপনি কি বলতে চেয়েছেন?") for ambiguous transcripts.
- Ensure all states, error banners, and buttons render in pure Bangla when `lang === 'bn'`.
- Update helpline tariff text.

### Task 5: Testing & QA Validation
- Write comprehensive Vitest test suite (`copilotEngine.test.js` & `FarmerCopilotCard.test.jsx`) covering all 35 golden benchmark questions.
- Verify 100% test pass rate and clean build.
