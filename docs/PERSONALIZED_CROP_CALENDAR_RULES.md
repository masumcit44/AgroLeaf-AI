# AgroLeaf AI — Personalized Crop Calendar: Rule Engine
**Document ID:** `docs/PERSONALIZED_CROP_CALENDAR_RULES.md`  
**Status:** SPECIFICATION  
**Date:** 2026-11-04  

---

## 1. Growth Stage & Date Scheduling Rules

Given a planting base date $T_0$ (`transplant_date` or `direct_seeding_date`) and variety duration $D$ (default 145 days):

### 1.1 Activity Offset Schedule (Transplanted Rice)
1. **First Weeding & Top-Dress 1:**
   $$\text{Offset} = \text{round}(D \times 0.12) \quad (\approx \text{Day 15–20})$$
2. **Tillering & Stem Borer Scouting:**
   $$\text{Offset} = \text{round}(D \times 0.22) \quad (\approx \text{Day 30–35})$$
3. **Mid-Season Top-Dress 2 & Blast Scouting:**
   $$\text{Offset} = \text{round}(D \times 0.32) \quad (\approx \text{Day 45–50})$$
4. **Booting / Panicle Initiation Irrigation:**
   $$\text{Offset} = \text{round}(D \times 0.45) \quad (\approx \text{Day 65–70})$$
5. **Flowering & Standing Water Maintenance:**
   $$\text{Offset} = \text{round}(D \times 0.55) \quad (\approx \text{Day 78–82})$$
6. **Grain Filling & Brown Planthopper (BPH) Inspection:**
   $$\text{Offset} = \text{round}(D \times 0.65) \quad (\approx \text{Day 90–98})$$
7. **Pre-Harvest Field Drainage:**
   $$\text{Offset} = D - 12 \quad (\approx \text{Day 130–140})$$
8. **Final Harvest & Threshing:**
   $$\text{Offset} = D \quad (\approx \text{Day 140–155})$$

### 1.2 Direct-Seeded Rice Adjustments
For direct-seeded rice, each relative offset is shifted earlier by 10 days, reflecting the absence of seedling nursery recovery time.

### 1.3 Missing Date Fallback
If the farmer selects "তারিখ জানি না" and provides a current growth stage (e.g. `stage_tillering`), the engine infers an approximate reference point $T_0 = \text{Today} - \text{Day 25}$ and clearly marks all subsequent calendar dates with `is_estimated: true` ("আনুমানিক সময়সূচি").

---

## 2. F24 Reminder Synchronization
When a farmer clicks "স্মরণবার্তা চালু করুন" (Enable Reminder) on any calendar task:
- Calls `remindersStore.saveReminder({ title, description, due_date: target_date, source: 'crop_calendar' })`.
- Updates `active_reminder_ids` in `profile`.
- The task is immediately rendered with a green "স্মরণবার্তা সক্রিয়" badge and is tracked in the F24 Due Reminders banner on the Home page.

