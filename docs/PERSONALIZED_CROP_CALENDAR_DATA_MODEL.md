# AgroLeaf AI — Personalized Crop Calendar: Data Model
**Document ID:** `docs/PERSONALIZED_CROP_CALENDAR_DATA_MODEL.md`  
**Status:** SCHEMA SPECIFICATION  
**Date:** 2026-11-04  

---

## 1. Storage & Schema Definition

The crop profile is stored in client-side IndexedDB (`agroleaf` database, store: `profile`, key: `'self'`).
It extends the existing profile schema backward-compatibly.

```typescript
interface FarmerCropProfile {
  // Identity & Meta
  profileId: string;             // Unique ID (default 'self')
  updated_at: string;            // ISO timestamp
  
  // Location Hierarchy
  division_id: string;           // e.g. "dhaka", "rajshahi", "chittagong"
  division_name_bn: string;      // e.g. "ঢাকা"
  division_name_en: string;      // e.g. "Dhaka"
  district_code: string;         // e.g. "1" (Dhaka), "3" (Gazipur)
  district_name_bn: string;      // e.g. "গাজীপুর"
  district_name_en: string;      // e.g. "Gazipur"
  upazila_id: string;            // e.g. "kaliakair"
  upazila_name_bn: string;       // e.g. "কালিয়াকৈর"
  upazila_name_en: string;       // e.g. "Kaliakair"
  lat: number;                   // Centroid latitude
  lon: number;                   // Centroid longitude
  location_source: 'district' | 'upazila' | 'gps';

  // Rice Ecology & Crop Specification
  season: 'boro' | 'aman' | 'aus';
  variety: string;               // e.g. "BRRI dhan28"
  variety_id: string;            // e.g. "brri_dhan28" | "unknown" | "other"
  custom_variety_name?: string;  // If variety_id === 'other'
  variety_duration_days: number; // e.g. 140 (default 145)

  // Cultivation Method & Chronology
  cultivation_method: 'transplanted' | 'direct_seeded';
  transplant_date?: string | null;  // ISO date "YYYY-MM-DD"
  nursery_date?: string | null;     // ISO date "YYYY-MM-DD"
  direct_seeding_date?: string | null;
  crop_stage?: string | null;       // Fallback growth stage if dates unknown

  // Calendar State & Interactivity
  calendar_generated_at: string;
  completed_task_ids: string[];     // IDs of completed activities
  active_reminder_ids: string[];    // IDs linked to F24 reminders
}
```

---

## 2. Calendar Activity Object

```typescript
interface CalendarTask {
  id: string;                    // e.g. "task_topdress_1"
  stage_id: string;              // e.g. "stage_tillering"
  title_bn: string;              // e.g. "১ম কিস্তি ইউরিয়া ও আগাছা দমন"
  title_en: string;              // e.g. "1st Top-dressing & Weeding"
  target_date: string;           // "YYYY-MM-DD" (exact or estimated)
  date_window: { start: string; end: string };
  is_estimated: boolean;         // True if calculated from general season
  why_bn: string;                // "চারা দ্রুত শিকড় বিস্তার করে ও কুশি ছাড়তে পুষ্টি প্রয়োজন।"
  instructions_bn: string;       // Actionable steps
  source_ref: string;            // "BRRI ধান চাষ নির্দেশিকা"
  status: 'upcoming' | 'due' | 'completed' | 'overdue';
}
```
