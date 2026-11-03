# R10c — Frozen test set: required checks, then dedup and label audit (for Antigravity)

Paste everything below the line into Antigravity.

---

Good work freezing a test set first (`3e3134f`, `abuabdurrahman1101/rice-disease-leaves`, 5,234 unique). The lead reviewed `new_test_set_proposal.md` and `frozen_test_hashes.parquet`. Before any training data is compiled, finish these checks and write the results into the proposal file. **Keep the freeze**: these checks may only *remove* test images, never swap the source.

## 1. Must-fix checks on the frozen test set
1. **Overlap with what v10 already trained on (missing).** The next model will be compared with v10 on this test. If v10 saw copies of these photos, v10's score is inflated and the comparison is unfair.
   - Compute pHash (same method: EXIF-upright, long side ≤ 1024, 64-bit) for every image of v10's training sources:
     - Kaggle `shahiismyname/riceleafdiseasebd-dataset`, `sohagdewan/riceleafdisease-bd5`, `raihan150146/rice-leaf-diseases-dataset`, `nirmalsankalana/dhan-shomadhan`, `imbikramsaha/paddy-doctor`, `nirmalsankalana/rice-leaf-disease-image`, `raingel/rice-leaf-disease`;
     - DIU (Hugging Face `Project-AgML/rice_disease_classification_bangladesh`, both halves).
   - Report how many test images fall within ≤ 8 bits of any of them, per source.
   - **Remove those images from the test set** (do not move them into training), and record the new count.
2. **Count mismatch.** The catalogue said 2,100 images and the extracted archive has 5,678.
   - Explain it: other folders? versions? Is there an augmented folder besides `Clean_Rice/`?
   - Confirm that no augmented, rotated or flipped copies are in the test set.
3. **Burst shots.** File names such as `20231006_165551.jpg` and `20231006_165551(0).jpg` are consecutive frames of the same leaf.
   - They stay in the test set, but report the number of **capture groups** (same leaf / same minute) next to the image count.
   - Use group-level resampling for any confidence interval.
4. **Krishoker Janala tungro / leaf-smut test images (150 / 100).**
   - Mark them UNVERIFIED until you have opened them: count, labels, and whether they are photos or drawings, diagrams or copies of dataset images.
   - Run the same ≤ 8-bit check against every training source.
   - Keep them as a **separate, labelled** test group; never pool them with the Kaggle test images in one headline number.
5. **Label spot-check:** 30 random test images per class; report how many are clearly mislabelled.

Then update `new_test_set_proposal.md` and `frozen_test_hashes.parquet`, and commit them with a message stating the final counts.

## 2. Then continue R10b
1. Download the approved non-reupload training sources into `D:\aldata\raw\<slug>\` (sha256 logged).
   - If Mendeley or Harvard Dataverse blocks automated download (403 / no API), **stop retrying**.
   - Write the exact manual-download steps for the owner in `data/expansion_r10/MANUAL_DOWNLOADS.md` (URL, file name, expected size), and move on to the other sources.
2. Dedup in this order and record every count:
   - against all protected test sets (Sylhet, Aman 2025, Gujarat, **the frozen test**) → must be 0;
   - against v10's training sources (list above);
   - across the new sources.
3. Run the label audit (30 per class per source; reject a source with more than 10% wrong, augmented or non-leaf images).
4. Write `dedup_keep.csv` (`path, source, original_label, our_class, sub_label, phash`) and `SUMMARY.md` with the **real unique count per class and per country**, plus the shortfall against each class target.
5. **Do not train.** The lead writes the v11 protocol and trains on Kaggle from `dedup_keep.csv`.

Same hard rules as before:
- no keys in files;
- `D:\Desktop\ai_battle` untouched;
- no fabricated numbers;
- anything not checked is marked UNVERIFIED.
