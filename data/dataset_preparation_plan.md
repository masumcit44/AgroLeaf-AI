# Dataset preparation plan (leakage-safe)

## Step 1 — Freeze the originals
- Unzip to `datasets_raw/…`. Never edit those files.
- Record the version, download date and SHA256 of the zip.

## Step 2 — Audit
```bash
python ml/audit_dataset.py "<raw folder>" --out data/audit_output
```
Fill in `data_quality_report.md`. Look at 20 random images per class yourself.

## Step 3 — Clean (write a list; don't delete files)
`data/audit_output/exclusions.csv` lists, with a reason for each:
- corrupt files
- exact duplicates (keep one)
- images found in two classes

## Step 4 — Group near duplicates
Images with perceptual-hash distance ≤ 6 get the same `group_id`. The script outputs `groups.csv`.

## Step 5 — Split by group, stratified by class
- **70 / 15 / 15** train / val / test, using `StratifiedGroupKFold` (scikit-learn) with **seed 42**.
- Save to `data/splits.csv` (`path, class, group_id, split`).
- **The test split is not touched until the final evaluation.**
- **External test** = mapped classes from RiceLeafDisease-BD5 and RiceLeafBD (see `disease_classes.md`).
- **"Unknown disease" test** = classes the model never trained on, such as BLB and Narrow Brown Spot.

## Step 6 — Preprocessing (identical in training and in the browser)
1. Convert to RGB.
2. Resize the shorter side to 256, then center-crop **224×224**.
3. Scale to [0,1], then normalise with ImageNet mean `[0.485,0.456,0.406]` and std `[0.229,0.224,0.225]`.
4. Use NCHW float32.

Write these values into `model/preprocess.json`. The frontend reads that same file.

## Step 7 — Augmentation (training split only)
- Random resized crop (scale 0.6–1.0)
- Horizontal and vertical flip
- Rotation ±20°
- Colour jitter (brightness and contrast 0.3, saturation 0.2)
- Slight Gaussian blur (p=0.2) and JPEG-quality jitter, to simulate cheap phones

Do not augment validation or test data. Do not use the YOLO boxes for the MVP (image-level classification only).
