# AgroLeaf AI — Model Card

## Deployed model: v10 (live since 3 Nov 2026)

| Field | Value |
|---|---|
| File | `frontend/public/models/rice-effb0-v10-320.onnx` (15.3 MB float32 ONNX), sha256 `a296be9ebd54ff89e76af3650386f6842bfe4b4a471d48f8aa78ecb09936f89e` |
| Architecture | EfficientNet-B0 (timm, ImageNet-pretrained), fine-tuned; input 1×3×320×320; 8 outputs |
| Outputs | healthy, blast, brown_spot, leaf_smut, tungro, sheath_blight, other_rice ("other rice problem"), not_rice ("not a rice leaf") |
| Preprocessing | EXIF upright, long side ≤ 1024, Resize 366 + CenterCrop 320, ImageNet mean/std (same in training eval and the browser; parity-tested) |
| App rule | Temperature 0.66, answer threshold 0.30 (both fitted on validation only); Healthy needs ≥ 0.90; leaf smut is never named; reject outputs become "not sure" with a reason |
| Training data | Bangladesh: RiceLeafDiseaseBD v3 (Gazipur), BD5 (Savar), KYAU/raihan (Sirajganj-Pabna), Dhan-Shomadhan, DIU field close-ups (half A); India: Paddy Doctor, Sethy; Taiwan; plus non-rice photos. Near-copies of every test image (pHash ≤ 4 bits) were removed from training |
| Training | Kaggle GPU, script `model/experiments/run10_v10/kaggle_train_v10.py` (v8 recipe + DIU half A) |
| Measured results | `frontend/public/data/metrics-v10.json`. Sylhet-Dhaka (never seen): 56.4% of answers right, macro-F1 0.570; Aman 2025: 91.3% right, macro-F1 0.896; DIU half B: 88.8% right, macro-F1 0.784; Gazipur internal: macro-F1 0.844 |
| Release | Released by the owner's decision although two pre-written conditions failed (Aman −2.25 pts vs −2 limit; Sylhet tie). It gives fewer wrong answers than v8 on all three independent tests. See `model/experiments/run10_v10/RELEASE_DECISION.md` |
| Known limits | Brown spot and tungro found only about a third of the time on Sylhet; rice problems the app does not cover are kept unnamed only 35.6% of the time there; no independent test for sheath blight or leaf smut; disease text not reviewed by an agronomist |
| Rollback | v8 (`rice-effb0-v8-320.onnx`) and v1 + G1 remain in the bundle |

---

## Original template (v1, written before training; kept for history)

**Status:** template written before training. No metric on this page has been measured yet; every number is `[[TBD after training]]` until a real run produces `metrics-v1.json`.

| Field | Value |
|---|---|
| Model name | AgroLeaf AI rice-leaf screening model |
| Version | `[[TBD after training]]` |
| Date | `[[TBD after training]]` |
| Owner | Solo entry for Ostad Presents YUNet AIgnite Buildathon 2026 |
| Architecture | MobileNetV3-Large (ImageNet-pretrained, fine-tuned) |
| Runtime | ONNX float32 in the browser via `onnxruntime-web/wasm` |
| Classes | `healthy`, `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`, plus "not sure" |

---

## 1. Intended use

AgroLeaf AI gives a **preliminary screening** of a photo of a rice leaf. It shows one of six classes, or "not sure", with short Bangla and English next steps, optional Bangla audio and a `tel:16123` link.

It is **not a diagnosis**, not a laboratory test and not a substitute for an agriculture officer. The result is one input to a decision, not a prescription.

### Users
- **Primary:** Bangladeshi rice farmers, including people using a shared phone, a weak connection and limited reading comfort.
- **Secondary:** anyone helping a farmer understand a leaf photo. The interface is Bangla-first with English available.

### Out-of-scope uses
- Any crop other than rice.
- Any disease or disorder outside the six classes, including Bacterial Leaf Blight, Narrow Brown Spot, Leaf Scald and Rice Hispa. These should receive "not sure", not a forced answer.
- Pesticide or fertiliser selection, dosing or mixing. The app never generates doses.
- Confirming a laboratory result, insurance decisions, legal decisions or automated spraying.
- Estimating yield loss or field-wide infection.
- Identifying pests, nutrient deficiency or weather damage.
- Use as the only basis for a spray decision. The app tells the user to confirm with an officer or 16123.

---

## 2. Architecture and input contract

| Item | Value |
|---|---|
| Backbone | MobileNetV3-Large, ImageNet-pretrained, fine-tuned |
| Parameters | about 5.48M (torchvision figure, before export) |
| Export | ONNX, opset 17, **float32**, fixed input `1×3×224×224` |
| Quantisation | none in the MVP |
| Browser runtime | `import * as ort from 'onnxruntime-web/wasm'`, execution provider `wasm`, `numThreads = 1` |
| Preprocessing | RGB → resize shorter side to 256 → centre-crop 224×224 → scale to [0,1] → ImageNet mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]` → NCHW float32 |
| Class order | fixed by `ml/common.py` and copied to `class_index.json`; the app and the disease JSON must use the same order |

The ONNX file must stay **below 25 MiB** (Cloudflare Pages per-file limit). The exported size is `[[TBD after training]]` MB. MobileNetV3-Small is the fallback if Large is too large or too slow.

---

## 3. Training data

| Item | Value |
|---|---|
| Dataset | RiceLeafDiseaseBD v3 |
| DOI / licence | 10.17632/86s4jzj2m4.3 · CC BY 4.0 |
| Published size | 9,769 images; actual received `[[TBD after audit]]` |
| Location and season | Gazipur, Dhaka, Bangladesh; Summer 2025 |
| Devices | CMF Phone 2 Pro and Google Pixel 5; 1024×1024 |
| Classes | Healthy, Blast, Brown Spot, Leaf Smut, Rice Tungro, Sheath Blight |
| Per-class counts | not published; `[[TBD after audit]]` |
| Annotation files | YOLO bounding boxes (21,460) are **not used**; training is image-level |

Splits are leakage-safe: exact duplicates are found by MD5, near-duplicates are grouped by perceptual hash (Hamming distance ≤ 6 by default), cross-class groups and unreadable files are excluded, then 70/15/15 train/val/test splits are made with `StratifiedGroupKFold`, seed 42. Exclusion counts and the largest group are `[[TBD after audit]]`. Full provenance is in `data/DATA_CARD.md`.

---

## 4. Evaluation protocol

Nothing is reported until it comes from a run whose output is in the repo. The planned protocol (`model/evaluation_plan.md`):

1. **Internal test** — the held-out 15% of RiceLeafDiseaseBD v3, same district, season and phones as training. Report accuracy, **macro-F1**, per-class precision/recall/F1, confusion matrix, calibration error.
2. **External test** — mapped classes only, from RiceLeafDisease-BD5 (Savar) and RiceLeafBD (Sylhet–Dhaka). This is the headline generalisation number. Report the same metrics plus sample sizes.
3. **Unseen-class rejection** — Bacterial Leaf Blight and Narrow Brown Spot are mapped to `__unseen__`. Report the share that falls below the threshold and becomes "not sure".
4. **Selective prediction** — coverage at the validation-chosen threshold, accuracy among answered images, ECE before and after temperature scaling.
5. **Deployment checks** — ONNX size, PyTorch vs ONNX parity (max absolute logit difference < 1e-3), and browser latency measured on a real low-end Android phone.

### Metrics

| Metric | Internal test | External tests |
|---|---|---|
| Accuracy | `[[TBD after training]]` | `[[TBD after training]]` |
| Macro-F1 | `[[TBD after training]]` | `[[TBD after training]]` |
| Per-class precision / recall / F1 | `[[TBD after training]]` | `[[TBD after training]]` |
| Coverage at threshold | `[[TBD after training]]` | `[[TBD after training]]` |
| Selective accuracy | `[[TBD after training]]` | `[[TBD after training]]` |
| Unseen rejection rate | — | `[[TBD after training]]` |
| ECE after calibration | `[[TBD after training]]` | — |
| ONNX size | `[[TBD after training]]` MB | — |
| Browser latency | `[[TBD after training]]` ms (device: `[[TBD]]`) | — |

Leaf Smut has **no external test data**, because none of the external sets contains it. That must be stated on the Accuracy page.

Any class whose external recall is below 0.6 is never shown as a confident answer; it goes to "not sure" (`model/evaluation_plan.md`).

---

## 5. Calibration and the "not sure" behaviour

Confidence is not used raw. After training, **temperature scaling** is fitted on the validation split, then a threshold is chosen on validation to reach a target precision (for example ≥ 90%). There is no universal hard-coded 0.60.

- If the top calibrated probability is **at or above** the threshold, the app shows the class.
- If it is **below** the threshold, the app shows **"নিশ্চিত নই / not sure"**, the two possible classes as *possibilities* (not answers), how to retake the photo, and `tel:16123`.
- The threshold, temperature, coverage and answered accuracy are `[[TBD after training]]`.
- Image-quality checks (cannot decode, too dark, very blurry) can also lead to "retake", before or alongside the confidence check.

The threshold and temperature must be copied from `calibration.json` into the app; the Accuracy page must show the measured coverage next to them.

---

## 6. Known limitations

- **One district, one season:** training images come from Gazipur, Summer 2025. Rice in other districts, seasons, soils and light conditions may look different. External tests cover Savar, Sylhet and Dhaka, but not every region.
- **Two phone models:** all training photos come from a CMF Phone 2 Pro and a Google Pixel 5. Cheap-phone colour processing and compression may shift results. Latency on low-end phones is `[[TBD]]` measured.
- **Leaf Smut has no external test.** Its performance outside the training distribution is unknown, and the Bangla name is still to be confirmed by an agronomist. If its validation recall is poor, it should route to "not sure".
- **Sheath symptoms:** Sheath Blight appears on the sheath, while the app asks for a leaf photo. Leaf-only photos can miss it.
- **Similar diseases:** Brown Spot and Narrow Brown Spot are different diseases and must not be merged. Bacterial Leaf Blight is not a training class; both should trigger "not sure".
- **Class imbalance and label quality:** per-class counts and audit exclusions are `[[TBD after audit]]`. The Mendeley page mentions expert validation; the kappa value in older team files is not on the page and is not claimed here.
- **No negative examples:** the training set has no "not a rice leaf" class. Rejection depends on the calibrated threshold and image-quality checks, not a dedicated OOD class.
- **Single photo, single leaf:** the model classifies the image, not the field. It does not localise lesions or count them.
- **Web dependency:** the app needs a connection for the first load (no service worker in the MVP). The photo itself never leaves the device once the app is loaded.
- **Not validated in the field:** no farmer trial or agronomist field study has been completed. `[[TBD]]`

---

## 7. Ethical considerations

- **No chemical advice.** The model card and app never generate pesticide or fertiliser doses. If official BAMIS guidance is shown, it is quoted verbatim with a link and a "confirm with your officer / 16123" note.
- **Referral, not a hotline claim.** `tel:16123` is offered as a way to reach the official service. The app does not say the call is free; charges may apply.
- **Privacy by design.** Inference runs in the browser. The photo is not uploaded, and there are no accounts, analytics or error-tracking SDKs that could capture images. Only static assets and Google Fonts (CSS) are loaded.
- **Honest uncertainty.** The app shows "not sure" rather than a forced guess, publishes coverage, and reports external-district results with sample sizes. It never promises perfect accuracy or that it works everywhere in Bangladesh.
- **Accessibility.** Bangla-first text, large tap targets, labelled icons, and pre-recorded Bangla audio played only on user tap. The voice is labelled as AI-generated.
- **Attribution.** Training and test data are CC BY 4.0, credited with DOIs on the About/Accuracy pages and in the data card. Third-party libraries and fonts keep their licences.
- **No overclaiming.** The app is described as preliminary screening, not a diagnosis. Limitations are visible in the product, not buried.
- **Not for surveillance or profiling.** No personal data is collected; images are not stored server-side.

---

## 8. How to update this card after training

1. Run the Kaggle notebook (`ml/kaggle/agroleaf_train_kaggle.ipynb`) or the scripts in `ml/README.md` on the real data.
2. Open `run1/metrics-v1.json`, `run1/calibration.json` and the confusion matrix. Copy only measured values into this card:
   - replace every `[[TBD after training]]` with the value from the file, next to the sample size;
   - record temperature, threshold, coverage and selective accuracy;
   - record ONNX size and the real-phone latency with the phone model;
   - state which external sets were used and which were not.
3. Add a run log at `model/experiments/<date>_mnv3_large.md` using the template in `model/experiments/README.md`.
4. Update the in-app "How accurate is it?" page from the same `metrics-v1.json`. The app and this card must not disagree.
5. If a class underperforms (external recall < 0.6), route it to "not sure" and say so here.
6. If any limitation changes (more districts, more phones, a new dataset), update §3, §6 and `data/DATA_CARD.md` together.
7. Bump the version and date at the top. Never add an estimate or a number from a different run.
