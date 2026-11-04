# AgroLeaf AI — Personalized Crop Calendar: Test Report
**AgroLeaf AI | Production Quality Assurance**

**Document ID:** `docs/PERSONALIZED_CROP_CALENDAR_TEST_REPORT.md`  
**Status:** PASS (100% Pass Rate)  
**Date:** 2026-11-04  

---

## 1. Test Coverage Overview

- **Engine Unit Tests (`cropCalendarEngine.test.js` - 5 tests):**
  - Generates 8 distinct, chronological management tasks across establishment, tillering, booting, flowering, grain filling, and harvest.
  - Calculates correct growth stage and progress percentage based on days elapsed from planting date.
  - Automatically shifts operational offsets earlier for direct-seeded rice.
  - Handles missing planting dates via fallback growth-stage back-calculation, correctly marking tasks as `is_estimated: true`.
  - Accurately selects `next_task` from uncompleted due or upcoming activities.

- **Administrative Hierarchy Tests (`bangladeshAdmin.test.js` - 3 tests):**
  - Verifies presence of all 8 administrative divisions of Bangladesh.
  - Confirms 100% of the 64 districts in `districts.json` map to a valid division.
  - Validates upazila resolution and graceful fallback for unindexed districts.

- **Component Tests (`CropCalendarView.test.jsx` - 2 tests):**
  - Verifies server-side rendering (SSR) of overview card, progress bar, next task card, and timeline.
  - Confirms full bilingual rendering in Bengali and English.

- **Store & GPS Tests (`profile.test.js` & `gpsLocation.test.js` - 16 tests):**
  - Verifies IndexedDB CRUD, schema upgrades, and partial profile preservation.
  - Verifies centroid snapping, GPS approximation tags, and privacy isolation.

---

## 2. Full Project Suite Verification

- **Total Test Files:** 55 passed (55)
- **Total Tests:** 384 passed (384)
- **Pass Rate:** 100%
- **Linter (Oxlint):** 0 errors
- **Production Build:** Vite bundle built in 1.32s, all assets under Cloudflare Pages 25 MiB ceiling.
