# AgroLeaf AI — Technical & Product Reevaluation of Farmer Profile (F21)

**Document:** `docs/FARMER_PROFILE_REEVALUATION.md`  
**Author:** Antigravity (Project Lead & Technical Architect)  
**Date:** 4 November 2026  
**Status:** Evaluation Complete · Architecture Recommendations Formulated  

---

## 1. Context & Problem Statement

In user feedback, the purpose of the **Farmer Profile** (`#/profile`, feature F21) was called into question:
> *"The current Farmer Profile feature does not have a clear purpose. I do not yet understand why a farmer must create a profile, what information is collected, how that information is used, or how it improves the farmer's experience. If the purpose is unclear to me, it will be even more confusing for a farmer."*

This document provides a thorough audit of the code, data flow, storage, and utility of F21, answering the 5 core questions raised.

---

## 2. In-Depth Technical Audit

### Q1: What data is collected?
1. **District:**
   - District Code (e.g. `10` for Faridpur)
   - District Name English (`Faridpur`) & Bangla (`ফরিদপুর`)
   - Centroid Coordinates (`lat: 23.6071, lon: 89.8429`)
2. **Location Source:**
   - Either `'district'` (user manually selected from 64 districts) or `'gps'` (user pressed GPS button, browser queried `navigator.geolocation`, coordinates rounded to 2 decimals $\approx 1$ km).
3. **Crop Season:**
   - Single selection: `boro` (বোরো), `aman` (আমন), or `aus` (আউশ).
4. **Variety:**
   - Free-form text input (e.g. "BRRI dhan 28").

### Q2: Where is the data stored?
- **100% Client-Side in Browser IndexedDB:**
  - Table: `STORES.PROFILE` (database name: `agroleaf_db`, key: `'self'`).
  - **No remote server storage:** The profile is **never sent to Cloudflare D1, never sent to any API, and never stored in cookies or analytics**.
  - Can be deleted instantly by the farmer via the "তথ্য মুছুন" (Delete Data) button.

### Q3: Which features actually use this data?
1. **Weather Analysis (`F8` & `F8 v2` Weather Report):**
   - The weather store (`weatherStore.js`) checks `getProfileLocation()`. If available, it uses the district's `lat`/`lon` to query the Open-Meteo API for 7-day weather forecasts and BAMIS disease risk rules.
2. **BRRI Crop Calendar (`cropCalendar.js`):**
   - Reads `season` (`boro` / `aman` / `aus`) to indicate the active growth stage (e.g. Tillering, Panicle Initiation).
3. **Rice Leaf Classifier (`model_v10.onnx`):**
   - **Does NOT use profile data.** The MobileNetV3 image classification model operates strictly on pixels from the leaf photo. It does not condition probabilities on season or variety.
4. **Rice Variety Input:**
   - **Unused.** No component, algorithm, or rule in the entire codebase reads `profile.variety`. It is dead input data.

### Q4: What happens if a farmer does not create a profile?
- **Nothing breaks.**
- Image scanning, leaf disease classification, voice audio readout, action plans, and scan history work 100% identically with or without a profile.
- In the Weather & Crop Analysis page (`#/weather`), if no profile is set, the user is simply prompted to select their district from a dropdown to view weather.

### Q5: How are privacy and consent handled?
- Because storage is local IndexedDB, there is no remote tracking or GDPR/data privacy leak.
- However, naming the feature "Farmer Profile" (কৃষকের তথ্য) and placing a GPS button on the homepage creates an unwarranted psychological barrier: rural farmers suspect they are being registered, tracked, or asked for bureaucratic identity.

---

## 3. Product & Architectural Recommendations

### Recommendation 1: Drop the "Profile" Concept — Rebrand to "আমার এলাকা" (My Area / Location)
Farmers do not want an IT "profile"; they simply want accurate local weather and agricultural advisory.
- Eliminate the term "Farmer Profile".
- Rebrand the page and tabs to **"আমার এলাকা ও ফসল" (My Area & Crop)** or integrate it directly into the **Weather Tab (`#/weather`)**.

### Recommendation 2: Remove Dead Fields
- Eliminate the `variety` (ধানের জাত) text box completely from the UI and schema. It creates form fatigue without offering any algorithmic benefit.

### Recommendation 3: Remove Homepage GPS and Profile Links (ISSUE-002)
- Remove `ProfilePrompt` from `SLOT_LAYOUT.home`.
- The homepage should be 100% focused on leaf diagnosis: take photo, get instant result.
- Location setup belongs strictly inside the Weather tab.

### Recommendation 4: Make Location Selection Seamless in Weather Tab
- In `#/weather`, allow the farmer to:
  1. Pick their district from an intuitive list of 64 districts.
  2. Or click "📍 বর্তমান এলাকা শনাক্ত করুন" (Detect current area via GPS) if they prefer automated detection.
  3. Default to zero GPS prompts unless the user actively requests it.

---

## 4. Conclusion & Decision
For the AgroLeaf AI MVP:
- We **do not** require mandatory farmer registration or identity collection.
- The profile functionality is simplified to **Local Area & Season Preferences**, integrated unobtrusively into the Weather feature.
- All leaf scanning remains instant, friction-free, and anonymous.
