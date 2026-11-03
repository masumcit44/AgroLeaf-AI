# v9 amendment 2 — blends of v8_b0 with v9b (written 3 Nov 2026, ~10:20 BST; v9b still training; Sylhet unread)

**User's idea:** use v8 where v8 is better and v9 where v9 is better.

**Tested on DIU half A with the first v9** (selection set; blend threshold fitted on in-domain val only):

| | raw macro-F1 | recall healthy / blast / tungro | answered |
|---|---|---|---|
| Average blend | 0.627 | 0.74 / 0.48 / 0.48 | 19.2% |
| Class-wise blend | 0.638 | 0.75 / 0.48 / 0.52 | 20.9%; diseased called Healthy 0.0% |

Neither reaches v8_b0's answer rate (38.3%), because v9 is under-confident.

## Candidates at the v9b half-A check (all fixed now)
1. **v9b** alone.
2. **avg(v8_b0, v9b):** the mean of the two calibrated probability vectors.
3. **classwise(v8_b0, v9b):** class weight for v8_b0 = 1.0 for healthy, 0.0 for blast and tungro, 0.5 for the rest (brown spot, leaf smut, sheath blight, other_rice, not_rice); then renormalised.
   - The weights come from the first v9's half-A per-class recalls.
   - They are **not** refitted for v9b.

**Blend thresholds:** the v8-style rule on in-domain val (smallest threshold giving ≥ 92% right on rice rows). The app rules are unchanged (Healthy ≥ 0.90, leaf smut never named, reject outputs never named).

## Rule before Sylhet
- A candidate qualifies only if, on DIU half A, it reaches v8_b0's answer rate and gives more right answers there than v8_b0 (difference > 0).
- Among qualifying candidates, the one with the most right answers at that rate goes to the single Sylhet read.
- If none qualifies: NO-GO, and Sylhet stays unread.

## Deployment cost of a blend
- Two ONNX files (2 × 15.3 MiB) and two inference passes in the browser.
- The decode-path test and the live tests must pass before any release.
