# Lead review of R1 (`generalization_research_antigravity.md`, Antigravity, `c09ad17`)

Reviewed 2 Nov 2026 before integration. Verdict: **useful as background; its experiment plan is not adopted as written.**

## Checked and correct
- Repo facts in §1 match `metrics-v1.json` and `DECISION_RESULT.md` (v1 internal 0.8427 macro-F1; Sylhet 62.2% / 53.7%; brown spot recall 0.0749; v4-B 15.9% coverage, 0% on Gazipur and Sylhet; leaf-check hue bins 6–14).
- arXiv 2609.31709 (Paul, 20 Sep 2026) exists with that title; abstract confirms 5,419 images, 6 transfer pairs, strong augmentation +0.070 cross-dataset macro-F1 (p < 0.001), AdaBN harms transfer, DINOv2 probe collapses like CNNs.
- PlantDoc (arXiv 1911.10317) abstract: accuracy gain "up to 31%".

## Not verified (not in the abstracts; treat as unconfirmed)
- Paul 2026: within-dataset 0.719 / cross-dataset 0.436 macro-F1, DINOv2 "≈ 0.44", "background randomization accounts for the largest share".
- Mohanty 2016 31.4% and BioCLIP 16.8% figures were not re-checked here.

## Why the five experiments are not run as written
- They reuse **Sylhet and Gujarat as final tests**. Both were already read once (DECISION_RESULT.md), so they are no longer fresh tests.
- Exp 2 and Exp 4 **tune or train on raihan**, which is now v5/v6 training data; DIU is the current fresh test (run5_v5/PROTOCOL.md + amendment 1).
- Exp 3 (open-set reject class) **already exists**: v4/v5/v6 have `other_rice` and `not_rice`.

## Adopted ideas
1. Per-class thresholds with an explicit coverage floor (Exp 2): candidate post-processing for v5/v6, fitted on their in-domain validation only.
2. Background randomization (Exp 1): a candidate for v7 if v5/v6 fail, with the Paul paper as support for strong augmentation.
3. BioCLIP / DINOv2 backbone (Exp 5): low priority; the Paul abstract reports DINOv2 collapses too.
