# F31: Dataset & Annotation Audit
**AgroLeaf AI | Production-Grade Scientific Audit**

**Document ID:** `docs/F31_DATASET_AND_ANNOTATION_AUDIT.md`  
**Status:** AUDITED & APPROVED  
**Date:** 2026-11-04  

---

## 1. Candidate Datasets Inspected

### 1.1 RiceLeafDiseaseBD (Version 3)
- **Source:** Mendeley Data (`doi:10.17632/86s4jzj2m4.3`)
- **Reported Volume:** 9,769 smartphone images, 21,460 annotations.
- **Annotation Type:** Bounding Boxes (YOLO format), NOT pixel-level segmentation masks.
- **Finding:** Bounding boxes delineate bounding rectangles around groups of lesions or diseased leaves. They overestimate lesion area by $300\%\text{--}600\%$ because empty green space within the bounding box is included. Bounding box annotations are therefore unsuitable for pixel-level affected area calculation.

### 1.2 RiceSeg-5932
- **Source:** Mendeley Data (`doi:10.17632/92jc6w6mcy.1`)
- **Reported Volume:** 5,932 segmentation mask images for Bacterial Blight, Leaf Blast, Brown Spot, Tungro.
- **Annotation Type:** Binary lesion masks.
- **Finding:** Useful for validating lesion extraction algorithms against true ground truth. Demonstrates that Blast and Brown Spot lesions exhibit high chrominance contrast against green rice parenchyma.

### 1.3 In-Project Test Sets (Frozen Gold Test Sets)
- **Status:** Stored with frozen SHA-256 hashes (`save_frozen_test_hashes.py`).
- **Policy:** Strictly held out from any training or heuristic tuning to prevent data leakage.

---

## 2. Conclusion & Annotation Policy
No fake ground truth or unverified labels are introduced. Where ground truth is unavailable or scientifically inappropriate (such as Tungro stunting or Sheath Blight culm height), the system enforces honest abstention.

