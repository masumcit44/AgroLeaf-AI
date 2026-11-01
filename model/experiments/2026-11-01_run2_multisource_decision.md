# Run 2 (multi-source) vs Run 1 — decision: keep Run 1

**Date:** 1 Nov 2026 · Lead decision · Kaggle notebooks: `agroleaf-train-v1`, `agroleaf-eval-external-v1`, `agroleaf-train-v2` (private)

| Model | Train data | Internal test (own split) | Sylhet-Dhaka (unseen district, 1,560 images) | Unseen-disease (BLB) rejection |
|---|---|---|---|---|
| **Run 1 (shipped)** | RiceLeafDiseaseBD (Gazipur), 6,676 train images | n=1,499 · acc 0.869 · macro-F1 0.843 · coverage 0.947 | acc 0.520 · macro-F1 0.533 · coverage 0.789 · selective acc 0.560 | 0.277 |
| Run 2 (not shipped) | Gazipur + Savar (BD5 Kaggle copy), 8,585 train images | n=1,849 (mixed sources; not comparable) · macro-F1 0.891 · coverage 1.000 | acc 0.540 · macro-F1 0.544 · coverage 1.000 · selective acc 0.540 | 0.000 |

**Run 1 on Savar (3,150 images, white-background cut leaves):** acc 0.336, macro-F1 0.177, coverage 0.857. It predicts "healthy" for almost everything.

## Why Run 1 stays
- Run 2's Sylhet gain is small (+0.02 accuracy).
- Run 2's calibration chose the lowest threshold, so it **never says "not sure"**: coverage 1.0, unseen-class rejection 0.0. That breaks the product's core safety behaviour.
- Run 1 keeps a working abstention (21–28 % of unseen-disease images rejected).

## Honest conclusion (shown on the Accuracy page)
Both models generalise poorly outside Gazipur; Brown spot recall on Sylhet is about 6 %. The app is a prototype screening aid. More multi-district training data, and a minimum threshold floor in calibration, are the next steps.

External sets are community Kaggle copies (`sikanderk/riceleafbd-mendeley`, `sohagdewan/riceleafdisease-bd5`); their provenance was not verified file-by-file against Mendeley.
