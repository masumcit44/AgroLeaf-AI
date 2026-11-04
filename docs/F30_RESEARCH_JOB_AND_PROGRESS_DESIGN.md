# F30: Research Job & Asynchronous Progress Design
**Document ID:** `docs/F30_RESEARCH_JOB_AND_PROGRESS_DESIGN.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Lead Systems Architect & Senior Frontend UX Engineer  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** ARCHITECTURAL LIFECYCLE SPECIFICATION  

---

## 1. Executive Summary

Agricultural research and multi-stage crop planning require evaluating multiple agronomic parameters (variety maturity curves, agro-ecological weather patterns, split-fertilizer rates, pest scouting calendars). Depending on device network speed and external cache status, this process can take between **1.2 to 4.5 seconds**.

Blocking the farmer with a generic, unresponsive full-screen spinner creates cognitive anxiety and prompts premature page refreshes. F30 implements an **Asynchronous Staged Research Engine** with transparent, authentic progress milestones in simple Bangla.

---

## 2. Research Job State Machine

```
                      [ Farmer Submits Query (Voice or Text) ]
                                         │
                                         ▼
                            State: SUBMITTED (0.0s)
                                         │
                                         ▼
                     State: ANALYZING_QUESTION (0.2s - 0.4s)
                        "আপনার প্রশ্নটি বুঝে নিচ্ছি..."
                                         │
                                         ▼
                     State: RETRIEVING_SOURCES (0.5s - 1.8s)
                         "বিশ্বস্ত কৃষি তথ্য খুঁজছি..."
                                         │
                                         ▼
                     State: VERIFYING_SOURCES (1.8s - 2.8s)
                 "BRRI, DAE ও প্রাসঙ্গিক গবেষণা যাচাই করছি..."
                                         │
                                         ▼
                      State: GENERATING_PLAN (2.8s - 3.8s)
                    "আপনার জন্য কৃষি পরিকল্পনা সাজাচ্ছি..."
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
        State: COMPLETED (3.8s - 4.5s)              State: PARTIAL / TIMEOUT
       "আপনার পরিকল্পনা তৈরি হয়েছে।"                 "আংশিক তথ্য সংকলিত হয়েছে"
```

### 2.1 State Definitions & UI Presentation
| State Code | Bengali UI Label | Technical Action | Farmer UI Elements |
|---|---|---|---|
| `submitted` | "অনুরোধ গ্রহণ করা হয়েছে" | Generate unique `jobId`, snapshot current profile | Small subtle activity pulse |
| `analyzing_question` | "আপনার প্রশ্নটি বুঝে নিচ্ছি..." | Regex & phonetic extraction of variety, season, planting date, land area | Progress bar at 20%, detected entities highlighted |
| `retrieving_sources` | "বিশ্বস্ত কৃষি তথ্য খুঁজছি..." | Query Cloudflare edge proxy & local bundle for BRRI, BAMIS, BARC data | Progress bar at 45%, badges of sources contacted |
| `verifying_sources` | "BRRI, DAE ও প্রাসঙ্গিক গবেষণা যাচাই করছি..." | Cross-reference variety duration against AEZ, verify BARC fertilizer rates | Progress bar at 70%, citation checklist |
| `generating_plan` | "আপনার জন্য কৃষি পরিকল্পনা সাজাচ্ছি..." | Map stages to calendar dates, compute per-bigha fertilizer budget, format tasks | Progress bar at 90%, roadmap preview |
| `completed` | "আপনার পরিকল্পনা তৈরি হয়েছে।" | Persist plan to IndexedDB, prepare voice summary, display interactive cards | Full interactive roadmap, 🔊 Listen button |
| `partial` | "আংশিক তথ্য সংকলিত হয়েছে" | Insufficient external data; proceed with verified defaults & explicit notice | Notice of assumptions, contact 16123 button |
| `failed` | "তথ্য পাওয়া যায়নি" | Out-of-domain or server failure | Re-ask prompt, telephone helpline fallback |

---

## 3. Responsiveness & Concurrency Guarantees

### 3.1 Non-Blocking Architecture
1. **Never Block Global UI:** The progress card occupies a compact inline section within the copilot view. The farmer can scroll, review their previous query, or view saved plans while research executes.
2. **Cancellation Controller:** An active research job can be cancelled at any time via the `"বাতিল করুন"` button. The underlying `AbortController` cleanly terminates upstream HTTP fetches.
3. **Double-Submission Lockout:** The Send and Microphone buttons are automatically disabled while `status === 'processing'`, preventing duplicate redundant API calls or database collisions.

### 3.2 Resilience & Local Checkpointing
If a farmer loses mobile connectivity midway through retrieval:
- The engine automatically completes the plan using the verified local bundle (`public/data/agricultural_research_bundle.json`).
- The plan is immediately saved to the on-device IndexedDB (`plans` store).
- If the browser tab is accidentally refreshed, the latest generated plan is automatically reloaded from IndexedDB on startup.

---

## 4. Transparent Progress Telemetry

To ensure zero fake progress:
- Every progress step corresponds to an **actual asynchronous resolution** in `plannerEngine.js`.
- The UI displays:
  - Actual elapsed execution time (e.g. `২.৪ সেকেন্ডে সম্পন্ন`).
  - Specific documents retrieved (e.g. `BRRI ধান২৮ প্রোফাইল`, `বার্ক সার সুপারিশ নির্দেশিকা ২০২৪`).
  - Exact source count (e.g. `২টি বিশ্বস্ত উৎস যাচাইকৃত`).
