# v9 evaluation protocol — fixed before v9 exists (2 Nov 2026, ~20:50 BST)

**Goal from the user:** precision, recall and F1 of at least 90%. This is reported per class, honestly; the release decision uses the gate below.

## Design inputs
`documentation/research/v9_design_inputs.md`: structure of the Dhaka PM2.5 "taken apart" notebook, image-EDA and augmentation research, and the EDA job results (`eda_v9/`).

## Selection (inside the training job; no test set touched)
**Leave-source-out validation**, from the notebook's lesson that validation must copy deployment:
- one whole training source is held out at a time;
- choices (epoch, variant, temperature, threshold) use held-out-source validation, not a random split.

The exact folds are written in `PROTOCOL.md` together with the training design, before training starts.

## Final test (read once, after selection is committed)
- **Sylhet:** RiceLeafBD, Mendeley 10.17632/kx9rx8p2mz, CC BY 4.0. Labels: healthy, brown spot, tungro; bacterial blight → other_rice.
  - Never used for training, selection or calibration by v5–v9.
  - Read once on 1 Nov for v1 only.
  - The EDA job uses its images only for unsupervised nearest-neighbour distances: no labels, no predictions.
- **Gujarat (UCI, 40 + 40 + 40):** reported only (too small to decide anything). It is the only outside leaf-smut set.
- **Not used again for decisions:** DIU half A / half B and Aman (already read). They may be shown as "already-used" references.

## Release gate: v9 replaces live v8_b0 only if all hold on Sylhet
Both systems use the app's preprocessing and rule.
1. Raw macro-F1 (diagnosable classes) is higher.
2. At max(v8_b0 answer rate on Sylhet, 30%), right answers are not lower than v8_b0's, and the paired-bootstrap 95% CI lower bound is ≥ −2 points.
3. Diseased called Healthy ≤ v8_b0 + 2 points; unsupported problems answered ≤ v8_b0 + 2 points.
4. Non-rice rejection ≥ 99% on the not_rice test splits; model file ≤ 25 MiB (or split); browser decode-path test passes.

**Per-class precision, recall and F1 against the 90% target** are reported for both systems, but they are **not** a gate condition. A model that misses 90% can still be better than live, and one that is better is preferred.
