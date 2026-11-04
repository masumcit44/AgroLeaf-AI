# AgroLeaf AI — Farmer Profile & Crop Calendar: Mobile UX Report
**AgroLeaf AI | Production UX & Accessibility Verification**

**Document ID:** `docs/FARMER_PROFILE_MOBILE_UX_REPORT.md`  
**Status:** VERIFIED ON MOBILE VIEWPORTS  
**Date:** 2026-11-04  

---

## 1. Mobile Viewport Performance (360px – 412px)

The redesigned setup form and active crop calendar were audited across mobile viewports:
- **360px (Ultra Compact Android / Symphony / Walton):**
  - Grid structures cleanly wrap into 2-column benefit cards and touch targets retain $\ge 44$px height.
  - Dropdowns and combobox popovers render within viewport bounds with explicit scrolling (`max-h-52 overflow-y-auto`) and elevated z-index (`z-20`).
- **375px (iPhone SE / Standard Compact):**
  - Season cards display icons and Bangla descriptions with balanced typographic padding.
- **390px – 412px (Samsung Galaxy / Pixel / Modern Android):**
  - Timeline cards display status badges, expand buttons, and reminder icons without text truncation.
  - Progress bar renders with high-contrast emerald and gold colors.

---

## 2. Accessibility & Interaction Principles

1. **Touch Target Dimensions:** All primary buttons (`BigButton`), dropdown options, and toggle checkboxes strictly exceed $44 \times 44$px touch boundaries.
2. **Accessible Combobox:** District searchable field includes proper `role="combobox"`, `aria-expanded`, `aria-controls`, and `role="listbox"` attributes.
3. **Bangla Typography:** Clear, legible Bengali fonts (`Noto Sans Bengali` / `system-ui`) with proper vowel mark (`kar`) rendering and Bengali numerals (`০-৯`).
4. **Offline Resilience:** All features operate 100% offline from browser-local IndexedDB.
