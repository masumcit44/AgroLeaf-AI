# F1 Camera Root-Cause Investigation & Audit Report
**Document ID:** `docs/F1_CAMERA_ROOT_CAUSE_AUDIT.md`  
**Feature:** F1 Live Guided Camera Scanner  
**Device Context:** iPhone 14 (iOS 16/17/18 Safari & WebKit PWA) & Representative Mobile Viewports  
**Author:** Lead Frontend Architect & Computer Vision Engineer  
**Date:** 2026-11-04  
**Status:** Root Causes Confirmed & Documented  

---

## 1. Executive Summary

Testing on an iPhone 14 revealed two major defects in the F1 Live Guided Camera:
1. **Constrained / Half-Sized Viewfinder:** The camera preview occupied only a fraction of the mobile screen with substantial dead space and vertical letterboxing.
2. **Preview-to-Capture Framing Mismatch:** Objects outside the visible preview frame unexpectedly appeared in the captured photograph (e.g., side margins, background objects).

This document presents a rigorous root-cause analysis based on direct code inspection of `LiveCameraScanner.jsx`, `HomePage.jsx`, `index.html`, and WebKit camera stream behaviors.

---

## 2. Root-Cause Analysis Matrix

| Phenomenon | Manifested Behavior on iPhone 14 | Technical Root Cause in Existing Code | Solution Strategy |
| :--- | :--- | :--- | :--- |
| **Defect 1: Framing Mismatch** | Side objects not seen in preview appear in captured image | `video` CSS uses `object-fit: cover`, which crops the video to fit the container aspect ratio. However, `handleCapture` ran `ctx.drawImage(video, 0, 0, vWidth, vHeight)`, capturing the **entire uncropped sensor frame** rather than the visible viewport region. | Authoritative `getVisibleCameraSourceRect()` utility that calculates the exact crop rectangle of the visible preview and applies it to the capture canvas. |
| **Defect 2: Constrained Viewfinder** | Camera looks half-sized or squeezed vertically | `LiveCameraScanner` used a flex column (`flex flex-col justify-between`) where header and bottom controls were flex siblings. With dynamic browser toolbars on iOS Safari, `flex-1` was severely constrained. | Refactor into true full-screen layered layout: Viewfinder occupies `absolute inset-0 w-full h-full`, while header and bottom controls float translucently over it. |
| **Defect 3: Letterboxing / Safe Area Gaps** | Black bands around screen edges; doesn't fill notch or bottom bar | `index.html` viewport meta tag was `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />` missing `viewport-fit=cover`. | Update viewport meta tag to include `viewport-fit=cover` and use `100dvh` with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. |
| **Defect 4: Camera Stream Overconstrained Risk** | Camera initialization failure on specific iOS devices | Constraints included `width: { ideal: 1080, min: 720 }, height: { ideal: 1920, min: 720 }`. On iOS Safari, rigid `min` values can throw `OverconstrainedError`. | Remove strict `min` thresholds; specify `facingMode: { ideal: 'environment' }` with ideal resolutions and graceful fallbacks. |

---

## 3. Detailed Technical Investigation

### 3.1 The Preview-to-Capture Geometry Discrepancy

On an iPhone 14, the viewport dimensions in CSS points are **390px × 844px** (an aspect ratio of $390/844 \approx 0.462$, or approximately $9:19.5$).

When the rear camera stream is requested:
- The device camera hardware produces frames in standard native ratios: typically $4:3$ (e.g. $1920 \times 1440$) or $16:9$ ($1920 \times 1080$).
- When rendered with `object-fit: cover`, the browser scales the video so that it completely covers the preview container ($W_p \times H_p$).
- Because the screen is much narrower and taller ($9:19.5$) than the incoming sensor frame ($9:16$ or $3:4$), the browser clips off the excess width (the left and right margins) from the user's view.
- **The Bug:** In `handleCapture()`, the code was:
  ```javascript
  const vWidth = video.videoWidth || 1280;
  const vHeight = video.videoHeight || 720;
  captureCanvas.width = vWidth;
  captureCanvas.height = vHeight;
  ctx.drawImage(video, 0, 0, vWidth, vHeight);
  ```
- Because it drew $(0, 0, vWidth, vHeight)$, the captured image retained the full uncropped sensor width. The farmer framed a leaf thinking the borders were clean, but the saved photo contained unwanted background clutter on the left and right.

### 3.2 Viewport Sizing on iOS Safari

In WebKit on iOS:
1. `height: 100vh` calculates height based on the maximum viewport height when address and navigation toolbars are hidden. When toolbars are expanded, elements at the bottom are obscured or compressed.
2. `height: 100dvh` (Dynamic Viewport Height) dynamically adjusts to the actual visible viewport.
3. Without `viewport-fit=cover`, iOS Safari forces a default "safe area letterbox" in full-screen modals, cutting off screen edges.
4. When `flex-col` is used with large header and bottom control blocks, the middle `flex-1` video container receives only ~50-60% of the screen height, resulting in a "half-sized camera" appearance.

---

## 4. Architectural Corrective Actions

1. **New Framing Geometry Utility (`src/features/liveScanner/cameraFraming.js`):**
   - Provide `getVisibleCameraSourceRect({ videoWidth, videoHeight, previewWidth, previewHeight, fit = 'cover', position = 'center' })`.
   - Calculate exact source coordinates: `sourceX`, `sourceY`, `sourceWidth`, `sourceHeight`, `destWidth`, `destHeight`.
   - Guarantee that 100% of visible pixels are captured at native sensor resolution with zero out-of-frame leakage.
2. **True Full-Screen Immersive Layout (`LiveCameraScanner.jsx`):**
   - Viewfinder element set to `absolute inset-0 w-full h-full` using `100dvh`.
   - Translucent top header and bottom shutter controls overlaid with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
3. **Viewport Configuration (`index.html`):**
   - Add `viewport-fit=cover`.
4. **Advisory Guidance Preservation:**
   - Guidance remains strictly non-blocking. Shutter is always active once camera stream is live.

