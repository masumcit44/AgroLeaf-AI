# F1 Live Guided Camera: Mobile Capture Verification
**AgroLeaf AI | Mobile Viewport & Hardware Verification**

**Document ID:** `docs/F1_MOBILE_CAPTURE_VERIFICATION.md`  
**Status:** VERIFIED  
**Date:** 2026-11-04  

---

## 1. Viewport Ergonomics & Touch Target Verification

Audited across target smartphone resolutions (360px, 375px, 390px, 412px):
- **Shutter Capture Button:**
  - Outer ring: $80 \times 80$ px
  - Inner tap disc: $56 \times 56$ px
  - Meets and exceeds WCAG AAA touch target requirements ($\ge 44$ px).
  - Centered in lower thumb zone for comfortable one-handed mobile capture.
- **Header Controls:**
  - "গাইডেন্স লুকান / দেখান" (Hide/Show Guidance) toggle button placed safely in header ($36$ px height, padded).
  - Close "✕" button: $44 \times 44$ px.
- **Floating Guidance Pill:**
  - Positioned at `top-16` (`64px` from top edge) with `pointer-events-none` so it never intercepts accidental taps.
  - Backdrop blur (`backdrop-blur-md`) with high-contrast text ensures legibility against bright sky or dark foliage backgrounds.

---

## 2. Hardware Resource Lifecycle

1. **Camera Stream Cleanup:**
   - Closing the viewfinder or completing a capture stops all media stream tracks immediately via `track.stop()`.
   - Prevents the camera hardware indicator from remaining illuminated.
2. **Animation Frame Cancellation:**
   - Analysis loop terminates cleanly on unmount (`cancelAnimationFrame`).
   - Zero memory leaks or background CPU drain after closing the camera.

