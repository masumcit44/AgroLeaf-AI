# v10 Sylhet result (3 Nov 2026; read once, under OVERRIDE_SYLHET.md)

`ml/tools/eval_sylhet_v9.py` (unchanged); 1,446 photos after 114 exact duplicates were dropped.

| | v8_b0 (live) | v10 |
|---|---|---|
| Raw macro-F1 / accuracy | 0.572 / 0.457 | 0.570 / 0.444 |
| Answered (as calibrated) | 59.6% | 55.5% (max reachable) |
| Right among answered | 44.8% | 50.1% |
| Correct outcome* | 37.6% | 40.3% |
| Wrong answer | 32.9% | 27.7% |
| Diseased called Healthy | 0.5% | 0.1% |
| Unsupported (bacterial leaf blight) named as a disease | 55.0% | 48.4% |

\* Named and right, or an `other_rice` photo not named. Log only, as before.

Per-class F1, v8 → v10:
- healthy 0.85 → 0.85;
- brown spot 0.39 → 0.40;
- tungro 0.43 → 0.43;
- other_rice 0.28 → 0.36.

**No class meets 90%.**

**Gate (`run9_v9/PROTOCOL_EVAL.md`): FAIL.**
- Condition 1 fails: macro-F1 −0.002.
- Condition 2 fails: v10 cannot reach v8's 59.6% answer rate.
- Condition 3 is marked failed because it is evaluated at that unreachable rate. As calibrated, false-healthy and unsupported are both lower than v8's.

**Summary of v10 on the three unseen sets.**
- Fewer wrong answers than v8 on all three:
  - DIU-B 7.6% vs 20.9%;
  - Sylhet 27.7% vs 32.9%;
  - Aman 18.0% vs 18.7%.
- Much higher macro-F1 on DIU-B; equal on Sylhet; 2.25 pts lower on Aman.
- The written gates fail (Aman condition 4; Sylhet conditions 1–3), so **v8_b0 stays live**. Releasing v10 would be a second user override.
