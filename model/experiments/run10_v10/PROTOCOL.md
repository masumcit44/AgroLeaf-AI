# v10 protocol — Bangladeshi field data lever (written 3 Nov 2026, ~12:30 BST, before training; Sylhet unread)

## Why (evidence from half A, the selection set)
- Every model so far is weakest on DIU Bangladeshi field photos, and the in-domain thresholds do not transfer there.
  - v8_b0 (live): correct outcome 49.1%, while answering "other problem" for every photo would score 43.8%.
  - The v9 family ranks better raw (macro-F1 up to 0.65) but is rarely confident enough to answer (≤ 21% answered).
- 44% of DIU rice photos are problems the app does not name (insect damage, leaf scald, stripes, leaffolder). No training source shows these as `other_rice`.
  - v8_b0 wrongly names a disease on 31.5% of them.
- Model tricks (Mixup, domain-adversarial training, blends, 4-view TTA) did not fix this. The missing piece is training data from these fields.

## The one change: DIU half A becomes training data
- **Base recipe: v8 exactly** (`run8_v8/kaggle_train_v8.py`, `V8_all_b0_320`):
  - EfficientNet-B0 at 320, 14 epochs, same augmentation and sampling, best epoch by in-domain validation macro-F1.
  - Only one variant is trained.
- **DIU half A** (same half rule as `run9_v9`: md5 of the pHash minus its last hex digit; even = A) joins the pool with the usual hash split:
  - 80% train, 10% validation, 10% test.
  - The validation rows therefore also set the temperature and the threshold, so Bangladeshi field photos take part in calibration.
- **Held out, never trained on and used for no choice:**
  - DIU half B;
  - Aman 2025 (all rows);
  - Sylhet (RiceLeafBD Sylhet-Dhaka);
  - Gujarat.
- **Leakage guard** (as in v9): any training, validation or test row within 4 pHash bits of a held-out image is dropped.
  - This also removes DIU half-A images that near-copy half-B images.

## Release gate vs v8_b0 (all four must pass; written before any v10 result exists)
Test sets: DIU half B, Aman unique (422), Sylhet.
- DIU half B and Aman were each read once before, for v8's release. v10 never trains or tunes on them.
- Sylhet is read once, unless a v9-family candidate qualifies at the half-A check first (`run9_v9/PROTOCOL_AMENDMENT_2.md`). In that case the gate is conditions 1, 2 and 4, and condition 3 is not evaluated.

1. **DIU half B raw macro-F1** is higher than v8_b0's (0.562).
2. **DIU half B app outcomes** (`ml/tools/eval_diu_app_path.py` rules):
   - the correct-outcome rate (named and right, or an `other_rice` photo not named) is at least v8_b0's;
   - and the wrong-answer rate is at most v8_b0's + 1 point.
3. **Sylhet** (`ml/tools/eval_sylhet_v9.py`, unchanged): macro-F1 higher; right ≥ v8_b0 at v8_b0's answer rate with CI lower bound ≥ −2 points; false-healthy and unsupported each ≤ +2 points.
4. **Aman unique raw macro-F1** is no more than 2 points below v8_b0's (0.919).

If any condition fails, v8_b0 stays live, and the result is reported as it is.
