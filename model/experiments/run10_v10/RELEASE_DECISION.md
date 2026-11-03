# v10 release decision (3 Nov 2026)

**Decision:** the project owner chose to release v10 (`V10_b0_320_diuA`, sha256 `a296be9e…09936f89e`) in place of v8_b0. This overrides two failed pre-written gate conditions:
- **Aman unique:** macro-F1 0.896 vs 0.919. That is −2.25 pts against a −2 pt limit; 7 of 159 photos change, and the paired 95% CI is [−5.7, +0.6] pts.
- **Sylhet:** macro-F1 0.570 vs 0.572, a tie. v10 also cannot reach v8's answer rate, so the matched-rate conditions fail.

**Why the owner released it anyway:**
- It gives fewer wrong answers than v8 on all three independent tests:
  - DIU-B 7.6% vs 20.9%;
  - Sylhet 27.7% vs 32.9%;
  - Aman 18.0% vs 18.7%.
- On DIU-B, macro-F1 is 0.784 vs 0.562, and 84% of answers are right vs 47%.

**Rollback:** v8_b0 (`rice-effb0-v8-320.onnx`, `metrics-v8.json`, `_v8` charts) and v1 + G1 stay in the deployed bundle.

**Stated publicly:** the Accuracy page limitations name the override and the failed conditions (`metrics-v10.json`).
