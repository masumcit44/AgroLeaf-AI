# v9b half-A result (3 Nov 2026; DIU half A, the selection set; Sylhet unread)

Scored with the app path (`ml/tools/eval_diu_app_path.py`, `ml/tools/eval_blend_halfA.py`). Blend thresholds come from in-domain validation only.

| | raw macro-F1 | answered | right among answered | at v8's rate: right vs v8 (95% CI) | correct outcome* | wrong answer |
|---|---|---|---|---|---|---|
| v8_b0 (live) | 0.545 | 38.3% | 50.0% | — | 49.1% | 19.2% |
| v9b | 0.658 | 53.5% | 39.6% | −4.5 pts (−8.7, −0.4) | 40.6% | 32.3% |
| avg(v8_b0, v9b) | 0.667 | 32.1% (max reachable) | 49.0% | rate not reachable | 46.5% | 16.4% |
| classwise(v8_b0, v9b) | 0.671 | 39.6% | 45.0% | −4.7 pts (−8.3, −1.2) | 43.6% | 21.8% |

\* Named and right, or an `other_rice` photo not named. Log only; not a gate criterion.

**Verdict under PROTOCOL_AMENDMENT_2.md: no candidate qualifies.** Sylhet stays unread.
- The v9 family ranks images better raw (+0.11 to +0.13 macro-F1).
- But it names many "other problem" photos as diseases: v9b's unsupported escape is 55.6%, against v8's 31.5%.
- Note that the training log's DIU-A macro-F1 (0.45) uses a different definition (8-class argmax over the kernel's 1,356 rows); the table uses the app-path definition.

**Next:** v9c (ConvNeXt, amendment 3) is still to be scored. v10 (`run10_v10/PROTOCOL.md`) adds DIU half A as training data.
