# AgroLeaf AI — Farmer Profile: Current State Audit
**Document ID:** `docs/FARMER_PROFILE_CURRENT_STATE_AUDIT.md`  
**Status:** COMPLETED AUDIT  
**Lead Architect:** Antigravity  
**Date:** 2026-11-04  

---

## 1. Executive Summary

A comprehensive architectural and UX audit was conducted on the existing AgroLeaf AI Farmer Profile (`frontend/src/features/profile/`). The audit examined user experience, privacy guarantees, data models, consuming modules, and agricultural relevance.

---

## 2. Granular Audit Findings

### 2.1 What the Existing Profile Currently Saves
The previous `ProfilePage.jsx` and `profileStore.js` saved a flat JavaScript object to IndexedDB:
- `district_code`: String (P-code 1–64)
- `district_name_en`: String
- `district_name_bn`: String
- `lat` / `lon`: Numeric coordinates of district polygon centroid
- `location_source`: `'district'` or `'gps'`
- `season`: `'boro'`, `'aman'`, or `'aus'`
- `variety`: Free-text string (unvalidated)
- `transplant_date`: Date string (`YYYY-MM-DD`)
- `updated_at`: ISO timestamp

### 2.2 Storage Layer & Privacy Verification
- **Storage Location:** IndexedDB (`STORES.PROFILE` in database `agroleaf`).
- **Privacy Verification:** **100% True Device-Local.** Zero data is transmitted to external servers, cloud storage, analytics endpoints, or third-party APIs.
- **Offline Capability:** Fully functional offline through PWA and service worker caching.

### 2.3 Downstream Consumers
1. `actionPlan` (`features/actionPlan/index.jsx`): Reads `district_code` and `season` for regional recommendations.
2. `weather` (`features/weather/index.jsx` & `WeatherReportPage.jsx`): Reads `lat`, `lon`, and `district_code` for BAMIS crop-weather advisories and Open-Meteo edge proxy forecast.
3. `help` (`features/help/index.jsx`): Reads `district_name_bn` to populate local DAE contact cards.
4. `areaMap` (`features/areaMap/index.jsx`): Reads coordinates for community map centering.
5. `yieldRisk` (`features/yieldRisk/yieldRiskStore.js`): Reads `season` and `transplant_date` for stage-based yield impact estimation.

### 2.4 Critical Defects in the Old Implementation
1. **Lack of User Purpose / Value Proposition:** The previous page asked farmers for district, season, variety, and date without explaining *why* it was needed or what the farmer would gain.
2. **Post-Save Dead End:** After saving, it showed a temporary "সংরক্ষিত হয়েছে" (Saved) message and remained on the form. It did not generate a crop calendar or show any active guidance.
3. **Free-Text Rice Variety Field:** Farmers had to type rice variety names manually into a blank text input, leading to typos and invalid entries.
4. **Ambiguous Date Field:** Labeled generically as "রোপণের তারিখ" (Planting Date), ignoring the critical difference between transplanted rice (চারা রোপণ) and direct-seeded rice (সরাসরি বপন), and failing to accommodate farmers who do not recall the exact date.
5. **No Upazila Hierarchy:** Only supported district level; lacked cascading Division $\to$ District $\to$ Upazila dropdowns.
6. **No Reminder Integration:** Saved planting date was disconnected from the F24 Farmer Reminder engine.

---

## 3. Transformation Plan
Transform `ProfilePage` from an unmotivating setup form into **"আমার ধানক্ষেতের পরিকল্পনা ও ফসলের ক্যালেন্ডার" (My Rice Field Setup & Personalized Crop Calendar)**:
- Cascading Division $\to$ District $\to$ Upazila selectors with GPS convenience fallback.
- Season cards (Aus, Aman, Boro) with seasonal descriptions.
- Searchable BRRI variety selector with "জাত জানি না" and "অন্যান্য জাত" fallbacks.
- Cultivation method toggle (Transplanting vs Direct Seeding) with growth-stage fallback.
- Instant personalized crop calendar with active crop stage, next priority task, timeline, and 1-tap F24 reminder integration.

