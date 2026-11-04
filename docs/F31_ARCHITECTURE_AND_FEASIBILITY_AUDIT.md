# F31: Disease Severity Scoring — Architecture & Feasibility Audit
**AgroLeaf AI | Production-Grade Scientific Audit**

**Document ID:** `docs/F31_ARCHITECTURE_AND_FEASIBILITY_AUDIT.md`  
**Status:** AUDITED & APPROVED  
**Author:** Lead AI/ML & Plant Pathology Architecture Team  
**Date:** 2026-11-04  

---

## 1. System Capabilities & Baseline Inspection

### 1.1 Existing Classifier Capabilities
The existing classifier (`rice-effb0-v10-320.onnx`, 15.34 MB) is an EfficientNet-B0 trained on 8 categorical classes:
1. `bacterial_leaf_blight`
2. `blast`
3. `brown_spot`
4. `healthy`
5. `leaf_scald`
6. `narrow_brown_spot`
7. `sheath_blight`
8. `tungro`

**Finding:** The classifier outputs an 8-dimensional class logit vector. It does *not* output pixel coordinates, segmentation masks, bounding boxes, or lesion counts.

### 1.2 F11 Heatmap vs Genuine Segmentation
F11 provides an Explainable AI CAM (Class Activation Map) feature (`camEngine.js` and `heatmapRenderer.js`). 
- **Critical Scientific Distinction:** CAM activation indicates spatial regions where feature channels contributed to classification. It does *not* delineate anatomical lesion boundaries, leaf margins, or necrosis depth.
- **Mandate:** The F11 heatmap must **never** be integrated as a numeric mask for disease severity calculation.

---

## 2. Feasibility of Leaf and Lesion Segmentation

### 2.1 Leaf Margin Extraction
In smartphone imagery captured under natural field conditions, green rice foliage is segmented reliably using the Excess Green Index ($ExG = 2G - R - B > 10$) combined with spatial morphological bounding. This filters out non-leaf background (soil, hands, water, sky).

### 2.2 Necrotic Lesion Extraction
Within valid leaf pixel bounds ($ExG > 10$), diseased tissue exhibits chlorosis (loss of chlorophyll) and necrosis (cell death), resulting in characteristic yellow, brown, or grayish elliptical lesions. 
This is quantified via colorimetric segmentation in the RGB/HSV domain ($R > G - 10$ and $L \le 200$), yielding a genuine physical measurement:
$$\text{Visible Lesion Coverage (\%)} = \left(\frac{\text{Lesion Pixels}}{\text{Leaf Pixels}}\right) \times 100$$

### 2.3 Quality Gate & Honest Abstention Thresholds
- If $\text{Leaf Pixels} < 5\%$ of the total frame, the leaf is deemed unidentifiable or heavily cropped.
- Severe blur (Laplacian variance $< 12$) or extreme underexposure prevents reliable lesion boundary detection.
- Under these conditions, the engine **must abstain** from producing a severity score.

---

## 3. Disease-Specific Severity Feasibility

| Disease | Standard Evaluation System | Feasibility on Single Leaf Photo | Decision |
| :--- | :--- | :--- | :--- |
| **Rice Blast** | IRRI SES 0–9 scale | High: Elliptical diamond lesions directly measurable | **Supported (IRRI 0–9)** |
| **Brown Spot** | IRRI SES lesion count & area | High: Circular/oval brown spots directly measurable | **Supported (SES Area & Density)** |
| **Bacterial Leaf Blight** | IRRI SES percentage wilt | Moderate: Linear marginal wilting measurable | **Supported (Leaf Area %)** |
| **Tungro** | Stunting & leaf discoloration | Low: Tungro is systemic viral stunting across the entire hill; single leaf photo cannot assess stunting | **Honest Abstention** |
| **Sheath Blight** | Relative lesion height up culm | Low: Sheath blight severity requires measuring height of lesions relative to total plant height; leaf blade cannot convey culm height | **Honest Abstention** |
| **Healthy / Not Rice** | N/A | N/A | **Abstain (Not Applicable)** |

---

## 4. Architectural Summary

F31 executes client-side on the user's mobile browser in $< 10$ ms with zero server roundtrips, zero paid APIs, and zero bloat, preserving complete offline autonomy.

