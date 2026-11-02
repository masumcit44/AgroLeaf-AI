# AgroLeaf AI — autonomous mission report (2 Nov 2026, for 4:00 PM)

**Labels:** VERIFIED = measured, with the file or commit named. PENDING = not yet measured. HYPOTHESIS = an explanation not yet proven.

Branches:
- `feat/model-v3`: experiments and reports.
- `deploy/candidate-ready`: website support for a new model; not on production.
- `main`: production.

## 1. Data actually collected and verified
- **Dataset search** (subagent, Kaggle / HF / Mendeley / Zenodo): every source with licence, counts and rejection reasons is in the subagent report (section 1 of the overnight report).
- **Consolidated manifest** (Kaggle CPU job `agroleaf-data-manifest` v2; script `model/experiments/data_manifest/kaggle_data_manifest.py`; results in `data_manifest/results/`, commit `1a9d814`). Per image it records MD5, pHash, licence, country, role and white-background score. VERIFIED.
- **Rejected or restricted:**
  - `nirmalsankalana/dhan-shomadhan` folder labels are wrong. Labels are taken from filename codes instead.
  - The Vietnam set (`minhhuy2810`) is web-collected. It was used only in v6.
  - Aman 2025 (HF) is partly copied from other datasets (amendment `run7_v7/PROTOCOL_AMENDMENT_1.md`).

## 2. Unique images, classes, sources, licences (VERIFIED, manifest v2)
- 41,665 image files from 15 sources → **30,419 unique scenes** (pHash ≤ 4 bits, clustered across sources); 3,899 exact duplicate files; 187 clusters with conflicting labels.
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

- **Gaps:**
  - leaf smut has a single field source (Gazipur);
  - sheath blight comes only from Bangladesh;
  - no usable open data was found from Vietnam, the Philippines, Indonesia, Thailand or China (licence missing or web-scraped).
- **Licences:** CC BY 4.0 (Mendeley sources, UCI, Taiwan, Aman), CC0 claimed by mirrors (Paddy Doctor: original licence unverified), MIT (Karnataka). Details per source are in `summary.json`.

## 3. Experiments
| Run | What changed | Status | DIU half A result |
|---|---|---|---|
| v5 | Bangladesh-only, B0, 224 | done | NO-GO: cannot reach the live answer rate |
| v6 | v5 + India / Vietnam / Karnataka | done | NO-GO: 37.7% vs live 40.4% right at the same rate |
| v7 | Bangladesh + Dhan white-background; 224 vs 320 | done | NO-GO: 320 best macro-F1 0.498 (live 0.334), cannot reach the live answer rate |
| v8 | v7_320 data + India / Taiwan field; B0 and B2 at 320 | **RUNNING** | PENDING |

## 4. Model versions, configs, checkpoints
- Protocols: `run5_v5/PROTOCOL.md` (+ amendments 1 and 2 in `HALF_A_RESULT.md`), `run7_v7/PROTOCOL.md` (+ amendment 1), `run8_v8/PROTOCOL.md`.
- Kernels: `run*/kaggle_train_v*.py`.
- Outputs (ONNX, calibration, logits) come from `kaggle kernels output mdmasumakondha/agroleaf-train-vN`.
- Shared settings: EfficientNet-B0, 14 epochs, AdamW lr 1e-3, label smoothing 0.1, seed 42.

## 5. Baseline vs candidates
DIU half A, 1,378 photos, app preprocessing and rule: `run5_v5/HALF_A_RESULT.md`, `run7_v7/HALF_A_RESULT.md`. PENDING for v8.

## 6. Biggest failure modes and what was done
1. **Small lesions lost at 224 px.** Zoom test: blast recall 0.14 → 0.48 (v5). → v7 / v8 at 320 px.
2. **DIU is cut-out leaves on white with early symptoms.** Training data is mostly field scenes. → Dhan-Shomadhan white-background added (v7). Savar is also white-background, so this is not the whole cause.
3. **Live v1 calls 24% of diseased DIU leaves Healthy** (blast → Healthy 202 / 347). v7_320: 4.3%.
4. **Tungro is mostly missed by every model** (recall ≤ 0.30). HYPOTHESIS: DIU tungro is early yellowing, unlike Gazipur's.
5. **Coverage ceiling:** new models send uncertain leaves to "other problem" and answer less often than the live app.
   - The live app's answer rate on DIU includes many wrong answers.
   - The locked rule was **not** changed after seeing this.

## 7. Acceptance gate
PENDING (v8). So far: not passed by v5, v6 or v7.

## 8. Website deployed?
**No new model deployed.** Production = v1 + I9 + G1 (verified: `/data/calibration.json` on https://agroleaf-ai.pages.dev lists the G1 gate).

Deployment readiness is on branch `deploy/candidate-ready`. Preview: https://deploy-candidate-ready.agroleaf-ai.pages.dev.
- 8-output decision (`not_rice`, `other_rice` never named);
- any input size;
- models served as < 25 MiB parts;
- unit tests 79/79, browser decode-path 25/25, split-model test 25/25.

## 9.–10. Live URL and live tests
https://agroleaf-ai.pages.dev, v1 + G1 (unchanged since `6d76992`). New live tests: PENDING (only if a candidate passes).

## 11. Commits
Commits on `feat/model-v3`:
- `c09ad17`→`641decb` (R1 review)
- `8606d7e` (manifest kernel, DIU halves)
- `5c7a7e0` (v5 / v6 half A)
- `038469d` (v7)
- `e096d9a` (manifest fix)
- `1a9d814` (manifest results, Aman amendment)
- `dd0f3e8` (v7 half A)
- `37a779c` (v8)

Commits on `deploy/candidate-ready`: `0f3bebc`, `245b85b`.

## 12. Limitations and next actions
PENDING (after v8).
