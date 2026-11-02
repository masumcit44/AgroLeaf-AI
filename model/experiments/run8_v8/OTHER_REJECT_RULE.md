# Extra rejection rule for unsupported rice problems (2 Nov 2026, ~20:25 BST)

**Problem:** v8_b0 names a disease for 26% of the Aman "other rice problem" photos (bacterial blight, leaf scald, narrow brown spot) and for 33% on DIU half B.

**Rule (no retraining):** in addition to the app rule, do not name a disease if p(other_rice) ≥ τ, even when other_rice is not the top output. Show "other rice problem" instead.

**τ chosen on the validation splits only** (kernel `preds_*_val.npz`, 3,364 rice photos, 693 other_rice).
- Pre-set criterion: the largest drop in escape with at most 2 points loss of known-class coverage.
- Candidates: 0.05 / 0.10 / 0.15 / 0.20 → **τ = 0.05**.

| Set | Rule | Known-class coverage | Right among answered | Other problem named as disease |
|---|---|---|---|---|
| Val (selection) | current | 91.7% | 95.0% | 4.8% |
| Val (selection) | τ = 0.05 | 90.0% | 95.1% | 1.3% |
| In-domain test (held out, not used for the choice) | current | 93.2% | 92.9% | 5.7% |
| In-domain test (held out, not used for the choice) | τ = 0.05 | 91.3% | 93.2% | 2.4% |

Raising the main threshold instead (0.4 / 0.5 / 0.6) barely reduces escapes (5.7% → 4.4% at 0.6, with a larger coverage loss).

**Next, written before reading:** check τ = 0.05 once on DIU half B and the Aman unique subset.
- Both are **already-used** sets, so the result is supporting evidence, not a fresh test.
- τ is not changed after that check.
