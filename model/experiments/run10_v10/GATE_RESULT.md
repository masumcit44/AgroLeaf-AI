# v10 gate result (3 Nov 2026; tests read once for v10; Sylhet unread)

App path: `ml/tools/eval_diu_app_path.py` (half B and AMAN modes), compared with v8_b0's earlier reads of the same sets.

| Condition (PROTOCOL.md) | v8_b0 | v10 | Result |
|---|---|---|---|
| 1. DIU half B raw macro-F1 higher | 0.562 | **0.784** | PASS |
| 2. DIU half B correct outcome ≥ v8; wrong answers ≤ v8 + 1 pt | 47.2% / 20.9% | **81.7% / 7.6%** | PASS |
| 3. Sylhet (`eval_sylhet_v9.py`) | — | not read | NOT EVALUATED |
| 4. Aman unique raw macro-F1 ≥ v8 − 2 pts (0.899) | 0.919 | 0.896 (−2.25 pts) | **FAIL, by 0.25 pts** |

**DIU half B, v10.**
- Right among answered: 84.2% (v8: 46.7%).
- Unsupported problems named as a disease: 6.7% (v8: 35.0%).
- Diseased called Healthy: 6.0% (v8: 8.8%).
- Per class (precision / recall / F1):
  - healthy 0.82 / 0.88 / 0.85;
  - blast 0.88 / 0.83 / 0.86;
  - tungro 0.91 / 0.50 / 0.65.

**Aman unique (159 diagnosable photos).**
- v10 and v8 disagree on 7 photos.
- Paired bootstrap of the macro-F1 difference (top-1 over the six diagnosable classes): −0.026, 95% CI [−0.057, +0.006].
- Blast precision 0.87 vs 0.94; brown spot recall 0.73 vs 0.76; healthy identical.

**Verdict under the protocol as written: FAIL (condition 4).** v8_b0 stays live; Sylhet stays unread. Any release of v10 would be a user decision that overrides the written gate, and would be stated as such.
