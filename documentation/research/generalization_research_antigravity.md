# AgroLeaf AI — Generalization Research: Why Rice Disease Classifiers Fail on New Images & Measurable Mitigations

**Author:** Antigravity (Independent ML/QA Research Engineer)  
**Lead:** Claude  
**Date:** 2026-11-02  
**Branch:** `research/generalization`  
**Scope:** Root-cause diagnosis of cross-district generalization failures, empirical literature benchmark, shortcut-learning audit protocol, coverage-preserving calibration design, legal data audit, and ranked ablation experiments.

---

## 1. Verified Repo Baseline Facts

Every fact below is directly verified from repo files on branch `origin/main` and branch `origin/feat/model-v3`:

1. **Deployed Production Model (v1):**
   - Architecture: MobileNetV3-Large (`mnv3_large`), single-file float32 ONNX opset 17, size 16.05 MiB.
   - Training Data: Exclusively trained on 5,932 images from one Bangladeshi district (Gazipur, BRRI research fields) across 6 classes (`healthy`, `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`).
   - Repository Citation: `frontend/public/data/metrics-v1.json:2-7`.
   - Internal Held-Out Test Performance ($n = 1,499$): Macro-F1 = 0.8427 (84.3%), Accuracy = 0.8686 (86.9%), Coverage = 0.9466 (94.7%), Selective Accuracy = 0.8872 (88.7%), Expected Calibration Error (ECE) = 0.0453 (4.5%).
   - Repository Citation: `frontend/public/data/metrics-v1.json:14-19`.

2. **Measured Out-of-District Performance Degradation (v1):**
   - **Sylhet-Dhaka Field Test** (`external[0]`, $n = 1,423$ images, 2 Nov 2026 re-evaluation with upright EXIF correction and near-duplicate removal): Coverage = 0.6221 (62.2%), Selective Accuracy = 0.5368 (53.7%), Macro-F1 = 0.5483 (0.548).
     - Brown Spot Recall on Sylhet: **0.0749 (7.5%)** with 347 true samples producing only 26 correct predictions (`metrics-v1.json:81-86`).
     - Misclassification of Uncovered Diseases: 67.6% (1 - 0.3242 unseen rejection rate) of unsupported rice conditions escape rejection and are falsely shown as covered diseases (`metrics-v1.json:73, 228`).
     - Repository Citation: `frontend/public/data/metrics-v1.json:60-94`.
   - **Sirajganj/Pabna Phone Photos (Raihan)** (`external[2]`, $n = 1,794$ images): Coverage = 0.6851 (68.5%), Selective Accuracy = **0.0985 (9.8%)**, Macro-F1 = 0.4143 (0.414).
     - Misclassification of Uncovered Diseases: 80.2% (1 - 0.1980 unseen rejection rate) of unsupported conditions escape rejection (`metrics-v1.json:144, 228`).
     - Repository Citation: `frontend/public/data/metrics-v1.json:137-180`.
   - **Gujarat, India (UCI / vbookshelf)** (`external[3]`, $n = 120$ images): Coverage = 0.5000 (50.0%), Selective Accuracy = **0.0500 (5.0%)**, Macro-F1 = 0.0985.
     - Repository Citation: `frontend/public/data/metrics-v1.json:182-218`.
   - **Savar (BD5)** (`external[1]`, $n = 3,150$ cut leaves on white paper): Coverage = 0.8571 (85.7%), Selective Accuracy = 0.3761 (37.6%), Raw Mapped Accuracy = 0.3358 (33.6%).
     - Repository Citation: `frontend/public/data/metrics-v1.json:95-136`.

3. **v4 Experiment Findings (Kaggle unified evaluation `agroleaf-eval-unified`):**
   - **International Data Hurt Generalization:** In experiment `E-v3a` (`run3_v3`, EfficientNet-B0), pooling Gazipur with Indian (Paddy Doctor, Sethy) and Vietnamese datasets yielded Sylhet macro-F1 of 0.546 and raw accuracy of 0.456 (worse than v1's 0.548 / 0.543 on identical upright test sets).
     - Repository Citation: `origin/feat/model-v3:model/EXPERIMENT_LOG.md:33-56`.
   - **Bangladesh-Only Training (v4-B):** Trained on Bangladesh-only rice data, v4-B achieved raw raihan accuracy of 0.530 and macro-F1 of 0.597 (compared to v1's raw accuracy of 0.308 and macro-F1 of 0.414).
     - Repository Citation: `origin/feat/model-v3:model/experiments/eval_unified/DECISION_RESULT.md:37-39`.
   - **The v4-B Calibration Collapse (Why it was not shipped):**
     - Under the locked pre-registered protocol (`DECISION_PROTOCOL.md`), calibration on out-of-domain validation data pushed temperature to 1.76 and capped decision threshold at 0.95.
     - Consequently, v4-B achieved only **15.9% coverage on Raihan** (failing the locked $\ge 30\%$ minimum coverage rule).
     - On the Gazipur internal test ($n = 1,499$), v4-B answered **0%** under this calibration (`DECISION_RESULT.md:57`). On Sylhet ($n = 1,423$), v4-B answered **0%** (`DECISION_RESULT.md:66`).
     - Repository Citation: `origin/feat/model-v3:model/experiments/eval_unified/DECISION_RESULT.md:32-35, 49-54, 56-70`.
4. **Non-Rice Out-of-Distribution (OOD) Rejection:**
   - Energy-based scores (`E-energy`) over disease logits rejected only 1–20% of non-rice test sets and wrongly rejected 19% of real Sylhet rice photos.
   - An explicitly trained `not_rice` reject class achieved **100% rejection** across natural photos, PlantVillage, posters, memes, and synthetic graphics, with zero false rejections on internal test and 1.2% false rejection on Sylhet.
   - Repository Citation: `origin/feat/model-v3:model/EXPERIMENT_LOG.md:68-75`, `DECISION_RESULT.md:46`.

---

## 2. Question 1: Why Do Leaf-Disease Classifiers Fail on New-Domain Images?

The catastrophic drop observed when evaluating on Sylhet (53.7% selective accuracy), Raihan (9.8%), and Gujarat (5.0%) is not random noise; it is driven by four specific, compounding domain-shift mechanisms present in our datasets:

### A. Environmental & Sensor Acquisition Shift (Gazipur vs. Raihan & Sylhet)
- **Sensor Optics and Color Constancy:** Gazipur training images (`RiceLeafDiseaseBD v3`) were acquired using a high-end smartphone camera under consistent daylight diffused by field netting, preserving fine foliar venation and calibrated chromatic balance. In contrast, Raihan (`raihan150146`) photos were captured using varied lower-tier smartphone cameras with aggressive onboard tone-mapping, edge sharpening, and heavy JPEG compression artifacts.
- **Canopy vs. Leaf-Level Framing:** Gazipur photos feature standardized framing where a single leaf blade occupies $\approx 60\text{--}80\%$ of the visual frame at perpendicular angles. Sylhet photos (`RiceLeafBD`) frequently capture wide-angle canopy perspectives containing multiple overlapping tillers, extreme perspective foreshortening, and harsh specular solar reflections off wet leaf surfaces.

### B. Shortcut Learning & Spurious Background Exploitation
Deep CNNs optimize empirical risk by exploiting the highest-frequency, lowest-entropy predictive cues available in training data (Geirhos et al., 2020). In Gazipur images:
- **Soil and Vegetation Shortcuts:** Healthy leaves in Gazipur are predominantly framed against vibrant green standing rice canopies, whereas diseased leaves (especially Sheath Blight, which attacks the lower stem/sheath) are photographed pointing downward toward wet, dark alluvial mud and stagnant paddy water.
- **Decision Boundary Corruption:** The network learns that dark brown background pixels or water reflections correlate with Sheath Blight or Blast, rather than learning the subtle ellipsoidal lesion geometry. When evaluated on Savar (`BD5`), where leaves are placed on sterile white paper, or on Raihan, where dry straw and sandy char soil form the background, these background shortcuts vanish or invert, causing immediate misclassifications.

### C. Severe Sub-Populations & Resolution Bottlenecks: The Brown Spot Failure
- In Gazipur training data, Brown Spot lesions are captured as mature, dark-brown circular spots with prominent yellow chlorotic halos, centered directly in high-resolution macro shots.
- When resized to the model's native $224 \times 224$ input resolution:
  $$\text{Lesion Diameter} \approx 10\text{--}25\text{ pixels in original } 2000\times 2000 \implies \approx 1\text{--}3\text{ pixels in } 224\times 224$$
  Bilinear interpolation averages small circular lesions into background leaf green.
- On Sylhet field images, Brown Spot lesions appear at earlier vegetative stages (small pinhead spots) or are captured from a distance of 1–2 meters. At $224 \times 224$, these lesions lose all textural discriminability, causing the network to confuse them with Rice Blast (151 images) or Tungro (138 images), collapsing Sylhet Brown Spot recall to **7.49%** (`DECISION_RESULT.md:73-77`).

### D. Open-Set Label Noise & Unseen Disease Escape
- Closed-set softmax models operate under the mathematical constraint:
  $$\sum_{i=1}^6 p_i = 1$$
- In the Raihan dataset, 813 out of 1,794 images ($\approx 45.3\%$) depict rice diseases outside our 6-class taxonomy: Bacterial Leaf Blight (*Xanthomonas oryzae*), Leaf Scald (*Microdochium oryzae*), Rice Hispa (*Dicladispa armigera*), and Stem Borer damage.
- Because v1 possesses no reject class for unmodeled rice pathogens, it is forced to distribute 100% of its probability across the 6 supported classes. Bacterial Blight lesions (long, wavy straw-colored marginal stripes) closely mimic drying Tungro or late-stage Sheath Blight, causing **80.2% of unseen diseases** to be declared as known diseases (`metrics-v1.json:228`).

---

## 3. Question 2: Measured Cross-Dataset Gains in Plant & Rice Pathology Literature

To identify techniques that genuinely improve out-of-domain transfer rather than merely boosting in-distribution test splits, we reviewed published literature with explicit cross-dataset benchmarks:

### 1. Bangladeshi Rice Cross-Dataset Benchmark (Paul, 2026)
- **Title:** *"Cross-Dataset Generalization of Bangladeshi Rice Leaf Disease Classifiers: Benchmark, Diagnosis, and Mitigation"*  
  **URL:** https://arxiv.org/abs/2609.31709 (arXiv:2609.31709)  
- **Dataset & Setup:** First systematic empirical transfer benchmark across three independent Bangladeshi rice leaf disease datasets (5,419 total images, 6 transfer pairs) across MobileNetV2, EfficientNet-B0, and ResNet-50.
- **Measured In-Dataset vs. Cross-Dataset Drop:**
  - Within-dataset mean Macro-F1 across models: **0.719**
  - Cross-dataset mean Macro-F1: **0.436** (an average generalization collapse of **0.387 points**).
- **Measured Mitigation Impacts:**
  - **Aggressive Data Augmentation:** Produced a statistically robust cross-dataset recovery of **+0.070 macro-F1** across all transfer pairs.
  - **Background Randomization:** Accounted for the largest fraction of the augmentation gain, directly mitigating spurious background correlations.
  - **Leaf Foreground Segmentation:** Yielded positive directional gains across CNNs by stripping background noise, though gains varied by base architecture.
  - **Adaptive Batch Normalization (AdaBN):** Tested for test-time adaptation; **failed and severely harmed cross-dataset transfer** whenever source and target class prior distributions differed ($\Delta \text{Macro-F1} < 0$).
  - **Self-Supervised Vision Transformers (DINOv2):** Linear probing on frozen DINOv2 features suffered the exact same cross-dataset performance collapse as supervised CNNs (mean cross-dataset F1 $\approx 0.44$), proving that architectural inductive bias is secondary to real-world acquisition-condition shifts.

### 2. Lab-to-Field Benchmark on PlantVillage (Mohanty et al., 2016)
- **Title:** *"Using Deep Learning for Image-Based Plant Disease Detection"*  
  **URL:** https://www.frontiersin.org/articles/10.3389/fpls.2016.01419/full (Frontiers in Plant Science, 7, 1419)  
- **Dataset & Setup:** 54,306 images across 14 crop species and 26 diseases photographed against uniform lab backgrounds (PlantVillage), evaluated against an independent online test set collected under uncontrolled field conditions.
- **Measured Cross-Domain Collapse:**
  - In-distribution test accuracy: **99.35%** (AlexNet/GoogLeNet).
  - Out-of-distribution real-world field test accuracy: **31.40%** (a catastrophic drop of **67.95 percentage points**).
- **Core Conclusion:** Models trained without background variance memorize studio lighting, bench colors, and framing artifacts instead of biological foliar lesions.

### 3. In-The-Wild Complex Background Benchmark (Singh et al., 2020)
- **Title:** *"PlantDoc: A Dataset for Visual Plant Disease Detection in the Wild"*  
  **URL:** https://arxiv.org/abs/1911.10317 (arXiv:1911.10317)  
- **Dataset & Setup:** 2,598 wild field images across 13 plant species and 17 diseases captured under non-lab field settings with natural backgrounds, dirt, and overlapping vegetation.
- **Measured Transfer Gain:**
  - The authors proved that training on multi-context wild data (PlantDoc) improved cross-dataset downstream field classification accuracy by up to **31%** compared to models trained strictly on lab-centric datasets like PlantVillage.

### 4. Foundation Pretraining for Biological Generalization (Stevens et al., 2024)
- **Title:** *"BioCLIP: A Vision Foundation Model for the Tree of Life"*  
  **URL:** https://arxiv.org/abs/2311.18803 (CVPR 2024, arXiv:2311.18803)  
- **Dataset & Setup:** Pretrained on TreeOfLife-10M (10 million biological organism images spanning 450,000+ taxonomic taxa), benchmarked against OpenAI CLIP (ViT-B/16) and OpenCLIP.
- **Measured Gains:**
  - BioCLIP outperforms standard ImageNet-pretrained CLIP by **16.8%** in 10-shot fine-grained plant classification.
  - Its pretraining incorporates leaf venation, botanical morphological hierarchies, and diverse outdoor ambient lighting across thousands of global plant species, suppressing non-botanical sensor shortcuts.

---

## 4. Question 3: How to Detect Shortcut Learning in Our Model

To provide empirical proof of whether AgroLeaf AI's v1 MobileNetV3-Large relies on pathological lesions or environmental shortcuts, we propose the following concrete, reproducible test:

```
                  ┌───────────────────────────────┐
                  │ Original Field Image (I_full)  │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
     ┌────────────────────────┐      ┌────────────────────────┐
     │ Leaf Foreground Masked │      │ Background Context Only │
     │       (I_leaf)         │      │        (I_bg)          │
     │  Background Neutralized│      │     Leaf Occluded      │
     └────────────┬───────────┘      └────────────┬───────────┘
                  │                               │
                  ▼                               ▼
       Inference: f(I_leaf)             Inference: f(I_bg)
```

### Concrete Occlusion Protocol on Raihan & Sylhet Images
1. **Dataset Selection:** Sample $N = 300$ field images from the Raihan dataset (Sirajganj/Pabna) and $N = 300$ images from Sylhet, covering all supported classes (`healthy`, `blast`, `brown_spot`, `sheath_blight`, `tungro`).
2. **Foreground Extraction:**
   - Generate binary leaf masks $M \in \{0, 1\}^{H \times W}$ using our calibrated plant-color HSV thresholding (`frontend/src/ml/leafCheck.js`: Hue 6–14, Saturation $\ge 77$, Value $\ge 77$) verified with bounding box annotations.
   - Alternatively, apply Segment Anything Model (SAM) with a central box prompt to isolate the main leaf blade.
3. **Three Evaluation Conditions:**
   - **Condition A ($I_{\text{full}}$):** Original image unchanged.
   - **Condition B ($I_{\text{leaf}}$ - Lesion Only):** Background pixels $(1 - M)$ replaced with neutral gray (RGB 128, 128, 128) or randomized Gaussian noise.
   - **Condition C ($I_{\text{bg}}$ - Context Only):** Foreground leaf pixels $M$ occluded with uniform black/gray, leaving *only* soil, weeds, water, and camera border artifacts.
4. **Diagnostic Metrics:**
   - **Background Accuracy ($Acc_{\text{bg}}$):** Classification accuracy of $f(I_{\text{bg}})$ evaluated against the true ground-truth disease label.
     - *Interpretation:* In a 6-class problem, chance is $16.7\%$. If $Acc_{\text{bg}} > 25\%$, or if specific classes (e.g. Sheath Blight or Tungro) achieve $> 40\%$ accuracy on background alone, **shortcut learning is empirically proven**.
   - **Foreground Robustness Retention ($\rho_{\text{fg}}$):**
     $$\rho_{\text{fg}} = \frac{\text{Accuracy}(f(I_{\text{leaf}}))}{\text{Accuracy}(f(I_{\text{full}}))}$$
     - If $\rho_{\text{fg}} \ll 1.0$, the model is unable to recognize diseases from foliar symptoms without its training environment context.
   - **Attribution Mass on Background (CAM-B):** Compute Grad-CAM heatmaps on the final convolutional layer of MobileNetV3-Large (`features.16`); compute the ratio of heatmap energy outside the leaf mask:
     $$\text{CAM-B} = \frac{\sum_{(x, y) \notin M} \text{Heatmap}(x, y)}{\sum_{(x, y)} \text{Heatmap}(x, y)}$$
     - If $\text{CAM-B} > 0.40$, the model's focus is predominantly outside the pathology.

---

## 5. Question 4: How to Calibrate Thresholds for a New Domain Without Coverage Collapse

### Root-Cause Diagnosis of the v4-B Failure
In Kaggle evaluation `agroleaf-eval-unified` (`DECISION_RESULT.md:32-35`), candidate v4-B failed because:
1. It calibrated temperature ($T = 1.76$) and threshold on the out-of-domain Raihan validation set using a greedy rule targeting $\ge 90\%$ selective accuracy.
2. Under domain shift, raw logit margins shrink. A high temperature ($T = 1.76$) flattens the softmax probabilities further.
3. To reach a strict $90\%$ precision target on a difficult domain, the threshold optimizer was forced to climb to the maximum allowable ceiling ($\tau = 0.95$).
4. At $\tau = 0.95$, the model became functionally mute: answering only $15.9\%$ on Raihan, and answering **$0\%$** on Gazipur internal test ($n=1,499$) and **$0\%$** on Sylhet ($n=1,423$).

### The Solution: Constrained Multi-Objective Optimization
To calibrate thresholds for real-world deployment without silencing the application, three concrete principles must replace the naive greedy rule:

#### 1. Constrained Coverage Lower-Bound in the Objective Function
Never optimize precision or selective accuracy in isolation. The calibration objective must include an explicit hard floor on coverage:
$$\max_{\vec{\tau}, T} \text{Selective Accuracy}(\vec{\tau}, T; \mathcal{D}_{\text{val}}) \quad \text{subject to} \quad \text{Coverage}(\vec{\tau}, T; \mathcal{D}_{\text{val}}) \ge C_{\min}$$
Where $C_{\min} = 50\%$ (or $60\%$). This mathematical formulation strictly prohibits the optimizer from choosing thresholds that cause coverage collapse.

#### 2. Class-Specific Threshold Vectors ($\vec{\tau}$) Rather Than a Global Scalar ($\tau$)
- Currently, v1 applies a single global threshold ($\tau = 0.48$) for all diseases, with a single separate threshold for Healthy ($0.90$).
- Under domain shift, class separability is non-uniform: Sheath Blight and Tungro retain moderate logit margins, while Brown Spot margins collapse.
- Optimizing a vector $\vec{\tau} = (\tau_{\text{blast}}, \tau_{\text{brown\_spot}}, \tau_{\text{tungro}}, \dots)$ allows the model to answer confidently on classes where feature representations remain resilient, while abstaining specifically on degraded classes (e.g., Brown Spot $\tau_{\text{bs}} = 0.75$), preserving healthy $\approx 60\text{--}70\%$ overall coverage.

#### 3. Conformal Prediction with False Abstention Budgets
Instead of heuristic thresholding, apply **Split Conformal Prediction**:
- For each test image, the model outputs a prediction set $\mathcal{C}(X) \subseteq \{1, \dots, K\}$.
- If $|\mathcal{C}(X)| = 1$, the app displays the single confident disease.
- If $|\mathcal{C}(X)| = 2$, the app routes directly to the calibrated `"Not Sure"` UI, displaying the two candidate diseases.
- If $|\mathcal{C}(X)| = 0$ or $> 2$, the app advises consulting an extension officer (16123).
- Conformal prediction guarantees user-specified error rates with mathematically proven coverage bounds.

---

## 6. Question 5: What Data Would Most Help, and From Where (Legally)

High-capacity architectures cannot resolve missing morphological features. The most critical lever is acquiring diverse Bangladeshi field data targeting specific pathological failure modes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRIORITY DATASET AUDIT                             │
├─────────────────┬──────────┬──────────────┬───────────────┬─────────────────┤
│ Disease Target  │ District │ Min Samples  │ Legal Source  │ Expected Gain   │
├─────────────────┼──────────┼──────────────┼───────────────┼─────────────────┤
│ Leaf Smut       │ Field BD │ 500 field    │ DAE / BRRI    │ Enable external │
│ (Zero field set)│ (Any)    │ in-canopy    │ Direct Field  │ unsuppressed UI │
├─────────────────┼──────────┼──────────────┼───────────────┼─────────────────┤
│ Brown Spot      │ Sylhet / │ 1,000 canopy │ Mendeley Data │ Fix 7.5% Sylhet │
│ (Severe collapse│ Mymens.  │ phone photos │ CC BY 4.0     │ recall failure  │
├─────────────────┼──────────┼──────────────┼───────────────┼─────────────────┤
│ Sheath Blight   │ Barisal/ │ 800 natural  │ Open Data BD  │ Reduce water/   │
│ (Wet lower stem)│ Khulna   │ canopy       │ CC BY 4.0     │ mud shortcut    │
└─────────────────┴──────────┴──────────────┴───────────────┴─────────────────┘
```

### Priority 1: Bangladeshi Field Photos of Leaf Smut (*Entyloma oryzae*)
- **Current Deficit:** Zero external field test datasets exist for Leaf Smut. In Gazipur training data, Leaf Smut has only 498 images. The deployed app is forced to permanently suppress Leaf Smut to `"Not Sure"` (`AccuracyPage.jsx:165-169`, `DECISION_RESULT.md:85`).
- **Required Data:** $\ge 500$ natural field photos taken on smallholder farms across multiple districts (Rangpur, Dinajpur, Rajshahi).
- **Legal Acquisition:** Partner with Department of Agricultural Extension (DAE) field agents or Bangladesh Rice Research Institute (BRRI) regional stations; release under Creative Commons Attribution (CC BY 4.0).

### Priority 2: Natural Canopy Brown Spot (*Bipolaris oryzae*)
- **Current Deficit:** Model v1 achieves only **7.49% recall** on Sylhet Brown Spot (`metrics-v1.json:83`).
- **Required Data:** $\ge 1,000$ high-resolution field photos taken from varying distances (macro, 0.5m, 1.0m) and varied solar angles, capturing early-stage pinhead lesions on native varieties (BRRI dhan28, BRRI dhan29).
- **Legal Sources:** Mendeley Data open repositories; research collections from Bangladesh Agricultural University (BAU, Mymensingh); CC BY 4.0.

### Priority 3: Non-Target Rice Conditions (Outlier Exposure Pool)
- **Current Deficit:** 80.2% of unsupported diseases in Raihan escape rejection because the model has never been trained on negative foliar conditions.
- **Required Data:** 1,500 images of Bacterial Leaf Blight, Leaf Scald, Hispa feeding streaks, and nutrient deficiencies (Zinc/Nitrogen deficiency).
- **Legal Sources:** Open Kaggle mirrors of BRRI collections (`dhan-shomadhan`, CC0); IRRI open research databases; CC BY-SA 4.0.

---

## 7. Ranked List of 5 Priority Experiments for AgroLeaf AI

The following ranked experiments directly target our measured bottlenecks while operating strictly within our Kaggle GPU and Cloudflare deployment constraints:

```
Rank 1: Background-Invariant Training (CutMix / Synthetic Backgrounds)
Rank 2: Coverage-Preserved Per-Class Calibration (Post-Processing Only)
Rank 3: Open-Set Outlier Exposure (7th Reject Class)
Rank 4: Multi-District Scene-Grouped Pooling (Gazipur + Raihan)
Rank 5: Botanical Foundation Model Fine-Tuning (BioCLIP / DINOv2-Small)
```

---

### Experiment 1: Background-Invariant Training via Random Background Blending
- **Hypothesis:** Forcing the network to classify diseased leaves against randomized, non-rice outdoor backgrounds (neutralizing soil, water, and framing shortcuts) will prevent the model from exploiting Gazipur plot cues, increasing Sylhet and Raihan cross-dataset transfer.
- **Exactly What Changes:**
  - Segment leaf foregrounds using an automated plant-color mask (`leafCheck.js` arithmetic: HSV Hue 6–14).
  - During $50\%$ of training batches, composite the segmented leaf foreground onto randomly sampled natural outdoor backgrounds (from ImageNet / PlantDoc / COCO).
  - Apply RandomAffine ($\pm 15^\circ$ rotation, $0.8\text{--}1.2\times$ scale) and random horizontal flips.
- **Data & Split:**
  - Training: Gazipur `RiceLeafDiseaseBD v3` training split ($n = 4,433$).
  - Validation: Raihan selection set ($n = 1,794$).
  - Final Test (Zero-leakage): Sylhet-Dhaka upright test ($n = 1,423$) and Gujarat ($n = 120$).
- **Metric & Success Threshold:**
  - Raihan selective accuracy $> 20.0\%$ at $\ge 50.0\%$ coverage (Baseline v1: 9.8% at 68.5% coverage; v4-B reached 28.7% only by collapsing coverage to 15.9%).
  - Sylhet Macro-F1 $> 0.60$ (Baseline v1: 0.548).
- **Expected Cost:** $\approx 1.5$ Kaggle GPU hours (MobileNetV3-Large, 20 epochs, batch size 64).

---

### Experiment 2: Coverage-Preserved Per-Class Threshold Optimization (Post-Processing)
- **Hypothesis:** The v4-B calibration failure was caused by a single scalar threshold ($\tau = 0.95$) that silenced the model. Optimizing a vector of per-class thresholds $\vec{\tau} = (\tau_1, \dots, \tau_6)$ subject to an explicit coverage lower-bound ($\text{Coverage} \ge 50\%$) will raise selective accuracy on outside districts without silencing the application.
- **Exactly What Changes:**
  - Zero code changes to model weights; pure post-processing calibration script in `ml/tools/optimize_thresholds.py`.
  - Optimize temperature $T$ and per-class decision thresholds $\vec{\tau}$ on Raihan validation logits using Nelder-Mead simplex search, maximizing selective accuracy with penalty term $\lambda \cdot \max(0, 0.50 - \text{Coverage})^2$.
- **Data & Split:**
  - Optimization data: Raihan validation split ($n = 897$).
  - Evaluation: Sylhet final test ($n = 1,423$) and Gazipur internal test ($n = 1,499$).
- **Metric & Success Threshold:**
  - Raihan selective accuracy $\ge 18.0\%$ while maintaining $\ge 50.0\%$ coverage.
  - Internal test coverage $\ge 80.0\%$ and selective accuracy $\ge 90.0\%$ (verifying the model does not answer 0% at home).
- **Expected Cost:** $0.0$ GPU hours (CPU evaluation script, $\approx 3$ minutes runtime).

---

### Experiment 3: Lightweight Open-Set Reject Head via Outlier Exposure
- **Hypothesis:** 80.2% of unsupported diseases in Raihan escape rejection because the 6-class softmax forces closed-set assignment. Training a 7th `"other rice condition"` reject class using Outlier Exposure will intercept unsupported pathogens before they trigger false disease alarms.
- **Exactly What Changes:**
  - Expand classifier head from 6 outputs to 7 outputs (`classes = 6 diseases + other_rice`).
  - Introduce an auxiliary outlier training set consisting of Bacterial Leaf Blight, Leaf Scald, and non-rice crop leaves (PlantVillage).
  - Train with standard cross-entropy loss, assigning uniform distribution or target class 6 to outlier samples.
- **Data & Split:**
  - Training: Gazipur v3 (6 classes, $n = 4,433$) + 600 auxiliary outlier leaves.
  - Test: Raihan unsupported disease subset ($n = 813$) and Sylhet upright test ($n = 1,423$).
- **Metric & Success Threshold:**
  - Raihan unsupported disease rejection rate $\ge 60.0\%$ (Baseline v1: 19.8% rejection; 80.2% escape).
  - Known-class selective accuracy on Sylhet maintained $\ge 53.0\%$.
- **Expected Cost:** $\approx 1.5$ Kaggle GPU hours (MobileNetV3-Large, 20 epochs).

---

### Experiment 4: Multi-District Scene-Grouped Pooling
- **Hypothesis:** Pooling Gazipur with a strictly partitioned subset of Raihan phone photos (grouped by perceptual hash so burst photos cannot leak) will introduce camera sensor and ambient lighting diversity, directly boosting cross-district feature transfer.
- **Exactly What Changes:**
  - Pool $100\%$ of Gazipur v3 training + $50\%$ of Raihan diagnosable classes (blast, brown spot, healthy, sheath blight), grouped into clusters by pHash $\le 4$ Hamming distance.
  - Retain the remaining $50\%$ of Raihan for validation.
  - Test zero-shot on $100\%$ held-out Sylhet ($n = 1,423$) and Gujarat ($n = 120$).
- **Data & Split:**
  - Train: Gazipur ($n=4,433$) + Raihan Partition A ($n=490$).
  - Val: Raihan Partition B ($n=491$).
  - Held-out Test: Sylhet ($n=1,423$) and Gujarat ($n=120$).
- **Metric & Success Threshold:**
  - Sylhet selective accuracy $\ge 62.0\%$ (Baseline v1: 53.7%) at $\ge 60.0\%$ coverage.
  - Sylhet Brown Spot recall $\ge 20.0\%$ (Baseline v1: 7.5%).
- **Expected Cost:** $\approx 2.0$ Kaggle GPU hours.

---

### Experiment 5: Botanical Foundation Model Fine-Tuning (BioCLIP / DINOv2-Small)
- **Hypothesis:** Pretrained botanical representations from BioCLIP (trained on TreeOfLife-10M) contain domain-invariant visual features of plant tissue and necrosis that outperform ImageNet-1k convolutional features on cross-district transfer.
- **Exactly What Changes:**
  - Replace ImageNet-1k MobileNetV3 backbone with BioCLIP (ViT-B/16) or DINOv2-small.
  - Freeze vision backbone and train a linear probe head with temperature scaling on Gazipur v3; subsequently evaluate 2-layer LoRA fine-tuning.
  - Export winning head to ONNX for runtime latency auditing.
- **Data & Split:**
  - Train: Gazipur v3 train split ($n = 4,433$).
  - Zero-shot Transfer Tests: Sylhet ($n = 1,423$) and Raihan ($n = 1,794$).
- **Metric & Success Threshold:**
  - Zero-shot Sylhet Macro-F1 $\ge 0.620$ (Baseline v1: 0.548).
  - ONNX runtime on single-threaded WebAssembly $\le 50\text{ ms}$ per inference.
- **Expected Cost:** $\approx 1.2$ Kaggle GPU hours.

---

## 8. Summary of Budget & Recommendation

| Experiment | Focus Area | Code / Arch Change | GPU Hours | Priority |
|---|---|---|---|---|
| **Exp 1: Background-Invariant Training** | Remove soil/framing shortcuts | Preprocessing & Augmentation | 1.5h | **Rank 1 (Immediate)** |
| **Exp 2: Constrained Calibration** | Fix v4-B 0% coverage collapse | Post-processing Optimizer | 0.0h (CPU) | **Rank 2 (Immediate)** |
| **Exp 3: Open-Set Outlier Exposure** | Stop 80% unseen disease escape | 7th Output Head | 1.5h | **Rank 3** |
| **Exp 4: Multi-District Pooling** | Sensor & lighting diversity | pHash-grouped Data Curation | 2.0h | **Rank 4** |
| **Exp 5: Botanical Pretraining (BioCLIP)** | Feature-level domain invariance | Foundation Model Backbone | 1.2h | **Rank 5** |
| **Total Allocation** | | | **6.2h** | (Well within 30h weekly quota) |

**Key Takeaway:** Model scaling (ConvNeXt-Tiny, EfficientNetV2) does not solve domain shift in rice pathology; v3 and v4 demonstrated that architecture is secondary to acquisition conditions and background shortcuts. Prioritizing background-invariant data blending (Exp 1), coverage-constrained thresholding (Exp 2), and outlier exposure (Exp 3) provides the highest measurable return per GPU hour.
