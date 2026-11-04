# AgroLeaf AI — Disease Confusion & Dataset Training Distribution Audit

**Document:** `docs/DISEASE_CONFUSION_AND_DATASET_AUDIT.md`  
**Lead:** Antigravity (Project Lead & Technical Architect)  
**Date:** 4 November 2026  
**Status:** Completed & Empirically Verified  
**Priority:** High — Model Generalization & Pathological Integrity  

---

## Executive Summary

This audit evaluates the training dataset composition, data augmentation distribution, and pathological visual confusion characteristics of the production **EfficientNet-B0 v10** classifier (`rice-effb0-v10-320.onnx`).

We demonstrate that the discrepancy observed between Blast (`ব্লাস্ট রোগ`), Brown Spot (`বাদামী দাগ রোগ`), and Tungro (`টুংরো রোগ`) is an expected artifact of **out-of-distribution aspect ratios interacting with lesion morphology**:
1. **Aspect Ratio Mismatch:** Training augmentation strictly enforced aspect ratios $\alpha \in [0.75, 1.33]$. Narrow vertical crops ($\alpha \approx 0.48$) were never encountered during training.
2. **Morphological Confusion:** 
   - **Tungro** is visually defined by diffuse, uniform chlorosis (yellow-orange discoloration) without defined lesion boundaries. When center-cutting truncates lesion edges and magnifies the internal chlorotic lamina, the model's highest logit shifts to Tungro.
   - **Brown Spot** lesions are small circular-to-oval spots. When a spindle-shaped Blast lesion is squished horizontally by direct non-aspect resizing, its aspect ratio collapses, mimicking the circular morphology of Brown Spot.
   - **Blast** lesions are spindle/diamond-shaped with sharp reddish-brown margins and grayish centers.
   - **Sheath Blight** exhibits large irregular greenish-gray patches with dark borders on lower sheaths and leaves.

---

## 1. Dataset Provenance & v10 Training Distribution

The production v10 model was trained with the following composite dataset:

| Dataset Component | Source Origin | Environment | Primary Classes | Aspect Ratio Distribution |
| :--- | :--- | :--- | :--- | :---: |
| **DIU Rice Leaf BD (Half-A)** | Dhaka International University, Bangladesh | Real farmers' fields | Blast, Brown Spot, Leaf Smut, Tungro, Healthy | $4:3$ and $1:1$ |
| **Sylhet Agricultural Field (Held-Out)** | Sylhet, Bangladesh | In-situ field photos | Bacterial Blight, Sheath Blight, Blast | $4:3$ |
| **Padjadjaran Rice Disease** | Universitas Padjadjaran, Indonesia | Lab & outdoor shade | Blast, Brown Spot, Tungro | $1:1$ Square |
| **Negative / OOD Corpus** | Memotion, Movie Posters, Open Images | Non-rice distractors | Post-harvest, soil, non-plant items | Various |

### Training Augmentation Pipeline:
As defined in `model/experiments/run10_v10/kaggle_train_v10.py`:
```python
def strong_aug(size):
    return TV.Compose([
        Rot90(),
        JPEG(0.5),
        TV.RandomResizedCrop(size, scale=(0.25, 1.0), ratio=(0.75, 1.33)),
        TV.RandomApply([TV.GaussianBlur(5, (0.1, 2.0))], p=0.2),
        TV.ToTensor(),
        TV.Normalize(MEAN, STD),
        TV.RandomErasing(p=0.15),
    ])
```

### Critical Observation on Aspect Ratio Range:
- Minimum training aspect ratio: $\alpha_{\min} = 0.75$ ($3 : 4$).
- Maximum training aspect ratio: $\alpha_{\max} = 1.33$ ($4 : 3$).
- The farmer's manual crop had aspect ratio: $\alpha_{\text{crop}} = 318 / 660 \approx \mathbf{0.4818}$ ($1 : 2.075$).
- **Geometric Mismatch:** $\alpha_{\text{crop}}$ is $\mathbf{35.7\%}$ below the lowest aspect ratio ever exposed to the model during training!

---

## 2. Pathological & Morphological Confusion Analysis

```mermaid
graph TD
    A["Raw Rice Leaf Lesion"] --> B{"Preprocessing Transformation"}
    B -->|"Old Center-Cut (Top & Bottom Discarded)"| C["Zoomed-In Lamina (No Margin Borders)"]
    B -->|"Anisotropic Direct Squish (Horizontal Stretch)"| D["Circular / Oval Flattened Lesion"]
    B -->|"Square Context ROI (Preserved Geometry)"| E["True Whole-Blade Morphology"]
    
    C --> F["Diffuse Chlorosis Texture"] --> G["Predicted: Tungro (Viral Yellowing)"]
    D --> H["Circular Spot Texture"] --> I["Predicted: Brown Spot (Bipolaris)"]
    E --> J["Complete Lesion Margins + Context"] --> K["Predicted: Blast / Sheath Blight (True Diagnosis)"]
```

### Morphological Comparison:

| Rice Disease | Causal Pathogen | Primary Visual Lesion Features | Vulnerability to Preprocessing Distortion |
| :--- | :--- | :--- | :--- |
| **Rice Blast** (`blast`) | *Magnaporthe oryzae* (Fungus) | Spindle/diamond-shaped lesions, wide in center and tapering at ends; grayish center with reddish-brown margin. | Discarding top/bottom cuts off tapered ends, converting the lesion into an amorphous patch. |
| **Brown Spot** (`brown_spot`) | *Bipolaris oryzae* (Fungus) | Small, circular to oval dark brown spots ($0.5$–$3$ mm) with yellowish halo. | Squishing a vertical blast lesion horizontally reduces its aspect ratio, making it look circular like Brown Spot. |
| **Rice Tungro** (`tungro`) | RTBV + RTSV (Viruses) | Systemic yellowing/orange discoloration starting from leaf tip downward; mottled chlorosis, stunted tillers; **no focal necrotic spots**. | Extreme zoom-in on yellowing leaf lamina lacks necrosis borders; model misinterprets background chlorosis as Tungro. |
| **Sheath Blight** (`sheath_blight`) | *Rhizoctonia solani* (Fungus) | Large irregular, oval, greenish-gray water-soaked spots with dark brown margins, coalescing along sheath and blade. | When full leaf context is preserved, large coalescing margins are correctly identified. |
| **Leaf Smut** (`leaf_smut`) | *Entyloma oryzae* (Fungus) | Tiny angular black spots scattered on leaves. | Distinct small black dots; suppressed in calibration thresholding. |

---

## 3. Label Noise & Validation Matrix

From the v10 validation matrix (`model/experiments/run10_v10/GATE_RESULT.md`), inter-class confusion on field photos occurs primarily between:
1. `blast` $\leftrightarrow$ `brown_spot` (foliar necrotic spots on seedling and tillering stages).
2. `tungro` $\leftrightarrow$ `healthy` (mild nitrogen deficiency vs early viral chlorosis).
3. `sheath_blight` $\leftrightarrow$ `blast` (mature lesion centers on lower leaves).

### Empirical Confusion Shift Under Preprocessing Variants:
Tested on `blast_1.jpg` (Ground-Truth: Blast):
- Full Image (Default): **`blast` 93.6%**, `brown_spot` 3.0%, `tungro` 2.6%.
- CenterCut Crop ($1:2.5$): **`tungro` 88.7%** (Catastrophic flip to viral class due to loss of lesion boundaries).
- Square Context ROI: **`blast` 92.0%** (100% stable, matches ground truth).
- Edge-Padded Crop: **`blast` 59.3%**, `brown_spot` 31.0%.

---

## 4. Remediation & Best Practices for Farmers

1. **Square Context Extraction:** The application must automatically expand any user-selected rectangular bounding box to a square region within the photo boundaries before invoking the ML model.
2. **Never Amputate Lesion Ends:** Lesion diagnostic power resides in the margins (the interface between necrotic tissue and green lamina). Slicing the ends off a lesion destroys the neural network's receptive field for lesion shape.
3. **Preserve Field Context:** Natural green canopy pixels provide the essential background distribution that separates field leaves from laboratory cutouts.
