# F1 Live Guided Camera: Non-Blocking Guidance & Capture Freedom Fix
**AgroLeaf AI | Production UX Correction & Architecture Report**

**Document ID:** `docs/F1_GUIDED_CAMERA_NON_BLOCKING_FIX.md`  
**Status:** IMPLEMENTED, TESTED, VERIFIED  
**Lead CV & UX Architect:** Antigravity  
**Date:** 2026-11-04  

---

## 1. Executive Summary & Root Cause Analysis

### The Unwanted Behavior
Previously, `LiveCameraScanner.jsx` disabled the shutter capture button (`disabled={!guidance.isReady && !allowManualCapture}`), holding capture hostage until either:
1. The guidance engine classified the leaf as centered, sharp, and properly framed (`isReady === true`).
2. A 6-second timeout elapsed (`allowManualCapture === true`).

This caused severe UX frustration in the field:
- Farmers holding phones in varying field conditions (wind swaying leaves, harsh sunlight, background weeds) were blocked from taking a photo.
- Farmers were forced to twist or reposition their phones solely to turn the bounding box green, introducing hand shake, motion blur, and shadow occlusion.

### The Required & Implemented Fix
1. **Decoupled State Machines:**
   - **Camera State:** `INITIALIZING` $\to$ `ACTIVE` $\to$ `ERROR` $\to$ `STOPPED`
   - **Capture State:** `AVAILABLE` $\to$ `CAPTURING`
   - **Guidance State:** `ANALYZING`, `NO_LEAF`, `MOVE_LEFT`, `MOVE_RIGHT`, `MOVE_UP`, `MOVE_DOWN`, `MOVE_CLOSER`, `MOVE_AWAY`, `DARK`, `BRIGHT`, `BLURRY`, `READY`, `UNCERTAIN`
2. **Immediate Capture Freedom:**
   - The shutter button is **enabled immediately** as soon as `cameraState === 'ACTIVE'`.
   - The farmer is free to capture at any time, regardless of leaf position, alignment, distance, blur, lighting, or guidance state.
   - The `Ready` state is purely advisory and visually highlights the shutter, but **never gates or locks capture**.
3. **Guidance Visibility Toggle:**
   - Farmers can tap "গাইডেন্স লুকান / দেখান" (Hide/Show Guidance) at any time. When hidden, the camera stream and capture button remain 100% active.
4. **Friendly, Non-Mandatory Phrasing:**
   - Revised all prompts from rigid commands into polite suggestions: e.g., "ফোনটা একটু বামে নিলে পাতাটি পরিষ্কার দেখা যেতে পারে" instead of "ফোনটা বামে নিন".

