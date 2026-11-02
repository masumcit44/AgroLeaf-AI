# Protocol amendment 1 — two candidates (v5 Bangladesh-only, v6 data-expanded)

Written **before any DIU result was read** (2 Nov 2026, ~02:55 BST; the v5 job is still training; no candidate has scored DIU).

**Why:** the user asked to test whether a much larger, more diverse training set beats Bangladesh-only training on unseen photos. Choosing between two candidates on the same images that decide the release would be selecting on the test set, so DIU is split.

**DIU split:**
- Every mapped DIU image gets a pHash. Group = the pHash with its last hex digit dropped, so near-identical images stay together.
- **A** if md5(group) is even, **B** otherwise.

**Selection (half A only):**
- v5 vs v6, both with their in-domain calibration and the app rule.
- The candidate with more right answers at max(live coverage on A, 30%) is selected. Ties go to the smaller training set (v5).

**Release decision (half B only, read once):** the selected candidate vs the live system (v1 + G1), with the conditions of `PROTOCOL.md` unchanged (≥ +5 points right answers with CI > 0, higher macro-F1, safety no worse than +2 points).

**v6 definition:**
- Identical to v5 (code, seed, schedule, augmentation, not_rice data, calibration rule).
- Training rice data adds Paddy Doctor and Sethy (India), Vietnam, and `thegoanpanda` (Karnataka, MIT).
- "False Smut" → other_rice (it is not leaf smut).
- Same DIU leakage guard.
