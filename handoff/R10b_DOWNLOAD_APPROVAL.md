# R10b — Catalogue reviewed: go ahead with downloads, with these corrections (for Antigravity)

Paste everything below the line into Antigravity.

---

Your R10 catalogue is approved for the next steps (download → dedup → label audit). A lead spot-check on 3 Nov 2026 found problems you must handle first.

## Corrections from the spot-check
1. **The 96,604 total is not a unique count.** Never quote it as one.
   - `minhhungg/rice-disease-dataset`: the dataset card says 37,978 images, but the viewer shows **healthy 1.88k + pests 7.14k + diseases 8.86k + nutrition 1.16k ≈ 19k** in the "original" splits. Train + validation + test add up to 37,978.
   - So the 37,978 probably counts each image twice. Dedup will decide; record what you find.
2. **Mendeley `n8jpkpfz5p` (Hasan et al.)** is published by **Dhaka International University**, the same institution as our DIU dataset. The page does **not** state any district; "multi-district" is not verified.
   - Its class counts add up to 6,712, but the page says 6,758.
   - **Check it with pHash against the DIU dataset (both halves) before anything else.** If it overlaps DIU half B, the overlapping images are test contamination and must be dropped.
3. **Roboflow sets are often exported pre-augmented** (rotated or flipped copies, `.rf.` file names). Count unique originals only.
4. **Kaggle sets with licence "unknown" / "not stated"** are allowed under the owner's rule. Still record the source URL for every image.
5. Earlier evidence: adding India/Vietnam data (run v6) **did not help** on the unseen Sylhet district. Adding Bangladeshi field photos (v10, DIU) **did** help on photos like them.
   - **So prioritise Bangladeshi field sources.** Treat the foreign sets as extra volume, and report per-country counts.

## Freeze a NEW held-out test set BEFORE any training data is chosen
All our earlier independent tests have been used. Pick **one whole Bangladeshi source that will never be trained on**:
- field photos, not augmented;
- ideally including brown spot and tungro;
- at least 1,000 images after dedup.

Suggested order to check:
1. `abuabdurrahman1101/rice-disease-leaves` (2,100, BD) combined with the Roboflow "Rice Leaf Disease (Ashikur Rahman)" BD set (tungro and leaf smut), if its originals survive dedup.
2. Otherwise propose another one.

Rules:
- Write the choice in `data/expansion_r10/new_test_set_proposal.md` and **commit it before downloading the training sources' images in bulk**.
- Remove every training image within 8 pHash bits of the frozen test set.

## Then
1. Download only the approved, non-reupload sources into `D:\aldata\raw\<source_slug>\`, with sha256 logged.
2. Dedup in this order:
   - against the protected test sets (Sylhet, Aman 2025, Gujarat **and the new frozen test**) → must be **0**;
   - against the existing training sources, including both DIU halves;
   - across the new sources.
3. Run the label audit (about 30 images per source per class; reject a source with more than 10% wrong, augmented or non-leaf images).
4. Write `SUMMARY.md` with the **real unique count per class and per country**, and how far it falls short of each class target.
5. Do **not** train. The lead trains v11 on Kaggle from your `dedup_keep.csv`, with a written protocol, once the summary is in.

Same hard rules as R10 (no keys in files, `ai_battle` untouched, no fabricated numbers, mark anything you could not verify as UNVERIFIED).
