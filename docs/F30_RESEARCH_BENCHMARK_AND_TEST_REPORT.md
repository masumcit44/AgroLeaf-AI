# F30: Agricultural Research Benchmark & Evaluation Protocol
**Document ID:** `docs/F30_RESEARCH_BENCHMARK_AND_TEST_REPORT.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** QA Lead & Agricultural Benchmark Evaluation Team  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** BENCHMARK PROTOCOL SPECIFICATION  

---

## 1. Benchmark Scope & Objectives

To verify that the upgraded F30 functions as a **genuine agricultural research assistant and personalized crop planner**—rather than a static question-and-answer chatbot—this benchmark establishes 23 authoritative evaluation scenarios across 5 distinct query domains.

---

## 2. Benchmark Query Sets & Expected Behaviors

### 2.1 Query Set A — Full Crop Roadmaps (A-to-Z Cultivation Guidance)
| # | Farmer Query (Voice or Text) | Expected Intent | Extracted Entities | Grounded System Response | Pass Criteria |
|---|---|---|---|---|---|
| A1 | *"আমি আজ ধানের চারা রোপণ করেছি। এখন থেকে ধান কাটা পর্যন্ত কী করব?"* | `crop_roadmap` | `start_date`: Today, `stage`: Transplanting | Check profile; if variety missing, progressively ask variety. Once resolved, generate 7-stage chronological roadmap from 0 to 140+ DAT. | Chronological timeline generated with exact dates, immediate actions, and F24 reminder actions. |
| A2 | *"আমি BRRI dhan28 রোপণ করেছি। আমার জন্য সম্পূর্ণ গাইডলাইন তৈরি করো।"* | `crop_roadmap` | `variety_id`: `brri_28`, `duration`: 140d, `season`: `boro` | Generate BRRI dhan28 specific Boro timeline: 140-day maturity, tillering at 18–45 DAT, panicle initiation at ~70 DAT, harvest at ~140 DAT. | Exact 140-day duration respected; BARC 3-split urea scheduled. |
| A3 | *"আমি আমন ধান চাষ করছি। মৌসুম অনুযায়ী কী কী কাজ করতে হবে?"* | `crop_roadmap` | `season`: `aman` | Ask for specific variety (e.g. BRRI dhan49 vs BRRI dhan51/52). Apply DAE BAMIS Aman monsoon rainfall and submergence guidelines. | Aman-specific water conservation & monsoon pest warnings included. |
| A4 | *"আমি সরাসরি বীজ বপন করেছি। এখন আমার পরিচর্যার পরিকল্পনা কী?"* | `crop_roadmap` | `cultivation_method`: `direct_seeded` | Bypass seedling nursery recovery shock; advance first weeding and thinning to 10–12 DAS. | Shift day offsets by -10 days compared to transplanted rice. |

### 2.2 Query Set B — Fertilizer & Nutrient Management
| # | Farmer Query | Expected Intent | Extracted Entities | Grounded System Response | Pass Criteria |
|---|---|---|---|---|---|
| B1 | *"এখন ইউরিয়া দেব?"* | `fertilizer_planning` | `fertilizer`: `urea` | Check active crop stage. If vegetative/tillering, explain 1st/2nd split. If flowering/heading, strictly forbid urea. | Explains split-timing; halts urea post-heading. |
| B2 | *"পটাশ আর ইউরিয়ার কাজ কী?"* | `nutrient_education` | `nutrients`: `N`, `K` | Explain that Urea stimulates vegetative green growth and tillering, while Potash (MOP) strengthens plant culms, improves grain weight, and resists fungal penetration. | Transparent agronomic explanation without marketing hype. |
| B3 | *"আমি কোন পর্যায়ে কী সার দেব?"* | `fertilizer_schedule` | `all_nutrients` | Present full BARC FRG matrix: 100% TSP/Gypsum/Zinc as Basal; Urea in 3 equal splits; Potash 60% basal + 40% top-dress. | Accurate split-dose schedule per BARC guidelines. |
| B4 | *"আমি আগে কিছু সার দিয়েছি, এখন কী করা উচিত?"* | `fertilizer_adjustment` | `stage_context` | Ask what stage and what was applied; adjust subsequent top-dressings. | Progressive clarification for missing input context. |
| B5 | *"আমার জমির জন্য সারের পরিমাণ কীভাবে নির্ধারণ করব?"* | `fertilizer_calculation` | `dosage_calculator` | Ask land area (bigha or decimal). Provide exact kg per decimal and per bigha based on variety and season. | Exact dosage calculation normalized to farmer's decimals. |

### 2.3 Query Set C — Disease & Crop Health
| # | Farmer Query | Expected Intent | Extracted Entities | Grounded System Response | Pass Criteria |
|---|---|---|---|---|---|
| C1 | *"আমার ধানে ব্লাস্ট রোগ হয়েছে। কীভাবে সমাধান করব?"* | `disease_management` | `disease`: `blast` | Immediate suspension of Urea; recommend approved fungicide (Tricyclazole 75 WP @ 0.75g/L or Azoxystrobin); recommend rescan in 3–5 days. | Zero urea instruction, correct BRRI chemical dose, safety PPE. |
| C2 | *"ব্রাউন স্পট হলে কী করতে হবে?"* | `disease_management` | `disease`: `brown_spot` | Recommend balanced potash top-dressing (5 kg/bigha); apply Mancozeb/Propiconazole if severity exceeds economic threshold. | Balanced potash + approved chemical management. |
| C3 | *"আমার পাতায় বাদামি দাগ দেখা যাচ্ছে, এটা কী হতে পারে?"* | `symptom_inquiry` | `symptoms`: brown spots | Advise differential diagnosis between Blast spindle lesions and Brown Spot circular spots. Invite farmer to take a leaf photo. | No definitive text-only diagnosis; promotes camera scanner. |
| C4 | *"ধানের রোগ যাতে না ছড়ায় কী কী করতে হবে?"* | `preventive_hygiene` | `sanitation` | Drain infected water, bury diseased stubbles, clean weeding, maintain plant spacing, avoid excessive nitrogen. | Non-chemical cultural sanitation guidelines. |

### 2.4 Query Set D — Follow-up & Plan Interaction
| # | Farmer Query | Expected Intent | Extracted Entities | Grounded System Response | Pass Criteria |
|---|---|---|---|---|---|
| D1 | *"এরপর কী করব?"* | `plan_followup` | `next_milestone` | Reference current plan's next chronologically upcoming task. | Coherent state retention from active plan. |
| D2 | *"এই কাজটা কেন করতে হবে?"* | `task_explanation` | `active_task` | Provide agronomic reason (e.g. why drain field before harvest: uniform ripening and mechanical ease). | Traceable agronomic reasoning provided. |
| D3 | *"সার না দিলে কী সমস্যা হতে পারে?"* | `nutrient_deficiency` | `deficiency_risk` | Detail yield loss mechanisms (e.g. nitrogen deficiency leads to stunted tillers, yellowing, 30–50% yield reduction). | Evidence-backed deficiency description. |
| D4 | *"এই পরিকল্পনাটা সংরক্ষণ করতে চাই।"* | `save_plan` | `current_plan` | Persist full plan to IndexedDB (`plans` store); update UI to show saved badge. | Verified storage in IndexedDB with retrieved UUID. |
| D5 | *"আগামী সাত দিনের কাজগুলো দেখাও।"* | `upcoming_tasks` | `window`: 7 days | Filter plan tasks where `target_date` is between today and today + 7 days. | Exact 7-day task window displayed. |

### 2.5 Query Set E — Ambiguous, Edge Cases & Out-of-Domain
| # | Farmer Query | Expected Intent | Extracted Entities | Grounded System Response | Pass Criteria |
|---|---|---|---|---|---|
| E1 | *"আমার জমির জন্য কী করব?"* | `ambiguous_general` | `missing_context` | Respectfully ask: *"আপনার ফসলটি কোন পর্যায়ে রয়েছে এবং কী ধরনের পরিকল্পনা চান? (চাষাবাদ গাইড / সার হিসাব / বালাই দমন)"* | Progressive clarification with quick-tap chips. |
| E2 | *"এটা ভালো হবে?"* | `ambiguous_short` | None | Asks farmer to explain what action or input they are considering. | Prevents blind hallucinated affirmations. |
| E3 | *"আলুর ব্লাইট কীভাবে দমন করব?"* | `out_of_domain` | `crop`: potato | *"দুঃখিত, এগ্রোলিফ বর্তমানে শুধুমাত্র ধান ফসলের জন্য তৈরি। আলুর রোগ সংক্রান্ত সহায়তার জন্য কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন।"* | Clear, respectful honest abstention. |
| E4 | *"মুরগির ওষুধ কী?"* | `out_of_domain` | `livestock`: poultry | Honest abstention redirecting to DAE / DLS helpline. | Zero hallucinated veterinary advice. |

---

## 3. Evaluation Scoring & Verification Rules

1. **Agronomic Grounding:** 100% of recommendations must cite BRRI, DAE, BARC, or IRRI.
2. **Language Parity:** All responses in Bangla interface must be in simple, natural Bengali.
3. **Execution Safety:** Zero recommended doses of banned substances; zero urea recommended during blast or post-heading.
4. **Performance:** Sub-second response from local bundle/cache; maximum 4.5s for live edge-retrieval.
