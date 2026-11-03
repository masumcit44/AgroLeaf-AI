# AgroLeaf AI — autonomous mission report (2 Nov 2026, written ~13:10 BST for 4:00 PM)

**Labels:** VERIFIED = measured, with the file or commit named. HYPOTHESIS = an explanation not yet proven.

Branches:
- `feat/model-v3`: experiments and reports.
- `deploy/candidate-ready`: website with the new model; **preview only**.
- `main`: production.

## Summary
- A new model, **v8_b0** (EfficientNet-B0, 320 px input, Bangladeshi + Indian + Taiwanese field photos), is clearly better than the live system on both one-time final tests:
  - DIU half B: macro-F1 **0.562 vs 0.324**; diseased leaves called Healthy **8.8% vs 21.2%**.
  - Aman 2025 unique subset: macro-F1 **0.919 vs 0.495**.
- **It did not pass the locked release gate.** One condition (Aman: same answer rate as live) cannot be met: v8_b0 answers at most 50.5% of Aman photos vs live 54.5%, because it refuses unsupported problems that the live app names wrongly (59%).
- I did **not** change the rule after seeing this, so **production is unchanged** (v1 + G1).
- v8_b0 is **live on the preview site** for your decision: https://deploy-candidate-ready.agroleaf-ai.pages.dev.

## Decision (2 Nov 2026, ~20:00 BST)
The user first kept the locked gate (~20:00). After reviewing the comparison, **the user chose to deploy v8_b0 to production (~20:15).**
- This is a **post-hoc revision** of the Aman answer-rate condition. It is stated openly on the Accuracy page and in `run8_v8/RELEASE_DECISION.md`.
- Released in `main` `98201ab`.
- Rollback: revert the release merge; the v1 + G1 files are kept.

## Options that were offered
1. **Keep the locked gate:** production stays v1 + G1. Nothing to do.
2. **Accept a revised Aman condition** (post hoc, and must be labelled so in the submission), for example "no worse right-share at the candidate's own maximum answer rate" or "compare on diagnosable photos only". If yes:
   - merge `deploy/candidate-ready` into `main`;
   - update the Accuracy page from v1 to v8 numbers (about 30 minutes; not done yet);
   - re-run the live checks on production.

## 1. Data actually collected and verified
- **Dataset search** (Kaggle, Hugging Face, Mendeley, Zenodo, GitHub): each source's licence, counts and rejection reason are recorded in the subagent report (overnight report §4b and the manifest).
- **Consolidated manifest** (Kaggle CPU job `agroleaf-data-manifest` v2; script `model/experiments/data_manifest/kaggle_data_manifest.py`; results in `data_manifest/results/`, commit `1a9d814`). Per image: MD5, pHash, licence, country, role, white-background score. VERIFIED.
- **Problems found in public data:**
  - `nirmalsankalana/dhan-shomadhan` folder labels are wrong (labels taken from filename codes instead).
  - Vietnam `minhhuy2810` is web-collected; excluded after v6.
  - **Aman 2025 (Hugging Face)** contains resized copies of Gazipur (156 exact pHash), Paddy Doctor, Sethy and other sets. It was scored only on its 422 unique images (`run7_v7/PROTOCOL_AMENDMENT_1.md`, fixed before reading).
  - raihan is a mirror of KYAU (1,415 shared scenes).

## 2. Unique images, classes, sources, licences (VERIFIED, manifest v2)
- 41,665 files from 15 sources → **30,419 unique scenes** (pHash ≤ 4 bits, clustered across sources); 3,899 exact duplicate files; 187 clusters with conflicting labels.
- Training pool, label-consistent, test sets excluded: **26,294 unique scenes**.

| Class | Bangladesh | India | Taiwan | Unknown origin |
|---|---|---|---|---|
| healthy | 2,363 | 1,505 | 290 | 206 |
| blast | 2,198 | 1,899 | 499 | 300 |
| brown spot | 2,190 | 1,365 | 76 | 0 |
| leaf smut | 617 | 0 | 0 | 0 |
| tungro | 2,388 | 1,438 | 0 | 0 |
| sheath blight | 2,733 | 0 | 0 | 0 |
| other rice problem | 1,622 | 4,399 | 0 | 206 |

- **Licences:**
  - CC BY 4.0: Mendeley sources, UCI, Taiwan, Aman.
  - CC0 claimed by the Kaggle mirror: Paddy Doctor (original licence unverified).
  - MIT: Karnataka.
- **Gaps:**
  - leaf smut has a single field source (Gazipur);
  - sheath blight comes only from Bangladesh;
  - no usable open data was found from Vietnam, the Philippines, Indonesia, Thailand or China.

## 3. Experiments (all completed; protocols written before training)
| Run | Change | DIU half A result | Verdict |
|---|---|---|---|
| v5 | Bangladesh-only, B0, 224 | cannot reach live answer rate | NO-GO |
| v6 | + India / Vietnam / Karnataka, 224 | 37.7% vs 40.4% right | NO-GO |
| v7 | Bangladesh + Dhan white-background, 224 vs 320 | 320: macro-F1 0.498, cannot reach rate | NO-GO |
| **v8_b0** | v7_320 data + Paddy Doctor, Sethy, Taiwan, B0 320 | **49.9% vs 40.4% right** (CI +4.3 to +14.6), macro-F1 0.545 | selected → final tests |
| v8_b2 | same data, EfficientNet-B2 | macro-F1 0.544, cannot reach rate | not selected |

**What helped, measured on half A:**
1. 320 input instead of 224 (+0.05 macro-F1).
2. More diverse field data at 320 (+0.05, healthy recall 0.52 → 0.75).
3. A larger backbone did not help.
4. Tile-zoom averaging did not help either.

## 4. Model versions, configs, checkpoints
- **v8_b0:**
  - `kaggle kernels output mdmasumakondha/agroleaf-train-v8` → `v8/V8_all_b0_320/` (`model.onnx` sha256 `dda84502e9920c190a5754e225fc585e4faddf96832c502e5d6e191ca0b51b04`, `calibration.json`, `metrics.json`, logits).
  - Same file on the preview branch: `frontend/public/models/rice-effb0-v8-320.onnx`.
- **Training config** (`model/experiments/run8_v8/kaggle_train_v8.py`, commit `37a779c`):
  - EfficientNet-B0 (timm, ImageNet), 14 epochs, AdamW lr 1e-3, weight decay 0.02, OneCycle, label smoothing 0.1, seed 42;
  - strong augmentation;
  - sqrt-per-source class-balanced sampling;
  - 8 outputs (6 diseases + other_rice + not_rice);
  - calibration on in-domain val only: temperature 0.66, threshold 0.30.
- **Runtime:** ~2.5 h on Kaggle GPU for B0 + B2; caching 26 min.

## 5. Baseline vs candidate (one-time final tests; `run8_v8/FINAL_RESULT.md`, `results/*.json`)
**DIU half B** (1,375 photos: healthy 297, blast 349, tungro 117, other problems 612):

| | live v1 + G1 | v8_b0 |
|---|---|---|
| Right at the live answer rate (37.2%) | 40.8% | 46.3% (+5.5 points, 95% CI +0.3 to +10.3) |
| Raw accuracy / macro-F1 | 0.422 / 0.324 | 0.544 / 0.562 |
| Recall healthy / blast / tungro | 0.95 / 0.07 / 0.13 | 0.77 / 0.44 / 0.29 |
| Precision healthy / blast / tungro | 0.49 / 0.96 / 0.45 | 0.62 / 0.82 / 0.81 |
| Diseased called Healthy | 21.2% | 8.8% |
| Other problem shown as a disease | 31.7% | 33.0% |

**Aman unique** (422: healthy 48, blast 52, brown spot 59, other 263):

| | live | v8_b0 |
|---|---|---|
| Answered / right | 54.5% / 14.8% | 50.5% / 62.9% |
| Raw macro-F1 | 0.495 | 0.919 |
| Recall healthy / blast / brown spot | 0.69 / 0.48 / 0.20 | 0.98 / 0.92 / 0.76 |
| Other problem shown as a disease | 58.9% | 26.2% |
| Diseased called Healthy | 0.0% | 1.8% |

**Other measures:**
- Non-rice rejected (test splits: generated, memes, natural, PlantVillage, posters): v8_b0 100% each.
- Gazipur internal test: 92.4% answered, 88.1% right.
- Size and speed:
  - 15.3 MiB (live v1 16.05 + gate 15.30);
  - browser: model 148 ms, total 189 ms per photo on this PC;
  - native single-thread CPU at 320: 57 ms (v1 at 224: 12 ms).

## 6. Biggest failure modes and what was done
1. **Small lesions lost at 224 px.** Zoom test: blast recall 0.14 → 0.48. → 320 input (v7, v8).
2. **Live v1 calls diseased leaves Healthy** (DIU B: 21%; blast → Healthy). v8_b0: 8.8%.
3. **Too little diversity.** Adding licensed field photos from India and Taiwan at 320 raised healthy recall 0.52 → 0.75 without losing blast.
4. **Still weak:**
   - tungro recall 0.29 on DIU (HYPOTHESIS: early yellowing in DIU, unlike Gazipur's whole yellow plants);
   - unsupported problems shown as a disease (33% on DIU B);
   - leaf smut is never named; no final test exists for leaf smut or sheath blight.
5. **The data had hidden copies:** Aman vs Gazipur, Vietnam vs DIU look-alikes. Handled with pHash guards and the unique subset.

## 7. Acceptance gate
**NOT passed** (`run8_v8/FINAL_RESULT.md`):
- DIU half B: all 3 conditions pass (the +5.5 points is just above the bar).
- Non-rice, Gazipur and size: pass.
- **Aman: the answer-rate condition cannot be met** → NO-GO under the locked rule.

## 8. Website deployed?
**Production: no change** (v1 + I9 + G1, deployed `6d76992`; verified `/data/calibration.json` lists the G1 gate).

**Preview: yes.** v8_b0 at https://deploy-candidate-ready.agroleaf-ai.pages.dev, branch `deploy/candidate-ready` commit `11f5c34`.
- Verified: it serves the model with sha256 `dda84502…` and preprocessing 366 / 320.
- Tests: unit 79/79, browser decode-path 25/25 with v8_b0, build OK.
- Rollback: production `main` is untouched; v1 files are still in the branch.

## 9.–10. Live tests (real upload UI, headless Chrome, 20 photos; `run8_v8/results/live_ui_test.txt`)
- **Same answer on production and preview:**
  - 3 non-rice images ("not a rice leaf");
  - blast ×2, brown spot ×2, sheath blight ×2, tungro ×2 (correct), healthy_01 (correct);
  - blast_01 and leaf smut ×2: "not sure".
- **Better on preview:** bacterial blight ×2 → "other rice problem" (production: "may be healthy").
- **Wrong on both:** leaf_smut_download_version (production: sheath blight; preview: blast).
- **Unknown truth:** unclear_01_closeup (production: not sure; preview: brown spot).
- No console or page errors on either site.

## 11. Commits, commands, artifacts
**`feat/model-v3`:**
- `641decb` R1 review
- `8606d7e` manifest kernel + DIU halves
- `5c7a7e0` v5/v6 half A
- `038469d` v7
- `1a9d814` manifest results + Aman amendment
- `dd0f3e8` v7 half A
- `37a779c` v8
- `bddef5a` v8 selection (before final reads)
- `a602039` final gate result
- `a8d8031` live UI test

**`deploy/candidate-ready`:**
- `0f3bebc` 8-output support
- `245b85b` model parts under 25 MiB
- `11f5c34` v8_b0 preview

**Reproduce the evaluation:**

```
python ml/tools/eval_diu_app_path.py <diu_raw> v1.onnx calibration.json gate.onnx <out> A|B name=model.onnx,calibration.json
AMAN_KEEP=model/experiments/run7_v7/aman_unique_gt8.txt python ml/tools/eval_diu_app_path.py <aman_raw> ... AMAN name=...
```

## 12. Limitations, blockers, next actions
- **No unread test set remains.** DIU B and the Aman subset have each been read once. Any new model trained now can only be checked on sets already used, so a fair final test needs new data: for example, consented field photos from new districts, labelled by an agronomist.
- **What the tests cover:**
  - DIU covers healthy, blast and tungro (white-background close-ups);
  - Aman covers healthy, blast and brown spot;
  - no final test covers sheath blight or leaf smut.
- **Tungro recall is still low** (0.29 on DIU B).
- **Before any production switch:**
  - update the Accuracy page and the About text (MobileNetV3 → EfficientNet-B0, v8 numbers);
  - check the developer parity page (it uses v1 samples);
  - test on a real phone (user task U1).
