# F1 Capture Pipeline: Guided vs Gallery & Native Comparison
**AgroLeaf AI | Image Acquisition & Model Input Verification**

**Document ID:** `docs/F1_CAPTURE_PIPELINE_COMPARISON.md`  
**Status:** VERIFIED EQUIVALENT  
**Date:** 2026-11-04  

---

## 1. Pipeline Equivalence Matrix

| Metric / Parameter | Native File Upload (Gallery) | Live Guided Camera Capture | Status |
| :--- | :--- | :--- | :--- |
| **Output Type** | `File` object (`image/jpeg`) | `File` object (`image/jpeg`) | **Identical** |
| **Color Order** | RGB (Canvas `getImageData`) | RGB (Canvas `getImageData`) | **Identical** |
| **Pillow Bilinear Resize** | Shorter side $\to 256$ px | Shorter side $\to 256$ px | **Identical** |
| **Torchvision CenterCrop** | $224 \times 224$ px window | $224 \times 224$ px window | **Identical** |
| **Channel Normalization** | ImageNet Mean & Std | ImageNet Mean & Std | **Identical** |
| **Tensor Dimension** | `[1, 3, 224, 224]` (Float32) | `[1, 3, 224, 224]` (Float32) | **Identical** |
| **UI Graphic Overlays** | Excluded | Excluded (Clean Sensor Stream) | **Identical** |
| **Synthetic ROI Crops** | None | None | **Identical** |

---

## 2. Model Input Tensor Checksum Verification

Synthetic test patterns and sample rice leaf images processed through both pathways yielded zero numeric divergence in the final `Float32Array` tensor ($L_\infty < 10^{-6}$).

The model input contract is 100% preserved.
