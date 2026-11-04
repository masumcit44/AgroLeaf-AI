# F1: Exact Preview-to-Capture Framing Validation Report
**Document ID:** `docs/F1_PREVIEW_CAPTURE_FRAMING_VALIDATION.md`  
**Feature:** F1 Live Guided Camera Scanner  
**Focus:** Elimination of Preview-to-Photo Discrepancy & Side Clutter Leakage  
**Author:** Computer Vision & Imaging Pipeline Specialist  
**Date:** 2026-11-04  
**Status:** Mathematically Proven & Unit-Tested  

---

## 1. Problem Statement

When taking photos with a smartphone camera inside a web browser, the video preview is rendered using CSS `object-fit: cover` to fill the phone's narrow portrait aspect ratio (e.g., $390 \times 844$ on iPhone 14, an aspect ratio of $\approx 0.462$).

However, the hardware camera sensor produces a wider aspect ratio (e.g., $9:16$ = $0.5625$ or $3:4$ = $0.75$).

Under `object-fit: cover`, the browser crops off the left and right margins of the video so that it fills the screen vertically.

**Previous Defect:**  
The capture routine drew $(0, 0, \text{videoWidth}, \text{videoHeight})$ directly to the capture canvas. Because it captured the full uncropped sensor width, objects on the left and right that were completely off-screen in the preview unexpectedly appeared in the saved photo!

---

## 2. Mathematical Solution: `getVisibleCameraSourceRect()`

The authoritative geometry utility `src/features/liveScanner/cameraFraming.js` calculates the exact crop rectangle:

```javascript
// 1. Calculate the scale factor applied by CSS object-fit: cover
const scale = Math.max(previewWidth / sourceWidth, previewHeight / sourceHeight);

// 2. Determine the source region visible in the preview
const visibleSourceW = previewWidth / scale;
const visibleSourceH = previewHeight / scale;

// 3. Compute centered crop offsets
const sx = Math.max(0, (sourceWidth - visibleSourceW) / 2);
const sy = Math.max(0, (sourceHeight - visibleSourceH) / 2);

// 4. Output canvas matches the cropped source resolution exactly
const dw = Math.round(visibleSourceW);
const dh = Math.round(visibleSourceH);
```

### 2.1 Concrete Example: iPhone 14 Viewport ($390 \times 844$) + $1080 \times 1920$ Sensor
1. Scale factor: $S = \max(390/1080, 844/1920) = \max(0.3611, 0.43958) = 0.43958$.
2. Visible source width: $390 / 0.43958 \approx 887$ px.
3. Left margin offset: $sx = (1080 - 887) / 2 = 96.5 \to 96$ px.
4. Visible source height: $1920$ px ($sy = 0$).
5. **Result:** The canvas captures strictly $(sx=96, sy=0, sw=887, sh=1920)$.
6. The $96$ pixels of off-screen margin on the left and $97$ pixels on the right are **strictly excluded**.
7. The captured photo has an aspect ratio of $887 / 1920 = 0.46198$, which matches the iPhone 14 preview window ($390 / 844 = 0.46208$) within **0.02% error**!

---

## 3. Test Evidence

Validated in `src/features/liveScanner/__tests__/cameraFraming.test.js`:
- Asymmetric feature point test confirms points outside $sx \dots sx+sw$ return `false` for capture inclusion.
- Centered leaf features return `true`.
- Zero distortion or stretching; native optical resolution is fully preserved.
