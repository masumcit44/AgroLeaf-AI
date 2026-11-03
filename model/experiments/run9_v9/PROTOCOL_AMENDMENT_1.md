# v9 amendment 1 — v9b (written 3 Nov 2026, ~10:00 BST, before v9b training; Sylhet still unread)

**Why:** `HALF_A_RESULT.md`.
- V9_mix_dann recognises blast and tungro much better (DIU-A raw macro-F1 0.652 vs v8_b0 0.545).
- But it is under-confident: a Mixup effect, plus an under-trained early epoch (7 of 18) chosen on a noisy score.
- Its Healthy precision on in-domain val is 95.0% at the ≥ 0.90 rule, vs v8_b0's 98.9%. A Healthy-cutoff change cannot close that gap (checked on in-domain val only).

## v9b (one variant: `V9b_dann`)
**Unchanged from V9_mix_dann:** data, guard, augmentation, the domain-adversarial head (λ ramp to 0.1), input 320, seed, optimiser, OneCycle.

**Changes:**
- **20 epochs.** Mixup / CutMix only in epochs 1–16; **off in epochs 17–20**, which restores calibration (standard practice).
- **The final weights are fixed in advance:** the mean of the epoch 17–20 weights, with BN statistics recomputed.
  - No checkpoint is chosen on DIU-A.
  - DIU-A is still printed each epoch, as a log only.
- Calibration: as before (in-domain val; temperature; threshold for ≥ 92% right).

## Before Sylhet is read
1. On **DIU half A** (app path), v9b must beat live v8_b0 at v8_b0's answer rate (right-answer difference > 0) **and** reach that rate. Otherwise NO-GO, and Sylhet stays unread.
2. If it passes: one read of Sylhet with `ml/tools/eval_sylhet_v9.py` (v9b vs v8_b0). The gate in `PROTOCOL_EVAL.md` is unchanged.
