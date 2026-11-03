# R11 — Robust preprocessing and inference for real user photos (task for Antigravity)

Paste everything below the line into Antigravity.

---

You are the ML + frontend engineer for **AgroLeaf AI**, a Bangla-first website that diagnoses rice-leaf diseases from one phone photo. Live: https://agroleaf-ai.pages.dev.

**Problem the owner sees:** the model does well on clean, well-framed leaf photos. It often fails on real uploads that are tilted, zoomed out, cluttered, unevenly lit, blurry, or show several leaves. Sometimes it is wrong, sometimes it cannot decide.

**Your goal:** a reliable, evidence-based preprocessing and inference pipeline that measurably improves results on realistic photos. When the photo is unusable, the app must say so clearly instead of guessing.

**Not wanted:** a cosmetic patch, or "make every image look neat".

**Work order:** inspect → write the plan and the acceptance gate → build → evaluate → deploy only if the gate passes.

## 0. Facts already verified by the lead (3 Nov 2026) — confirm them yourself before relying on them

**Architecture**
- **There is NO backend inference API.** Everything runs in the browser: React 19 + Vite + `onnxruntime-web` (wasm), hosted on Cloudflare Pages.
- Do **not** add a server or a paid API unless your evidence shows the browser cannot do the job. If you think one is needed, stop and explain why first.

**Repos and deploy**
- Deploy worktree: `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt`, branch `deploy/candidate-ready`.
  - Pushing that branch updates the preview: https://deploy-candidate-ready.agroleaf-ai.pages.dev.
  - Pushing it to `main` deploys production.
- Lead worktree, for ML tools and experiments: `D:\Desktop\AIgnite 2026\AgroLeaf_lead_worktree`, branch `feat/model-v3`.
- Work on a **new branch** cut from `deploy/candidate-ready`, e.g. `feat/robust-preprocess`.

**Live model: v10**
- File: `frontend/public/models/rice-effb0-v10-320.onnx`, sha256 `a296be9e…09936f89e`.
- EfficientNet-B0, 8 outputs, in this order:
  `healthy, blast, brown_spot, leaf_smut, tungro, sheath_blight, other_rice, not_rice`.
- Input: 1×3×320×320, float32, RGB, NCHW, ImageNet mean/std (`frontend/public/data/preprocess.json`).
- **Do not retrain or change the model weights in this task.**

**Inference preprocessing today**
- Code: `frontend/src/ml/preprocess.js`, `predict.js`, `loadModel.js`.
- Steps: decode → EXIF upright → long side capped at 1024 → Resize(shorter side 366, bilinear, Pillow-exact) → **CenterCrop 320** → normalise.
- This matches the training eval transform exactly: `make_eval` in `model/experiments/run8_v8/kaggle_train_v8.py`.
- The decode-path parity test (`npm run test:decode`, 25 fixtures) checks that the browser equals the Python reference.

**Training augmentation** (`strong_aug` in the same file)
- Rot90, random JPEG, **RandomResizedCrop(320, scale 0.25–1.0, ratio 0.75–1.33)**, plus the common transforms.
- So the model has seen zoomed-in crops and 90° rotations. Check whether it was trained on arbitrary-angle rotations, letterboxed (padded) images or strong lighting changes before assuming any transform is "in distribution".

**Decision rule** (`frontend/src/ml/decide.js`, `frontend/public/data/calibration.json`)
- Temperature 0.66; answer threshold 0.30; Healthy needs ≥ 0.90; leaf smut is never named.
- `other_rice` → "other rice problem"; `not_rice` → "not a rice leaf".
- The older non-rice gate (`nonriceGate.js`, `rice-nonrice-gate-v4b.onnx`) and the leaf-colour check (`leafCheck.js`) exist in code. Verify whether the v10 calibration enables them; the lead believes it does not.

**Training data**
- Mostly close-ups: Gazipur, Savar, Sirajganj-Pabna, Paddy Doctor (India), Sethy (India), Taiwan, and DIU half A (single leaves on white).
- Few zoomed-out field scenes or cluttered backgrounds. This domain gap is the main suspected root cause; **prove or disprove it**.

**Measured today (app path)**

| Test set | Right among answered | Macro-F1 |
|---|---|---|
| Sylhet-Dhaka (unseen district, 1,446 photos) | 56% | 0.57 |
| Aman (422) | 91% | 0.90 |
| DIU half B (1,375) | 89% | 0.78 |

**Existing tools to reuse** (lead worktree, `ml/tools/`)
- `eval_diu_app_path.py`: app-path scoring in Python, identical preprocessing.
- `eval_sylhet_v9.py`, `coverage_compare.py` (matched-answer-rate comparisons).
- `eval_app.py` (`evaluate_set`).
- `e2e_upload_live.mjs`: real UI upload test with puppeteer.
- `e2e_audio_live.mjs`.
- `make_decode_fixtures.py`.

**Frontend tests:** `npm test` (81 unit tests), `npm run test:decode`, `npm run build` (includes a check that every file is under Cloudflare's 25 MiB per-file limit).

## 1. Inspect first (write `documentation/preprocessing/R11_FINDINGS.md`)

Verify from code and config, and quote the file and line:
- the full upload → decode → preprocess → model → decision → UI path;
- every threshold and gate that is active;
- what the training and eval transforms really were;
- which file formats the upload accepts (JPEG, PNG, WebP, HEIC?);
- how alpha, greyscale and CMYK images are handled;
- very large and very small images;
- EXIF orientation.

Then **diagnose the root cause** with measurements, not opinions. For a fixed set of correctly-labelled images, measure how the prediction changes under each condition:
- **zoom-out:** leaf at 100%, 50%, 25% of the frame, pasted on real field or cluttered backgrounds;
- **rotation:** 15°, 30°, 45°, 90°;
- **brightness / contrast / shadow;**
- **Gaussian and motion blur;**
- **JPEG quality;**
- **multiple leaves.**

Key question: how much of the failure comes from the **CenterCrop discarding or shrinking the leaf**, and how much from the model never having seen such scenes? Preprocessing can only fix the first.

## 2. Candidate techniques — test each, keep only what the evidence supports

**Always (correctness, not accuracy):**
- safe decoding, with clear errors for corrupt or unsupported files;
- EXIF orientation;
- alpha flattened onto a neutral background;
- greyscale and CMYK converted to RGB;
- size limits.

These must not change results on normal JPEGs. The parity test must still pass.

**Candidates for accuracy**, each compared against the current pipeline:
1. **Crop strategy:** current CenterCrop vs full image letterboxed (no crop) vs multi-crop / multi-scale test-time augmentation (e.g. full + center + 4 corners; or 1.0×/0.6×/0.4× crops). Aggregate by mean probability or by max-confidence over **non-reject** outputs.
   - Watch the reject outputs: a crop of background may vote `not_rice`. Define the aggregation rule before testing.
2. **Leaf-region localisation:** a cheap colour/texture mask (HSV that **also covers yellow, orange and brown** diseased tissue, not only green) → bounding box with a generous margin (≥ 15%) → crop.
   - Must never cut lesions at leaf edges. Measure how often the crop drops symptom area on images with known lesions. RiceLeafDiseaseBD v3 (Gazipur) ships **YOLO boxes for lesions**; use them to check this.
3. **A learned leaf/lesion detector** (only if 1–2 are not enough). Check before choosing any detector:
   - **licence** (Ultralytics YOLO is AGPL-3.0; prefer MIT/Apache, e.g. YOLOX, RT-DETR or NanoDet, and verify each);
   - ONNX size (each file < 25 MiB, or split into parts);
   - browser latency on a mid-range phone;
   - whether training data exists (RiceLeafDiseaseBD v3 YOLO boxes; Roboflow rice-leaf sets).
   - Do not add it if 1–2 already meet the gate.
4. **Image-quality checks** that trigger helpful messages, not a forced diagnosis:
   - blur (variance of the Laplacian on the leaf region);
   - too dark / overexposed (luminance histogram);
   - leaf too small (mask area);
   - no leaf found.
   - Fit their thresholds on a **development** set only. Each check must reduce wrong answers more than it reduces right answers; report both numbers.
5. **Lighting normalisation** (e.g. gray-world white balance, mild CLAHE on L):
   - **Only if tested to help.** The model was trained on raw RGB with ImageNet normalisation.
   - Any colour change can erase brown-spot or tungro colour cues, so be suspicious.

**Do not:**
- stretch images to 320×320 without keeping the aspect ratio;
- change the normalisation;
- apply segmentation that deletes background pixels unless tested;
- stack transformations just to make numbers look better.

## 3. Data for evaluation — no leakage

**Development / tuning set** (use for every choice: crops, thresholds, aggregation)
- **Only** the in-domain validation splits: the `preds_*_val` sources in v10's training run (raihan, Dhan-Shomadhan, Gazipur, Savar, Paddy Doctor, Sethy and Taiwan val rows, plus DIU-A val).
- You can rebuild them from Kaggle with the user's own key (never write or commit a key).

**Final comparison set** (read once, after every choice is frozen)
- Sylhet-Dhaka (`sikanderk/riceleafbd-mendeley`, 1,446 after exact duplicates are dropped) and Aman unique (422; list in `model/experiments/run7_v7/aman_unique_gt8.txt`).
  - They were already used to judge the **model**; reusing them to compare **pipelines with the same weights** is acceptable if you tune nothing on them.
- DIU half B (1,375) is **not independent** of v10 (v10 trained on DIU half A); report it separately and label it.
- If Antigravity's R10 dataset task produced a new held-out Bangladeshi set (`data/expansion_r10/new_test_set_proposal.md`), use it as the cleanest test.

**Difficult-condition sets**
- Build them by applying controlled transforms to the **final-set images** (zoom-out onto backgrounds, rotation, blur, lighting, JPEG).
  - The backgrounds must come from a separate background pool that you never use for tuning.
  - Label these sets **synthetic** in every table.
- Also use the owner's real hard photos: `D:\Desktop\AIgnite 2026\AgroLeaf_manual_test_images` (about 20). That is too few for statistics, so report them case by case.
- If a category has fewer than about 50 images, write **INSUFFICIENT EVIDENCE**.

**Non-rice rejection set:** the `not_rice` validation sources (natural, plantvillage, posters, memes, generated) for tuning, plus a fresh set of non-rice images (other crops, weeds, people, objects, screenshots) for the final read.

**Deduplicate:** pHash within 8 bits across tuning vs final sets, and against the training sources. Report the counts.

## 4. Acceptance gate — write it in `documentation/preprocessing/R11_PROTOCOL.md` and commit it BEFORE any final-set result exists

Suggested; tighten it if you can justify that:
1. **Clean images:** on Sylhet + Aman as photographed, macro-F1 and right-among-answered may not drop by more than **1.0 point** each vs the current pipeline (same weights), with a paired bootstrap 95% CI.
2. **Difficult images:** on the pooled synthetic difficult set, right answers go up **and** wrong answers do not go up. Report each condition separately.
3. **Safety:**
   - "diseased called Healthy" does not increase;
   - non-rice images named as a rice disease do not increase;
   - quality messages fire on fewer than 10% of clean images.
4. **Latency:** median end-to-end time per photo ≤ **2×** the current time (today about 0.18 s on desktop; also measure a mid-range Android, or Chrome's CPU throttling at 4× as a proxy).
5. **Tests:** all existing tests pass, and the decode parity holds for the unchanged path.

If the improved pipeline does not pass, investigate why, try **justified** alternatives, and report negative results honestly. Do not deploy.

## 5. Implementation requirements

- Keep the current path as a reference function, so the A/B comparison and rollback stay trivial (a config switch in `calibration.json` or `config.js`).
- **Python reference implementation** of the new pipeline in `ml/` that matches the browser bit-for-bit within tolerance, extending `make_decode_fixtures.py` / `verify-decode-parity.mjs`. Evaluation runs in Python; the browser must provably do the same thing.
- **User messages**, in Bangla first with English, using the existing i18n files (`frontend/src/i18n/bn.js`, `en.js`):
  - "Please upload a clearer photo of the leaf."
  - "The leaf is too small — move closer."
  - "A rice leaf could not be found in this photo."
  - "The result is uncertain — please try another photo."
  - Plus a short capture guide: leaf fills most of the frame, daylight, no blur, symptoms in focus.
  - Never show a low-confidence result as a diagnosis.
- **Tests to add:**
  - JPEG, PNG with alpha, WebP, greyscale, CMYK, EXIF 1–8;
  - tiny (64 px), huge (6000 px), extreme aspect ratios;
  - corrupt file; blurry, dark and overexposed images; no-leaf image; multiple leaves;
  - the parity test for the new path.
- **Performance:** keep everything in the browser; no new file over 25 MiB.

## 6. Verification and deployment

1. All unit, decode and build tests pass locally.
2. Push the branch for a preview, then run `e2e_upload_live.mjs` and `e2e_audio_live.mjs` against the **preview**. Add new cases for the quality messages.
3. Check on a real phone if possible (the owner can test), and record what was tested.
4. Deploy to production (merge to `main`) **only if the gate in §4 passed**. Then rerun the live tests on https://agroleaf-ai.pages.dev and record the results.
5. Update the Accuracy page numbers **only** with measured results, noting which pipeline produced them.
6. If anything blocks deployment, stop and write the exact blocker and steps. Never claim it is deployed when it is not.

## 7. Hard rules

- No fabricated numbers, results or deployment claims. Every number in the report traces to a file you produced.
- No tuning on the final sets; no peeking and re-choosing.
- Do not change model weights, class order or normalisation.
- Do not touch `D:\Desktop\ai_battle` (read-only).
- Never write, print or commit API keys or tokens.
- Free tools only; no paid APIs.
- Do not delete existing files. Keep v10, v8 and v1 + G1 for rollback.
- Commit messages end with your normal attribution; small, reviewable commits.

## 8. Final report — `documentation/preprocessing/R11_REPORT.md`

1. Root cause of the current failures, with the measurements from §1.
2. Old vs new pipeline, as diagrams or step lists.
3. Each method implemented, why it was chosen, and what was tried and rejected (with numbers).
4. Files changed.
5. Model compatibility: input shape, normalisation, parity results.
6. Datasets, sample counts, dedup counts and methodology.
7. Before/after metrics for every set and condition:
   - accuracy and macro-F1;
   - per-class precision / recall / F1;
   - confusion matrices;
   - right-among-answered and answer rate;
   - wrong-answer rate;
   - non-rice rejection;
   - latency (median and 95th percentile) and memory.
8. Examples that improved and examples that still fail (images plus predictions).
9. Gate verdict, deployment status, and live test evidence (preview and production).
10. Remaining risks and next steps.
