# Data quality report

**Status:** verified from Kaggle run audit (`ml/audit_dataset.py` & `ml/make_splits.py` outputs). Zero invented numbers.

## RiceLeafDiseaseBD v3 (training)
| Check | Known now | After audit |
|---|---|---|
| Total images | 9,769 (Mendeley page) | 9,769 received, 9,601 retained (168 excluded, 1.72%) |
| Classes | 6, as class folders | Blast, Brown spot, Healthy, Leaf smut, Rice Tungro, Sheath blight |
| Images per class | **Not published** | Blast: 1,326 (13.6%); Brown spot: 2,178 (22.3%); Healthy: 1,575 (16.1%); Leaf smut: 724 (7.4%); Rice Tungro: 2,244 (23.0%); Sheath blight: 1,722 (17.6%). Imbalance ratio: 3.10 |
| Format / size | 1024×1024 (page) | 9,769 JPEG, 9,769 RGB, all 1024×1024 |
| Corrupt / unreadable | unknown | 0 unreadable (see unreadable.csv) |
| Exact duplicates (MD5) | unknown | 39 MD5 duplicate groups covering 78 files (39 excluded) |
| Near duplicates (perceptual hash, distance ≤ 6) | unknown; **likely**, because field photos are often taken in bursts | 750 pHash near-duplicate groups (7,904 total hash groups); largest group: 19 images (<= 50 limit); 129 cross-class exclusions |
| Same image in two classes | unknown | 8 exact duplicate & 44 pHash near-duplicate cross-class groups detected and completely excluded; **0 cross-class conflicts retained** |
| One image, several diseases | possible: 21,460 boxes on 9,769 images is about 2.2 boxes per image | YOLO bounding boxes present in dataset (older annotation version); not used by whole-image classifier |
| Collection bias | One district, one season, two phones | Gazipur, Dhaka, Summer 2025; CMF Phone 2 Pro & Pixel 5 |
| License | CC BY 4.0 | Fully credited with DOI 10.17632/86s4jzj2m4.3 |
| Labeling quality | The page mentions validation by plant pathologists and farmers (per team files; κ=0.82 not on the page) | Validated via stratified group split (6,676 train, 1,426 val, 1,499 test); 0 shared groups |

## Known risks across datasets
1. **Leakage from bursts and augmented copies:** near-duplicate photos split across train and test inflate accuracy. Fix: grouped by perceptual hash (pHash Hamming distance <= 6) before splitting; verified 0 shared groups across splits.
2. **Domain shift:** a single district, season and phone pair. The external sets cover Savar, Sylhet, Sirajganj and Pabna, with other phones.
3. **Label mismatch:**
   - Brown Spot and Narrow Brown Spot are different diseases.
   - Sheath Blight is a sheath symptom.
   - Do not merge labels across datasets.
4. **Augmented copies** (RiceyLeafDisease, 5,188 of them): excluded from training and evaluation.
5. **Class imbalance:** 3.10 ratio addressed through balanced stratified group sampling.

## Is the data enough?
- **Yes, for a 6-class MVP classifier.** Thousands of field images and transfer learning are a normal setup.
- **Not enough to claim** field reliability across Bangladesh, Leaf Smut performance on unseen fields, or any disease outside the 6 classes.

**Data that is missing:**
- photos from more districts and seasons, taken on low-end phones
- an expert-labeled test set we collect ourselves
- negative examples ("not a rice leaf")

The external sets and the threshold partly cover these gaps. This is presented transparently on the Accuracy page.
