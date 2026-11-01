# Evaluation plan

| Test set | What it shows |
|---|---|
| Internal test (15%, group-split, RiceLeafDiseaseBD v3) | Performance on the same district, season and phones as training |
| **External test** (mapped classes only, from RiceLeafDisease-BD5 Savar and RiceLeafBD Sylhet–Dhaka) | **Real generalisation.** This is the headline number |
| Unseen-disease set (BLB, Narrow Brown Spot, …) | Whether the model says "not sure" instead of a wrong disease |
| 20–50 own phone photos or non-rice images (optional) | Sanity check: other plants, hands, soil, blur |

## Metrics (report all of them, per class where relevant)
- Accuracy (never on its own)
- **Macro-F1**
- Per-class precision, recall and F1
- Confusion matrix (counts + row-normalised)
- **Selective prediction:** coverage at threshold *t*, and accuracy on the images that get an answer
- Unseen-disease rejection rate: the share below *t*
- Calibration: ECE before and after temperature scaling
- Model size (MB) and browser inference time (ms) on a real phone

## Reporting rules
- Show the external numbers on the in-app "How accurate is it?" page and on the deck, with sample sizes.
- Leaf Smut has no external test data. Say so.
- Any class with external recall below 0.6 goes to "not sure" (it is never shown as a confident answer). Document this.
- No accuracy number appears anywhere until it comes from these runs.
