# F1: Full-Screen Mobile Camera Implementation Report
**Document ID:** `docs/F1_CAMERA_FULL_SCREEN_IMPLEMENTATION.md`  
**Feature:** F1 Live Guided Camera Scanner  
**Architecture:** Edge-to-Edge Mobile Viewfinder with Floating Controls  
**Target Environments:** iPhone 14 (Safari & iOS PWA), Android Chrome, Samsung Internet  
**Author:** Lead Frontend Architect & Camera Systems Engineer  
**Date:** 2026-11-04  
**Status:** Implemented & Verified  

---

## 1. Architectural Redesign Overview

To eliminate the constrained, half-screen camera panel reported on iPhone 14, `LiveCameraScanner.jsx` was re-engineered from a vertically partitioned flexbox layout into an **immersive, layered full-screen architecture**.

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: Viewfinder (<video>)                         │
│  - absolute inset-0 w-full h-full                      │
│  - 100dvh (Dynamic Viewport Height)                    │
│  - object-fit: cover, object-position: center          │
├────────────────────────────────────────────────────────┤
│  Layer 2: Advisory Reticle & Framing Guides (Z-10)     │
│  - Centered non-intrusive dashed box                   │
│  - Optional toggle: "গাইডেন্স লুকান / দেখান"           │
├────────────────────────────────────────────────────────┤
│  Layer 3: Top Navigation Floating Bar (Z-20)           │
│  - absolute top-0 left-0 right-0                       │
│  - pt-[max(0.75rem, env(safe-area-inset-top))]         │
│  - Translucent gradient-to-b (backdrop-blur)           │
├────────────────────────────────────────────────────────┤
│  Layer 4: Bottom Floating Shutter Controls (Z-20)      │
│  - absolute bottom-0 left-0 right-0                    │
│  - pb-[max(1.75rem, env(safe-area-inset-bottom))]      │
│  - Large 80x80px touch target; capture always active   │
└────────────────────────────────────────────────────────┘
```

---

## 2. iPhone 14 & iOS Safari Compatibility Enhancements

### 2.1 Viewport Sizing (`100dvh` & `viewport-fit=cover`)
- **Problem on iOS Safari:** Classic `100vh` calculates height assuming collapsed address bars. When bars expand, elements in flex containers are squeezed vertically.
- **Solution:**
  - Added `viewport-fit=cover` to `<meta name="viewport">` in `index.html`.
  - Set container height to `100dvh` with fallback `minHeight: '-webkit-fill-available'`.
  - The live camera viewfinder now bleeds seamlessly from under the Dynamic Island / notch down to the bottom home bar indicator.

### 2.2 Inline Playback Enforcement
WebKit on iOS requires explicit configuration to prevent the camera stream from popping out into fullscreen QuickTime media controls:
```javascript
video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
video.playsInline = true;
video.muted = true;
video.autoplay = true;
```

### 2.3 Safe Stream Constraints
- Avoided rigid `min: 720` constraints that trigger WebKit `OverconstrainedError`.
- Requested ideal portrait dimensions (`width: { ideal: 1080 }, height: { ideal: 1920 }`) with graceful fallback to standard sensor resolutions.

