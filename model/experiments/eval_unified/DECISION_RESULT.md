# v1 vs v4-B release decision — RESULT (2 Nov 2026)

**Decision: NO-GO for v4-B. v1 stays deployed, unchanged.** The selection was locked before the final tests were read. The final tests (Sylhet, Gujarat) were read once, at 2026-11-02 00:47:02 BST, and changed nothing.

## Integrity (verified)
- **Evaluation job:** Kaggle `mdmasumakondha/agroleaf-eval-unified` v2, status COMPLETE. Code: `kaggle_eval_unified.py` at `b3eed98` on `feat/model-v3`.
- **Same images for every model:** all 24 sets, 13,133 images, are identical to the v4 training run's own lists (file, label and order). The job stops on any difference.
- **Model files (SHA-256):**

  | Model | SHA-256 | Size | CPU time per image (1 thread) |
  |---|---|---|---|
  | v1 | `aaa9e9f7bc920a26f61bc52f6e0ce902c92b29d3c21f412bfcc5d1878c4cbf54` | 16.05 MiB | 11.7 ms |
  | v4-B | `cae86b66410a234bf0e3b4b3fdb7466e72c7873e106cd85b03d7cbaf9e04e7ac` | 15.3 MiB | 26.8 ms |
  | v3 EfficientNet-B0 | `8bbea6cf546c6c9108f3312ce483fed79589f9bef5b9d88163fd0bf46f05f3a2` | | |
  | v3 ConvNeXt-T | `a76e1188ec2a44a9f9323bb662a5a32de3654ce9927152d8d6fa5921b2235578` | 106 MiB | 186 ms |
  | v4-A | `b271e22724e9e8a74a0b52de8388c869a10946f33c9dd110735e8704eee56adc` | | |
  | v4-C | `81c8c04065edbd735367d4472e450003140ef030f3b913b20419ee1a232f4200` | | |

  The v1 file is byte-identical to `main` and to the live site.
- **Reproduction check:** the job's v4-B logits match the training run's own predictions (max difference 0.045, GPU half precision vs CPU; the top class agrees on 99.7% of raihan photos).
- **Rule:** `DECISION_PROTOCOL.md`, committed before results (`907a630`). Scored with `ml/tools/coverage_compare.py` (`eb99857`) and `ml/app_decision.py`, which is verified against `decide.js`.

## Calibration (as the protocol prescribes)
- **v1:** deployed settings: temperature 0.909, threshold 0.48, Healthy ≥ 0.90, leaf smut "not sure", leaf-colour gate.
- **v4-B:** fitted on the selection set (raihan + non-rice validation): temperature 1.76. The ≥ 90% right-answer target was not reachable, so the threshold is capped at 0.95.

## Selection set: raihan150146 (1,794 rice photos, 813 of them unsupported diseases)
| | v1 deployed | v4-B |
|---|---|---|
| Raw accuracy / macro-F1 (diagnosable classes) | 0.308 / 0.414 | 0.530 / 0.597 |
| Recall: healthy / blast / brown spot / sheath blight | 0.91 / 0.10 / 0.10 / 0.30 | 0.94 / 0.33 / 0.16 / 0.78 |
| ECE | 0.411 | 0.105 |
| App coverage (maximum) | 68.5% | 15.9% |
| Right answers at v1's deployed coverage | 9.8% | not reachable |
| Right answers at 15.9% coverage (286 answered each) | 10.1% | 28.7% (difference 95% CI +12.6 to +24.7 points) |
| Unsupported disease shown as known (deployed / selected rule) | 80.2% | 16.0% |
| Diseased called Healthy | 0% | 0% |
| Non-rice rejected (natural, PlantVillage, posters, memes, generated) | 95.5 / 89.6 / 91.8 / 97.6 / 84.0% | 100% on each |

**Protocol conditions:**
1. v4-B cannot reach the 30% minimum coverage. **FAIL** (decisive).
2. Raw macro-F1 higher: PASS.
3. Safety no worse: PASS.
4. Non-rice rejection ≥ v1: PASS.

## Supporting checks (not final tests)
| Set | v1 | v4-B |
|---|---|---|
| Gazipur internal test (1,499) | raw 0.862; app answers 81.2%, 90.7% right | raw 0.787; app answers **0%** with its calibration |
| Savar test (313) | answers 38.4%, 55.3% right | answers 0% (Savar is in its training data, so not independent) |

## Final tests (read once, after the lock)
**Sylhet (1,423 photos, made upright):**

| | v1 (selected) | v4-B (reference) |
|---|---|---|
| Raw accuracy / macro-F1 | 0.543 / 0.548 | 0.366 / 0.435 |
| App: answered / right | 62.2% / 53.7% | 0% |
| Diseased called Healthy | 0.7% | 0% |
| Unsupported escape | 67.6% | 0% |

**v1 confusion on Sylhet:**
- brown spot → blast 151, tungro 138, brown spot 26;
- tungro → tungro 347, brown spot 65, healthy 59;
- healthy → healthy 221.

**Gujarat (120: 40 brown spot, 40 leaf smut, 40 bacterial blight):**
- **v1:** raw 0.062; the app answers 50%, 5% right; 6.2% of diseased leaves called Healthy; leaf smut recall 0.07 (the app always shows it as "not sure").
- **v4-B:** answers 0%.

## Conclusions
1. **v1 stays deployed.** v4-B fails the locked coverage rule, answers nothing at home under its prescribed calibration, and is worse than v1 on Sylhet.
2. **v1's real limits must be published (roadmap I3b).** On photos from districts it has not seen, the answers it gives are often wrong:
   - raihan: 9.8% right;
   - Sylhet: 53.7% right;
   - Gujarat: 5% right.

   It often names a known disease for one it doesn't cover (Sylhet 67.6%, raihan 80.2%). **Brown spot is almost never recognised outside Gazipur** (Sylhet recall 0.07).
3. **No threshold fixes v1 on raihan:** right answers stay at 8–10% at every coverage level from 20% to 68.5%.
4. **The path to a better model is Bangladeshi field data** (roadmap P3), not another training run before the deadline.

Raw outputs (all logits, labels, file names) are in the evaluation job's output on Kaggle (`eval/` folder) and in `final_tests_once.json` / `decision_v1_vs_v4B.json` (lead scratch, reproducible from the job output with the committed tools).
