# Data quality report

**Status:** pre-download. The **[TODO]** cells must be filled from `ml/audit_dataset.py` output. Do not invent values.

## RiceLeafDiseaseBD v3 (training)
| Check | Known now | After audit |
|---|---|---|
| Total images | 9,769 (Mendeley page) | [TODO] count actually received |
| Classes | 6, as class folders | [TODO] confirm folder names |
| Images per class | **Not published** | [TODO] → decides class weights |
| Format / size | 1024×1024 (page) | [TODO] formats, any other sizes, colour mode (RGB / RGBA / greyscale) |
| Corrupt / unreadable | unknown | [TODO] |
| Exact duplicates (MD5) | unknown | [TODO] |
| Near duplicates (perceptual hash, distance ≤ 6) | unknown; **likely**, because field photos are often taken in bursts | [TODO] number of groups |
| Same image in two classes | unknown | [TODO] **must be zero**; resolve any conflicts by hand |
| One image, several diseases | possible: 21,460 boxes on 9,769 images is about 2.2 boxes per image | [TODO] check whether the YOLO files contain mixed classes per image |
| Collection bias | One district, one season, two phones | Known risk → the external test is required |
| License | CC BY 4.0 | Attribution needed |
| Labeling quality | The page mentions validation by plant pathologists and farmers (per team files; κ=0.82 not on the page) | [TODO] look at 20 random images per class |

## Known risks across datasets
1. **Leakage from bursts and augmented copies:** near-duplicate photos split across train and test inflate accuracy. Fix: group by perceptual hash before splitting.
2. **Domain shift:** a single district, season and phone pair. The external sets cover Savar, Sylhet, Sirajganj and Pabna, with other phones.
3. **Label mismatch:**
   - Brown Spot and Narrow Brown Spot are different diseases.
   - Sheath Blight is a sheath symptom.
   - Do not merge labels across datasets.
4. **Augmented copies** (RiceyLeafDisease, 5,188 of them): exclude them from any evaluation.
5. **Class imbalance:** unknown until counted.

## Is the data enough?
- **Yes, for a 6-class MVP classifier.** Thousands of field images and transfer learning are a normal setup.
- **Not enough to claim** field reliability across Bangladesh, Leaf Smut performance on unseen fields, or any disease outside the 6 classes.

**Data that is missing:**
- photos from more districts and seasons, taken on low-end phones
- an expert-labeled test set we collect ourselves
- negative examples ("not a rice leaf")

The external sets and the threshold partly cover these gaps. Say this honestly on the Accuracy page.
