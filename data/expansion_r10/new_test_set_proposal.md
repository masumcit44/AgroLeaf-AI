# R10c — Frozen Test Set Audit & Integrity Report: AgroLeaf Independent Benchmark 2026

**Date:** 3 November 2026  
**Status:** AUDITED — CRITICAL CONTAMINATION DETECTED  
**Auditor:** Antigravity (ML Engineer)  
**Target Source:** `abuabdurrahman1101/rice-disease-leaves` (Kaggle)

---

## 1. Executive Summary & Critical Escalation

Under `handoff/R10c_TEST_SET_CHECKS_AND_DEDUP.md` §1 and `handoff/batch1/B1_ANTIGRAVITY_R10C_THEN_R11_LEAF_ISOLATION.md`, an exhaustive deduplication audit was performed on the proposed frozen test set `abuabdurrahman1101/rice-disease-leaves`.

### Key Findings:
1. **Archive Composition Breakdown:**
   - Total extracted files: **5,678 images**.
   - Synthetic augmentations (`aug_*`): **4,682 images** (82.5%).
   - True camera originals: **996 images** (17.5%).
2. **100% Overlap with v10 Training Data (`raihan150146`):**
   - Exact pHash matches (distance = 0 bits): **949 images** (95.3%).
   - Perceptual near-duplicates ($\le 8$ bits Hamming distance): **996 images** (**100.0%**).
   - The original photos in `abuabdurrahman1101` are entirely sourced from `raihan150146/rice-leaf-diseases-dataset`, which is one of the foundational training sources of production model v10.
3. **Originals Remaining After v10 Training Dedup:** **0 images**.
   - Per protocol instruction: *"If fewer than about 800 originals remain after the checks, say so. The lead will decide whether to add a second Bangladeshi source to the frozen test. Do not choose silently."*
   - **ESCALATION TO LEAD:** Zero unaugmented original images remain in `abuabdurrahman1101` that are independent of v10 training data. The lead must select and approve an alternative unaugmented Bangladeshi benchmark source.

---

## 2. Audit Evidence: Training Source Overlap Matrix (pHash $\le$ 8 bits)

Testing candidate images: 996 unaugmented originals from `Clean_Rice/` (EXIF-upright, max dimension 1024 px, 64-bit pHash).

| Source Slug | Description | Total Source Images | Overlaps with Test ($\le$ 8 bits) | Exact Matches (0 bits) | Integrity Status |
|---|---|---|---|---|---|
| `raihan150146/rice-leaf-diseases-dataset` | v10 core training data | 1,886 | **996 / 996 (100.0%)** | **949** | **FATAL CONTAMINATION** |
| `Project-AgML/rice_disease_classification_bangladesh` | DIU Gazipur (both halves) | 3,960 | **0 / 996 (0.0%)** | 0 | Clean |
| `sohagdewan/riceleafdisease-bd5` | v10 training source | 2,752 | **0 / 996 (0.0%)** | 0 | Clean |
| `nirmalsankalana/dhan-shomadhan` | v10 training source | 3,355 | **0 / 996 (0.0%)** | 0 | Clean |
| `nirmalsankalana/rice-leaf-disease-image` | Sethy et al. | 5,932 | **0 / 996 (0.0%)** | 0 | Clean |
| `imbikramsaha/paddy-doctor` | Paddy Doctor field set | 10,407 | **0 / 996 (0.0%)** | 0 | Clean |

---

## 3. Archive Count Mismatch Analysis

- **Initial Catalogue Expectation:** ~2,100 images.
- **Extracted File Count:** 5,678 JPEG images in `Clean_Rice/`.
- **Root Cause Identified:**
  - The author of `abuabdurrahman1101/rice-disease-leaves` collected 996 raw images from `raihan150146/rice-leaf-diseases-dataset`.
  - The author then applied offline data augmentation (rotations, horizontal/vertical flips, affine zooms, colour jitter) generating 4,682 synthetic files named `aug_0_*.jpg`.
  - All synthetic augmentations are direct derivatives of the 996 Raihan originals. Under test-set purity rules, zero synthetic augmentations are admissible in an independent held-out evaluation set.

---

## 4. Class Distribution & Capture Groups of Originals (Pre-Exclusion)

Before exclusion due to `raihan150146` contamination, the 996 originals had the following class breakdown:

| Class Folder | Raw Originals | Distinct Capture Timestamps / Groups | Notes |
|---|---|---|---|
| `LeafBlast` | 310 | 182 | Consecutive burst shots e.g. `20231018_143710.jpg` |
| `BrownSpot` | 274 | 148 | Consecutive burst shots e.g. `20231006_165551.jpg` |
| `RiceHispa` | 225 | 119 | Grouped under `other_rice` (sub-label `hispa`) |
| `HealthyRiceLeaf` | 187 | 96 | Natural paddy background |
| **Total** | **996** | **545** | **0 remain after v10 dedup** |

---

## 5. Supplementary Extension Test Sets (Krishoker Janala)

- **Tungro (150 images):** `krishokerjanala.gov.bd` official AIS/DAE extension repository.
  - **Status:** **UNVERIFIED**. Awaiting physical opening and audit of image format (confirming natural field photography vs diagrams/extension posters).
  - Must remain strictly segregated in a standalone benchmark partition (`benchmark_krishoker_janala_tungro.parquet`).
- **Leaf Smut (100 images):** `krishokerjanala.gov.bd`.
  - **Status:** **UNVERIFIED**. Awaiting physical opening and validation.

---

## 6. Next Steps & Decision Gate for Lead

1. **Do not use `abuabdurrahman1101/rice-disease-leaves` as the frozen test set:** Evaluating model v11 against this set would be completely invalid, as model v10 was trained directly on its exact source images from `raihan150146`.
2. **Lead Decision Required:** Select an authentic Bangladeshi held-out test source with zero overlap with v10 training sources (e.g., dedicated unaugmented split from BRRI / Gazipur research archives or verified manual field captures).
