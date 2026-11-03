# R10b — New Held-Out Test Set Proposal: AgroLeaf Independent Benchmark 2026

**Date:** 3 November 2026  
**Status:** FROZEN BEFORE BULK TRAINING DOWNLOADS  
**Role:** Permanent Independent Benchmark (Held Out Entirely; Never Trained On)

---

## 1. Executive Selection

In accordance with `handoff/R10b_DOWNLOAD_APPROVAL.md` Section 2, all prior independent test sets (`RiceLeafBD` Sylhet-Dhaka DOI: 10.17632/kx9rx8p2mz.1, `Aman 2025` Zenodo: 10.5281/zenodo.21140529, and `Gujarat UCI` UCI 486) have been used to evaluate previous iterations up to model v10.

To maintain strict scientific integrity and avoid benchmark contamination, we hereby propose and **freeze** a new, unaugmented, authentic Bangladeshi field dataset:

### Primary Frozen Test Set: `abuabdurrahman1101/rice-disease-leaves`
- **Kaggle Source:** [`abuabdurrahman1101/rice-disease-leaves`](https://www.kaggle.com/datasets/abuabdurrahman1101/rice-disease-leaves)
- **Archive File:** `rice-disease-leaves.zip` (1,044,789,897 bytes, ~1.04 GB)
- **Archive SHA-256:** `d08a6ec1dec198489d96e95abddc963be8fea92e4227692b42989a68caa708a0`
- **Total Images as Extracted:** 5,678 JPEG images
- **Total Unique Images (pHash > 8 bits):** **5,234 images**
- **Country & Capture:** Bangladesh, Aman season (field capture timestamp: October 6, 2023)
- **Capture Type:** Natural in-field smartphone photography (rice paddies, soil, natural daylight, unconstrained leaf orientations, zero synthetic augmentation)

---

## 2. Per-Class Composition & Mapping

| Source Folder | Raw Count | Kept Unique (> 8 bits pHash) | Internal Drop Rate | App Model Class | App Target Priority |
|---|---|---|---|---|---|
| `Clean_Rice/BrownSpot` | 1,546 | **1,392** | 9.9% | `brown_spot` | **Highest priority** (weakest class on Sylhet) |
| `Clean_Rice/LeafBlast` | 1,748 | **1,574** | 9.9% | `blast` | Core disease class |
| `Clean_Rice/HealthyRiceLeaf` | 1,085 | **1,044** | 3.8% | `healthy` | False Healthy Safety Gate check |
| `Clean_Rice/RiceHispa` | 1,299 | **1,224** | 5.8% | `other_rice` (sub-label: `hispa`) | Key Bangladeshi pest / reject class |
| **Total** | **5,678** | **5,234** | **7.8%** | — | **5.2x the 1,000-image requirement** |

---

## 3. Supplementary Coverage for Tungro & Leaf Smut

While `abuabdurrahman1101/rice-disease-leaves` provides massive, clean field coverage for Brown Spot (1,392), Blast (1,574), Healthy (1,044), and Hispa/Other Rice (1,224), it does not cover Tungro or Leaf Smut.

To complete the 8-class benchmark without contaminating training:
1. **Tungro:** 150 authentic field diagnostic photos from the Bangladesh Department of Agricultural Extension (`krishokerjanala.gov.bd` AIS DAE official extension repository) are held out exclusively in the test partition.
2. **Leaf Smut:** 100 authentic field photos from the same Bangladeshi agricultural extension network are held out exclusively in the test partition.

---

## 4. Frozen Dedup Protection Rules

1. **Zero Contamination Rule:** Every image in the frozen test set has its 64-bit perceptual hash (EXIF-upright, max dimension capped at 1024 px) catalogued into `data/expansion_r10/frozen_test_hashes.parquet`.
2. **Drop Threshold:** Any image from any candidate training source with Hamming distance $\le 8$ bits from any image in this frozen test set will be **immediately and unconditionally dropped** from training data.
3. **Training Exclusion:** No image, crop, or augmented derivative of `abuabdurrahman1101/rice-disease-leaves` will ever be added to `dedup_keep.csv` or passed to Kaggle training kernels.
4. **Commit Gate:** This document is committed to git **before** downloading or compiling training data in bulk, ensuring timestamped proof of pre-registration.
