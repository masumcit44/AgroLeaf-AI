# v8_b0 release decision (2 Nov 2026, ~20:15 BST)

**Decision by the user (project owner):** deploy V8_all_b0_320 to production.

This **revises the locked gate after the results were seen (post hoc)**. Earlier the same evening the user had kept the locked gate; after reviewing the comparison, the user chose to release.

## What the locked gate said (`run7_v7/PROTOCOL.md` + amendment 1; results in `FINAL_RESULT.md`)
**Passed:**
- DIU half B, all 3 conditions:
  - +5.5 points right at the live answer rate, 95% CI +0.3 to +10.3;
  - macro-F1 0.562 vs 0.324;
  - diseased called Healthy 8.8% vs 21.2%;
  - unsupported shown as disease 33.0% vs 31.7%.
- Non-rice rejection 100%.
- Gazipur internal test 92.4% answered / 88.1% right.
- Size 15.3 MiB.

**Not passed:** the Aman condition "right answers ≥ live − 2 points at max(live answer rate, 30%)".
- v8_b0 cannot answer as many Aman photos (max 50.5% vs live 54.5%), so the comparison could not be made.
- On Aman, the live system's answer rate comes mostly from naming a disease for unsupported problems: 59% of 263.
- v8_b0 results on Aman: macro-F1 0.919 vs 0.495; 62.9% vs 14.8% of answers right.

## How this is stated publicly
- **Accuracy page:** says v8 was released by the owner's decision after this one rule was revised.
- **Submission text:** must say the same.
- **Not to be claimed:** that v8 "passed the pre-registered gate".

## Rollback
The v1 + G1 files remain in `frontend/public/models/` and `frontend/public/data/metrics-v1.json`. Reverting the release merge on `main` restores the previous live system.
