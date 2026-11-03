# Override: Sylhet read goes to v10 (3 Nov 2026; recorded before the read)

**The written rule.**
- `run9_v9/PROTOCOL_AMENDMENT_2.md` gives the single Sylhet read to v9c, the only v9-family candidate that qualified on half A (+1.3 pts, CI −2.9 to +5.9).
- `run10_v10/PROTOCOL.md` then leaves v10's condition 3 unevaluated.

**The user's decision.** The user approved giving the Sylhet read to v10 instead. This is a stated override of the written rule, on my recommendation, made before either model was scored on Sylhet.

**Reasons.**
- On DIU half B (never trained on), v10 is right on 84% of its answers, against v8's 47%.
- It names an unsupported problem as a disease on 7% of those photos, against 35% for v8 and 49% for v9c on half A.
- v9c's gain is within noise.

**Unchanged.**
- The Sylhet test: `ml/tools/eval_sylhet_v9.py`, its three conditions and its mapping.
- v10's failed condition 4 (Aman −2.25 pts against a −2 pt limit) stays on record.
- **v9c is not scored on Sylhet.**
- Any release of v10 is reported as a release under this override.
