# F1 Live Guided Camera: Prediction Accuracy Investigation
**AgroLeaf AI | Technical Audit of Model Input & Inference Integrity**

**Document ID:** `docs/F1_GUIDED_CAPTURE_ACCURACY_AUDIT.md`  
**Status:** COMPLETED INVESTIGATION  
**Lead ML & CV Engineer:** Antigravity  
**Date:** 2026-11-04  

---

## 1. Problem Statement

Field observations noted that disease predictions appeared less accurate when photos were taken using the Guided Camera compared to uploading photos from the gallery or native camera app.

---

## 2. In-Depth Technical Investigation

We conducted a step-by-step audit across the entire image acquisition and preprocessing pipeline:

### 2.1 Viewfinder Framing vs Captured Frame Discrepancy (Object-Cover Artifact)
- **Finding:** The mobile viewfinder used CSS `object-cover` on the `<video>` element to fill the phone's vertical screen (typically a 9:19.5 aspect ratio).
- **The Discrepancy:** When `getUserMedia` initialized, default video constraints requested a 16:9 landscape stream (`1280x720`).
  - Because of `object-cover`, the browser visually clipped ~40% of the horizontal margins on-screen.
  - The farmer saw what appeared to be a tight, centered leaf filling their screen.
  - However, `ctx.drawImage(video, 0, 0, vWidth, vHeight)` captured the entire uncropped 16:9 frame (`1280x720`).
  - In that uncropped 16:9 frame, the leaf occupied only a narrow central column, surrounded by wide extraneous background areas (soil, weeds, hands).
- **The Impact on PyTorch Preprocessing (`preprocess.js`):**
  - PyTorch `torchvision.transforms.Resize(256)` resizes the shorter side (720) to 256, setting the width to $1280 \times 256 / 720 = 455$.
  - `CenterCrop(224)` then takes the middle $224 \times 224$ window.
  - Because the leaf was small relative to the 16:9 frame, substantial background noise was included, and peripheral lesion symptoms were cropped out!

### 2.2 Forced Alignment & Awkward Angle Induced Motion Blur
- Because the previous implementation locked capture until the guidance algorithm reported `READY`, farmers attempted to force the alignment box over the leaf by tilting their phones at steep angles, causing:
  - Specular glare reflections from the sun.
  - Heavy hand jitter while waiting for the box to turn green.
  - Shadow cast by the phone directly over the lesion.

### 2.3 Sensor Exposure: Video Stream vs Photographic Shutter
- Native camera apps use dedicated ISP (Image Signal Processor) modes with multi-frame HDR exposure, optical stabilization, and full 12 MP sensor resolution.
- Live WebRTC `getUserMedia` video streams run at a fixed frame rate (30 FPS) with dynamic electronic shutter, resulting in lower optical sharpness under low-light canopy conditions unless the phone is held steady.

---

## 3. Implemented Corrections

1. **Portrait-Aware High-Resolution Media Constraints:**
   - Detects screen aspect ratio: if `window.innerHeight > window.innerWidth`, explicitly requests portrait video constraints:
     $$\text{width: } 1080\text{ (min 720)}, \quad \text{height: } 1920\text{ (min 720)}$$
   - Matches the camera sensor orientation to the farmer's natural vertical smartphone grip.
2. **Clean Sensor Capture:**
   - Captured frames are extracted directly from the video buffer onto an offscreen canvas.
   - Guaranteed zero overlay pixels: reticle, guidance pill, direction arrows, and text are excluded.
3. **Preservation of Preprocessing Contract:**
   - The captured image is output as a standard `File` object (`image/jpeg`, 0.95 quality) and passed directly to `scanFlow.selectFile(file)`.
   - Passes through the exact same PyTorch-equivalent pipeline (`preprocess.js` $\to$ Pillow Bilinear $\to$ CenterCrop $\to$ ImageNet Normalization) with zero deviation.
4. **Immediate Non-Blocking Capture:**
   - Farmers capture when the leaf is clear to their eyes, eliminating forced-tilt contortions.

