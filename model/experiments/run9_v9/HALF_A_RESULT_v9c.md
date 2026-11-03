# v9c half-A result (3 Nov 2026; DIU half A, the selection set; Sylhet unread)

| | raw macro-F1 | answered (as calibrated) | at v8's rate (38.3%): right | diff vs v8 (95% CI) | qualifies |
|---|---|---|---|---|---|
| v8_b0 (live) | 0.545 | 38.3% | 50.0% | — | — |
| **v9c** (ConvNeXt-Tiny 384) | 0.704 | 54.9% | 51.3% | **+1.3 pts** (−2.9, +5.9) | **yes** |
| avg(v8_b0, v9b, v9c) | 0.715 | 35.1% (max reachable) | rate not reachable | — | no |

Earlier candidates (`HALF_A_RESULT_v9b.md`): none qualified.

**Under PROTOCOL_AMENDMENT_2.md, v9c is the only qualifying candidate**, so it is the one that gets the single Sylhet read (`ml/tools/eval_sylhet_v9.py`).

**Consequence for v10** (`run10_v10/PROTOCOL.md`): v10's condition 3 (Sylhet) is not evaluated, and v10 is decided on conditions 1, 2 and 4 only. Condition 4 failed by 0.25 pts (`run10_v10/GATE_RESULT.md`).

**Notes.**
- v9c is 106 MB as ONNX: 5 parts under 25 MiB, about 4× v8's inference cost.
- At its own threshold, v9c names an unsupported problem as a disease on 48.6% of those photos (v8: 31.5%). The Sylhet gate's unsupported condition checks this at v8's rate.
