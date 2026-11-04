# AgroLeaf AI — Visual Regression & Viewport Testing Report
**Document ID:** `docs/AGROLEAF_VISUAL_REGRESSION_REPORT.md`  
**Focus:** Responsive Viewport Integrity (320px to 430px), iPhone 14 Notch/Safe Area, Text Wrapping  
**Author:** QA Lead & Mobile Platform Specialist  
**Date:** 2026-11-04  
**Status:** Validated  

---

## 1. Target Mobile Viewport Matrix

All primary application routes and modals were audited across the representative device matrix:

| Device Target | Viewport Width × Height | Aspect Ratio | Layout Observations & Validations |
| :--- | :---: | :---: | :--- |
| **iPhone SE (3rd Gen)** | $320 \times 568$ px | $9:16$ (0.563) | Compact width; TabBar smoothly horizontally scrollable; cards fit without horizontal page blowout. |
| **Samsung Galaxy A14** | $360 \times 800$ px | $9:20$ (0.450) | Common Android farmer smartphone. Full-screen viewfinder bleeds smoothly; cards balanced. |
| **iPhone 13 / 14 mini** | $375 \times 812$ px | $9:19.5$ (0.462) | Viewfinder fills notch-to-home-bar with `100dvh`. Floating controls clear notch. |
| **iPhone 14 / 14 Pro** | $390 \times 844$ px | $9:19.5$ (0.462) | **Primary Target Device**. Viewfinder fills entire $390 \times 844$ screen. Preview-to-capture framing exact. |
| **Google Pixel 7 / 8** | $412 \times 915$ px | $9:20$ (0.450) | Clean typography, high contrast, touch targets $\ge 44$px. |
| **iPhone 14 Pro Max** | $430 \times 932$ px | $9:19.5$ (0.462) | Generous margins, no element stretching, reticle centered. |

---

## 2. Key Visual Regressions Checked & Prevented

1. **Horizontal Scroll Bar on Main Document:** Checked `overflow-x: hidden` and container constraints; zero unintended document-level horizontal panning.
2. **Dynamic Island & Notch Clipping:** Verified `pt-[max(0.75rem, env(safe-area-inset-top))]` ensures camera header and close button never collide with iPhone 14 Dynamic Island.
3. **Home Indicator Bar Collision:** Verified `pb-[max(1.75rem, env(safe-area-inset-bottom))]` provides comfortable thumb clearance above the home swipe line.
4. **Bengali Diacritics Clipping:** Verified all heading fonts use `leading-tight` ($1.25$) or `leading-snug` ($1.375$) with adequate vertical padding, avoiding clipped tops of উ-কার, ঈ-কার, and মাত্রা.

