# R10 — Manual Dataset Download Guide for Owner

**Generated:** 3 November 2026  
**Purpose:** Instructions for downloading Candidate Test Set archives that block automated scrapers via Cloudflare / S3 restrictions.

---

## Candidate 1: Mendeley Data (Hasan et al., Dhaka International University)

- **Source Slug:** `mendeley_n8jpkpfz5p`
- **Target Folder:** `D:\aldata\raw\mendeley_n8jpkpfz5p\`
- **Dataset Title:** *A Rice Leaf Disease Image Dataset for Multi-Class Disease Classification*
- **URL:** [https://data.mendeley.com/datasets/n8jpkpfz5p/1](https://data.mendeley.com/datasets/n8jpkpfz5p/1)
- **Action / Button:** Click the blue **"Download All 1.92 GB"** button located at the top right of the page header.
- **Expected File Name:** `A Rice Leaf Disease Image Dataset for Multi-Class Disease Classification.zip` (or `n8jpkpfz5p-1.zip`)
- **Expected File Size:** ~1.92 GB (approx. 2,060,000,000 bytes)
- **Extraction Instruction:** Extract the zip into `D:\aldata\raw\mendeley_n8jpkpfz5p\extracted\` so that class folders (`Healthy`, `brown_spot`, `tungro`, `leaf_blast`, etc.) are directly visible.

---

## Candidate 2: Harvard Dataverse (BanglaRiceLeaf, BRRI Gazipur 2023–24)

- **Source Slug:** `harvard_banglariceleaf`
- **Target Folder:** `D:\aldata\raw\harvard_banglariceleaf\`
- **Dataset Title:** *BanglaRiceLeaf: A Benchmark Dataset for Automated Rice Leaf Disease Detection and Health Classification in Bangladesh*
- **DOI:** `doi:10.7910/DVN/XAOBYW`
- **URL:** [https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XAOBYW](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XAOBYW)
- **Action / Button:** 
  1. Click the blue **"Access Dataset"** button in the upper right.
  2. Select **"Download ZIP"** (or under the "Files" tab, check "Select All" and click "Download").
- **Expected File Name:** `BanglaRiceLeaf.zip` (or Dataverse package zip)
- **Expected File Size:** ~4,152 images (approx. 1.5–2.5 GB)
- **Extraction Instruction:** Extract into `D:\aldata\raw\harvard_banglariceleaf\extracted\`.

---

## Candidate 3: Roboflow "Rice Leaf Disease (Ashikur Rahman)" — AUDIT STATUS: DISQUALIFIED

- **URL:** `https://universe.roboflow.com/ashikur-rahman-w90i0/rice-leaf-disease`
- **Audit Finding:** The workspace contains only **~156 total images**.
- **Result:** **Disqualified** under R10 criteria requiring $\ge 800$ unaugmented original photos. No download needed.
