# Internet-image failure record (2 Nov 2026)

These are the user's manual internet tests that are reproducible from files. Only these 4 images were saved (in `D:\Desktop\AIgnite 2026\AgroLeaf_manual_test_images\`). The user's "about 70% wrong or not sure" figure covers more images that were not saved, so it cannot be reproduced and is not claimed here.

**Label status:** the labels are the user's (folder placed by the user), from internet sources with no recorded provenance. **They are unverified.** These cases illustrate failure modes; they do not measure accuracy.

**Method:** v1 (`frontend/public/models/rice-mnv3l-v1.onnx`), evaluated pipeline (EXIF, 1,024 px cap, torchvision Resize 256 + CenterCrop 224, ImageNet normalisation, T 0.909), with the app's decision rule (`ml/app_decision.py`, verified against `decide.js`). Live results come from the real site in headless Chrome.

| Image | Size | v1 top-3 probabilities | Live app before `bf72231` | Live app after `bf72231` | Classification |
|---|---|---|---|---|---|
| blast/images.jfif | 300×300 JPEG | blast 0.639, healthy 0.183, sheath blight 0.071 | Blast | Blast | correct |
| blast/Paddy-Leaf-Blast-medium.webp | 300×300 WEBP | blast 0.482, healthy 0.230, sheath blight 0.099 | Not sure | **Blast** | **integration** (browser canvas resize ≠ evaluated pipeline at the 0.48 threshold) — fixed by I9 |
| brown_spot/downloaded.jfif | 387×516 JPEG | blast 0.557, tungro 0.265, brown spot 0.073 | Blast | Blast | **wrong class** (model) |
| leaf_smut/leaf_smut_download_version.jpg | 1535×1009 JPEG | sheath blight 0.758, brown spot 0.123, healthy 0.059 | Sheath blight | Sheath blight | **wrong class** (model) |
| not_rice/not_rice_02_app_screenshot.png | 780×1688 PNG | (screenshot of the app) | Sheath blight | Sheath blight | **non-rice not rejected** (model + leaf-colour gate) |

## Root causes (evidence)
1. **Domain shift (main cause).** v1 was trained on one district. Measured on photos from districts it never saw (`metrics-v1.json` → `external`), the share of its answers that are right is:
   - Sylhet: 53.7%;
   - raihan: 9.8%;
   - Gujarat: 5%.

   Internet photos are another new domain.
2. **Weak classes.**
   - Brown spot is mostly called blast or tungro outside Gazipur (Sylhet recall 0.07; same pattern as `downloaded.jfif`).
   - Leaf smut has no outside training data.
3. **Integration mismatch.** The browser canvas resize differed from the evaluated pipeline. Fixed and verified live in `bf72231` (decode-path test 25/25).
4. **Non-rice rejection in v1 is a colour heuristic.** It passes green screenshots and posters (published: 84–98% of non-rice rejected).

## Not the cause (checked)
- **Class-label mapping:** `class_index.json` order equals the training order (`ml/common.py`).
- **Model runtime:** ORT-web and ORT-python give identical logits for the same tensor.
- **Preprocessing:** colour order, normalisation, EXIF and alpha all verified by unit tests and the browser decode-path test.
