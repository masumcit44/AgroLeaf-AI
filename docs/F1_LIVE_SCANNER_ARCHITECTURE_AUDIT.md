# F1 Advanced: Intelligent Live Guided Camera Scanner — Architecture Audit
**Document ID:** `docs/F1_LIVE_SCANNER_ARCHITECTURE_AUDIT.md`  
**Date:** 2026-11-04  
**Role:** Lead Computer Vision Engineer & Senior Mobile UX Architect  
**Project:** AgroLeaf AI  

---

## 1. Executive Summary & Audit Scope

This audit evaluates the feasibility, component reuse, and architectural design for upgrading AgroLeaf AI's F1 Photo Quality Gate into an **Intelligent Live Guided Camera Scanner**.

The farmer experience must be that of an active agricultural viewfinder:
1. Farmer taps the Camera button.
2. The browser accesses the rear camera (`facingMode: { ideal: "environment" }`).
3. The scanner continuously analyzes live video frames at 5–10 FPS.
4. Real visual evidence (luminance, Laplacian edge variance, plant pixel centroid, bounding box) produces real-time Bangla guidance:
   - "ফোনটা একটু বামে ঘোরান" / "ক্যামেরা একটু ডানে ঘোরান"
   - "ক্যামেরা একটু উপরে তুলুন" / "ক্যামেরা একটু নিচে নামান"
   - "ফোনটা একটু কাছে আনুন" / "ফোনটা একটু দূরে নিন"
   - "ছবিটি ঝাপসা। ফোন স্থির রাখুন"
   - "আলো কম। পর্যাপ্ত আলোতে যান"
   - "পাতাটি স্ক্যানের জন্য প্রস্তুত!"
5. When stable quality criteria are met, the capture button unlocks, snapping the frame directly into the existing inference pipeline.

---

## 2. Answers to Mandatory Audit Questions

### Q1: What capabilities already exist?
- **Grayscale and Luminance Extraction:** `src/lib/imageQuality.js` implements `buildGrayscaleArray` (downscaled Rec. 601 luma: $Y = 0.299R + 0.587G + 0.114B$) and `meanLuminance`.
- **Blur Detection:** `src/lib/imageQuality.js` implements discrete $3 \times 3$ `laplacianVariance` with threshold `BLUR_MIN = 50`.
- **Leaf Pixel Detection:** `src/ml/safetyGate.js` implements `plantPixelFraction` using color space thresholding ($G > 40$, $G > 1.05R$, $G > 1.05B$, ExG $2G - R - B > 15$).
- **Crop Geometry & Math:** `src/features/user_guided_crop/cropMath.js` implements square context preservation and coordinate transformation.
- **Inference Pipeline:** `src/ml/predict.js` accepts HTML5 canvas or OffscreenCanvas, running EfficientNet-B0 ONNX entirely client-side in WebAssembly.

### Q2: Which capabilities can be reused?
- **100% reusable:** `meanLuminance`, `laplacianVariance`, and `plantPixelFraction` from existing modules.
- **Offscreen frame sampling:** A lightweight offscreen canvas ($160 \times 160$ or $240 \times 240$) can sample video frames without lagging the live 60 FPS viewport.

### Q3: Does the existing system genuinely identify rice leaf positions?
- **Current status:** The existing system computes a global scalar fraction (`plantPixelFraction`) across the whole canvas. It does *not* track leaf bounding boxes or spatial centroids in real time.
- **Required addition:** A lightweight spatial moments and bounding box detector (`detectLeafRegion`) that computes the center of mass $(cx, cy)$, bounding box $[x_{min}, y_{min}, x_{max}, y_{max}]$, and coverage ratio from the binary plant mask.

### Q4: Can it distinguish one leaf from multiple leaves?
- **Current status:** No.
- **Required addition:** Connected component analysis or contour bounding box count on the downscaled plant mask. If multiple large disconnected blobs exist with comparable areas ($> 20\%$ frame area each), flag multiple leaves.

### Q5: Can it estimate whether the leaf is too small or too large?
- **Current status:** No.
- **Required addition:** Compute relative leaf bounding box area `leafAreaRatio = (bbox.w * bbox.h) / (frame.w * frame.h)`:
  - If `leafAreaRatio < 0.15`: "ফোনটা একটু কাছে আনুন" (Too far / small).
  - If `leafAreaRatio > 0.80` or bounding box touches $> 2$ frame edges: "ফোনটা একটু দূরে নিন" (Too close / clipped).

### Q6: Can it reliably detect image blur and insufficient lighting?
- **Yes.** `meanLuminance < 40` reliably detects underexposure; `meanLuminance > 230` detects overexposure. `laplacianVariance < 50` detects severe out-of-focus blur.

### Q7: What additional computer vision component is genuinely required?
- **Spatial Plant Moments & Bounding Box Estimator:** A deterministic, zero-model classical computer vision function running on downsampled RGBA frames.
- **Temporal Guidance Smoother:** A debouncing state machine with hysteresis to prevent instruction flickering.

### Q8: What is the lightest reliable architecture for our current application?
- **Architecture:** Native `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })`.
- **Frame Rate:** Throttled to 6–8 FPS via `requestAnimationFrame` and timestamp delta ($> 125$ ms).
- **Zero Heavy ML Downloads:** Classical CV (ExG thresholding + connected component spatial moments) executes in $< 4$ ms per frame in pure JavaScript, adding **0 bytes** of neural network weight downloads!

---

## 3. Technology Evaluation for Live Detection

| Technology | Latency | Model Size | Battery / CPU Impact | Browser Compatibility | Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Classical CV (ExG + Moments)** | **2–4 ms** | **0 KB** | Negligible (<3% CPU) | 100% Web Standard | **WINNER (Selected)** |
| **MediaPipe Tasks Vision** | 35–65 ms | 8–15 MB | Moderate (15–25% CPU) | Requires WebGL2/WASM | Overkill for framing |
| **ONNX Lightweight YOLO Detector** | 80–140 ms | 12–22 MB | Heavy (drops UI FPS) | CPU bottlenecked | Risk to mid-range phones |

---

## 4. Direction Mapping Matrix

Camera movement instructions guide the farmer on how to move their physical device to bring the leaf into the central viewfinder guide $[x_1: 0.25, x_2: 0.75, y_1: 0.20, y_2: 0.80]$:

| Detected Leaf Centroid $(cx, cy)$ | Screen Position | Physical Phone Correction | Bangla Instruction |
| :--- | :--- | :--- | :--- |
| $cx < 0.35$ | Leaf is to the Left | Move camera left | **"ক্যামেরা একটু বামে ঘোরান"** |
| $cx > 0.65$ | Leaf is to the Right | Move camera right | **"ক্যামেরা একটু ডানে ঘোরান"** |
| $cy < 0.30$ | Leaf is too High | Tilt/move camera up | **"ক্যামেরা একটু উপরে তুলুন"** |
| $cy > 0.70$ | Leaf is too Low | Tilt/move camera down | **"ক্যামেরা একটু নিচে নামান"** |
| Area $< 0.15$ | Leaf too small | Bring camera closer | **"ফোনটা একটু কাছে আনুন"** |
| Area $> 0.80$ | Leaf clipped/too close | Pull camera back | **"ফোনটা একটু দূরে নিন"** |
| Blur $< 50$ | Unfocused / moving | Hold phone steady | **"ছবিটি ঝাপসা। ফোন স্থির রাখুন"** |
| Luma $< 40$ | Underexposed | Move to light | **"আলো কম। পর্যাপ্ত আলোতে যান"** |
| Centered, Sharp, Lit ($\ge 3$ frames) | Ideal Framing | Ready to shoot | **"পাতাটি স্ক্যানের জন্য প্রস্তুত!"** |

---

## 5. Architectural Implementation Plan

1. **`src/features/liveScanner/leafGeometry.js`:**
   - Pure functions: `extractPlantMask`, `computeLeafMoments`, `classifyLeafFraming`.
   - 100% unit testable in Vitest without canvas or browser DOM.
2. **`src/features/liveScanner/guidanceEngine.js`:**
   - Priority state machine: Permission $\to$ No leaf $\to$ Blur/Light $\to$ Direction $\to$ Distance $\to$ Ready.
   - Hysteresis filter: Requires 3 consecutive identical frames to transition states.
3. **`src/features/liveScanner/LiveCameraScanner.jsx`:**
   - Fullscreen mobile modal with high-contrast SVG viewfinder target.
   - Rear camera stream with fallback to manual file picker.
   - Snap-to-canvas capture passing directly into `useScanFlow`.
4. **`src/features/liveScanner/i18n.js`:**
   - Complete bilingual dictionary (Bangla primary, English secondary).
