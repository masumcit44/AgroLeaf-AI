# F1: iPhone 14 Camera Test & Verification Report
**Document ID:** `docs/F1_IPHONE_CAMERA_TEST_REPORT.md`  
**Feature:** F1 Live Guided Camera Scanner  
**Device Context:** Apple iPhone 14 (iOS 16/17/18 Safari & Standalone PWA)  
**Author:** Mobile QA Lead & Senior Web Platform Engineer  
**Date:** 2026-11-04  
**Status:** Automated Tests Passed (100%); Physical Hardware Verification Procedure Prepared  

---

## 1. Automated Test Results

Automated unit and integration test suites running in Vitest:
- `cameraFraming.test.js`: 7/7 tests passed (iPhone 14 geometry, asymmetric edge point isolation, centered cover crop, contain mode).
- `LiveCameraScanner.test.jsx`: 3/3 tests passed (`100dvh` container, full-screen viewfinder, accessible shutter).
- `leafGeometry.test.js` & `guidanceEngine.test.js`: 6/6 tests passed.

---

## 2. iPhone 14 Manual Verification Protocol

For testing on physical iPhone 14 hardware (Safari / Add to Home Screen PWA):

### Test Procedure 1: Full-Screen Viewfinder Inspection
1. Open `https://agroleaf-ai.pages.dev` on iPhone 14 Safari.
2. Tap the camera scan button.
3. Observe the camera overlay:
   - **Expected Result:** The live video stream fills the entire screen from the top notch/Dynamic Island down to the bottom home indicator. No black bars, no half-screen letterboxing.
   - Header controls ("লাইভ ক্যামেরা গাইড", "গাইডেন্স লুকান", "✕") float translucently at the top.
   - Shutter button floats at the bottom with safe-area spacing above the home bar.

### Test Procedure 2: Asymmetric Edge Alignment Verification (Preview-to-Capture Match)
1. Place a white sheet of paper on a table with 4 distinct markers placed deliberately:
   - Marker A: At the far left edge of the visible preview.
   - Marker B: Just outside the visible left preview border (off-screen).
   - Marker C: At the center of the reticle.
   - Marker D: At the far right edge of the visible preview.
2. Tap the white circular shutter button to capture the frame.
3. Observe the captured image on the crop / analysis screen:
   - **Expected Result:** Marker B (which was off-screen) is **NOT visible** in the captured photo.
   - Markers A, C, and D appear in the exact positions where they were seen during the live preview.

### Test Procedure 3: Non-Blocking Capture Under All Advisory States
1. Point camera away from leaf (Guidance: "পাতাটি ফ্রেমের মাঝখানে আনুন" / NO_LEAF). Tap shutter.
   - **Expected Result:** Captures instantly without blocking.
2. Point camera at leaf with high movement (Guidance: "ছবিটি ঝাপসা মনে হচ্ছে" / BLURRY). Tap shutter.
   - **Expected Result:** Captures instantly without blocking.
3. Hold steady until reticle turns green (Guidance: "ছবি তোলার জন্য প্রস্তুত" / READY). Tap shutter.
   - **Expected Result:** Captures instantly.

---

## 3. Physical Hardware Sign-off Status
- **Automated Viewport & Geometry Verification:** PASSED ✅
- **Physical iPhone 14 Hardware Verification:** PENDING USER PHYSICAL TEST (Protocol provided above).
