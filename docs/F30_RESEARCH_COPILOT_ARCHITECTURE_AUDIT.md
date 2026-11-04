# F30: Research Copilot & Personal Farming Planner Architecture Audit
**Document ID:** `docs/F30_RESEARCH_COPILOT_ARCHITECTURE_AUDIT.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Lead Software Architect, Agricultural Knowledge Engineer & Senior Frontend Architect  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** ARCHITECTURAL AUDIT & SPECIFICATION  

---

## 1. Executive Summary & Purpose

The existing F30 ("Voice-First Farmer Copilot") was originally designed as a voice-first Q&A interface that answered rice leaf disease inquiries using a static local knowledge base.

While effective for immediate post-scan disease questions (e.g. *"আমার ধানে ব্লাস্ট রোগ হয়েছে, কী করব?"*), real-world farming requires far more than fixed single-turn chatbot answers. Bangladeshi rice farmers frequently require:
1. **End-to-End Cultivation Guidance:** *"আমি আজ BRRI dhan28-এর চারা রোপণ করেছি। এখন থেকে ধান কাটা পর্যন্ত আমার কী কী করতে হবে?"*
2. **Dynamic Fertilizer & Nutrient Scheduling:** *"আমার জমিতে ইউরিয়া দেব, নাকি পটাশ দেব? কোন পর্যায়ে কী সার দেওয়া দরকার?"*
3. **Integrated Pest, Weed, and Water Management:** *"চারা রোপণ শেষ। এখন পানি, সার এবং আগাছা কীভাবে ম্যানেজ করব?"*
4. **Personalized Farming Roadmaps:** Staged, calendar-mapped activity timelines tailored to the farmer's specific variety, season, planting date, and region.

This document audits the existing F30 codebase, identifies architectural bottlenecks, and defines the transition from a **static Q&A chatbot** into a **live agricultural research assistant and personal farming planner**, operating strictly within AgroLeaf's **Zero-Cost Technology Policy**.

---

## 2. Audit of Existing F30 Implementation

### 2.1 File Inventory & Responsibilities
| File Path | Current Role | Strengths | Architectural Deficiencies for Planner |
|---|---|---|---|
| `frontend/src/features/copilot/copilotEngine.js` | Deterministic intent parsing & static retrieval | Resilient Unicode normalization, pronoun boundary checks, zero-cost execution | Only returns fixed static strings from `agricultural_kb.js`; cannot generate custom multi-week roadmaps or fetch external updates |
| `frontend/src/features/copilot/FarmerCopilotCard.jsx` | Voice & card component | Large 80px mic button, visual pulse states, confirmation drawer | Text input is hidden behind a drawer; lacks multi-section roadmap rendering; no save/export actions; no F24 reminder integration |
| `frontend/src/features/copilot/CopilotPage.jsx` | Standalone `/copilot` route | Clean responsive wrapper with BRRI/DAE footer | Bare container; lacks tabbed view for saved plans vs active research planner |
| `frontend/src/features/copilot/voiceService.js` | Web Speech API wrapper | Native Bengali voice priority, anti-gibberish suppression | Only reads single brief strings; does not support section-specific reading or plan summaries |
| `frontend/src/features/copilot/data/agricultural_kb.js` | Static agronomic dictionary | Grounded BRRI protocols for 8 canonical classes | Static dataset limited to disease treatment, symptom descriptions, and general fertilizer cautions |
| `frontend/src/features/profile/cropCalendarEngine.js` | Crop calendar stages generator | Evidence-based 8-stage timeline based on BRRI/BAMIS | Isolated inside Profile feature; not utilized by Copilot conversational interface |
| `frontend/src/features/reminders/remindersStore.js` | F24 reminder scheduler | IndexedDB persistence, due date tracking, zero-cost | Completely disconnected from Copilot recommendations |

### 2.2 Key Findings & Gaps
1. **Static vs Dynamic Knowledge:** The current system relies on a hardcoded static dictionary. If a farmer asks about a newer variety (e.g. BRRI dhan89, BRRI dhan104), specific transplanting dates, or integrated fertilizer split-dosing, the chatbot returns either a generic summary or an abstention.
2. **Hidden Text Input UX:** Smallholder farmers who prefer typing or whose microphones have hardware issues find the text input tucked inside an expandable drawer with small text. Text input must be prominent and co-equal with voice.
3. **No Saveable Artifacts:** When the copilot provides advice, the farmer cannot save it as a reference plan for their growing season. If they refresh or navigate away, the response is lost.
4. **Disconnection from F24 Reminders:** The copilot cannot push scheduled care tasks (e.g. *"First Urea Top-Dressing at 18 DAT"*) into the farmer's reminder schedule.
5. **Lack of Live Information Retrieval:** The existing architecture has zero capability to query authoritative external agricultural portals (BRRI Rice Profile, DAE BAMIS, BARC Crop Zoning).

---

## 3. The New Research & Planning Architecture

```
                                  [ Farmer Input ]
                           (Spoken Bangla or Typed Text)
                                         │
                                         ▼
                   [ 1. Unified Multimodal Composer & Voice ASR ]
                                         │
                                         ▼
                     [ 2. Conversational Intent & Topic Classifier ]
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Single-Turn FAQ / Context ]                 [ Complex Research / Plan Query ]
                 │                                               │
                 ▼                                               ▼
     [ Static Guardrail & Cache ]                 [ 3. Progressive Clarification ]
                                                  (Resolves Variety, Season, Date, Area)
                                                                 │
                                                                 ▼
                                                  [ 4. Research Query Formulator ]
                                                                 │
                                                                 ▼
                                                  [ 5. Dynamic Retrieval Engine ]
                                                  ├── BRRI Rice Profile (Varieties/Care)
                                                  ├── DAE BAMIS (Agro-climatic Calendars)
                                                  ├── BARC FRG (Fertilizer Guidelines)
                                                  └── IRRI Rice Knowledge Bank
                                                                 │
                                                                 ▼
                                                  [ 6. Evidence Registry & Verifier ]
                                                  (Cross-references sources & timestamps)
                                                                 │
                                                                 ▼
                                                  [ 7. Personalized Roadmap Builder ]
                                                  (Chronological stages, dates, & tasks)
                                                                 │
                                                                 ▼
                                                  [ 8. Dual-Layer Presentation ]
                                                  ├── Full Structured Written Report
                                                  └── Concise Spoken Bangla Summary
                                                                 │
                                                                 ▼
                                                  [ 9. Plan Persistence & F24 Action ]
                                                  ├── Save Plan to IndexedDB
                                                  └── 1-Tap "স্মরণবার্তা চালু করুন"
```

---

## 4. Architectural Component Specifications

### 4.1 Unified Multimodal Composer
- **Voice:** Accessible 80px mic button with Web Speech API integration (`bn-BD` $\to$ `bn-IN` $\to$ `bn`).
- **Text:** Always-visible, prominent input bar with Bangla, Banglish, and English placeholder: `"আপনার ধান চাষ বা সমস্যার কথা লিখুন বা বলুন..."`
- **Confirmation Drawer:** Safeguards against ambiguous single tokens (e.g., standalone `"আমার"`).

### 4.2 Progressive Clarification Engine
Rather than presenting low-literacy farmers with intimidating multi-field forms, the engine asks only the single missing critical datum:
- If a complete roadmap is requested but variety is unknown: *"আপনি কোন জাতের ধান চাষ করছেন? (যেমন: ব্রি ধান২৮, ব্রি ধান২৯)"*
- If fertilizer dosage is requested but land size is unknown: *"আপনার জমির পরিমাণ কত? (যেমন: ৩৩ শতক বা ১ বিঘা)"*
- If the farmer cannot answer, the engine proceeds using verified regional defaults and explicitly marks assumptions in the generated plan.

### 4.3 Sustainable Zero-Cost Internet Retrieval Engine
Under the Free-Only Policy:
- **Client/Server Hybrid:** Utilizes Cloudflare Pages Functions (`/api/v1/copilot/research`) with edge caching (24-hour cache for variety and stage profiles) and client-side IndexedDB caching.
- **Direct Authoritative Endpoints:**
  1. **BRRI Rice Profile:** `https://riceprofile.brri.gov.bd/`
  2. **DAE BAMIS:** `https://www.bamis.gov.bd/en/calendar`
  3. **BARC Crop Zoning & FRG:** `https://portal.cropzoning.gov.bd/` & `https://barc.gov.bd/`
  4. **IRRI Rice Knowledge Bank:** `http://www.knowledgebank.irri.org/`
- **Resilient Fallback Cache:** High-fidelity structured snapshots of BRRI variety catalogues and BARC fertilizer matrices bundled into client assets (`public/data/agricultural_research_bundle.json`) so research queries never fail if external government servers experience downtime or connectivity issues.

### 4.4 Personalized A-to-Z Crop Roadmap Builder
Integrates the farmer's stated planting date with variety duration metrics:
- Calculates exact stage boundaries (Seedbed, Establishment, Tillering, Panicle Initiation, Flowering, Grain Filling, Maturity).
- Generates actionable, dated tasks:
  - Day 0 to 7: Water level maintenance (2–3 cm) and seedling survival monitoring.
  - Day 15 to 20: 1st Urea top-dressing & weeding.
  - Day 35 to 45: 2nd Urea top-dressing & Alternate Wetting and Drying (AWD).
  - Day 60 to 75: Panicle initiation, 3rd Urea top-dressing, blast & stem borer scouting.
  - Day 120 to 155: Final drainage, 80% grain golden ripening check, harvest prep.

### 4.5 Saveable Agricultural Plans & F24 Reminder Integration
- **Storage:** Saved locally to IndexedDB under store `plans` with full schema (ID, question, creation timestamp, variety, season, roadmap tasks, sources, and user notes).
- **F24 Scheduler:** Each roadmap task features an interactive `"⏰ স্মরণবার্তা চালু করুন"` button that directly calls `saveReminder()` from `remindersStore.js`, creating an active reminder on the farmer's device.

---

## 5. Audit Conclusion & Clearances

The audit confirms that the existing F30 voice and NLP infrastructure provides a solid foundation, while the surrounding architecture requires significant expansion to support live research, progressive clarification, chronological roadmap generation, and persistent plan storage.

**Recommendation:** Proceed immediately to implement the Research Copilot and Personal Farming Planner in modular stages without disturbing existing scan-result workflows.
