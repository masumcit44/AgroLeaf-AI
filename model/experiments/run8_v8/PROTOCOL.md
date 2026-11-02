# v8 protocol — fixed before training (2 Nov 2026, ~10:20 BST)

**Evidence so far (DIU half A):**
- 320 input beats 224: v7 macro-F1 0.498 vs 0.447.
- v7_320 sends many healthy and blast leaves to other_rice and cannot reach the live answer rate.
- v6's international data at 224 did not help overall, but improved blast under zoom (tiles 0.58 vs 0.48).

**Question:** at the right scale (320), does more diverse field data and/or a larger backbone fix the coverage ceiling?

## Variants (run in this order; each one's outputs are saved as soon as it finishes)
1. **V8_all_b0_320:** v7_320 data plus field photos from:
   - Paddy Doctor (Tamil Nadu; CC0 per mirror, original licence unverified);
   - Sethy (India; CC BY 4.0, Mendeley 10.17632/fwcj7stb8r.2);
   - Taiwan (`raingel`, CC BY 4.0; folder codes BO = brown spot, MO = blast, NO_DISEASE = healthy, HE = herbicide → other_rice).

   Same recipe as v7: EfficientNet-B0, 320 input, 14 epochs, seed 42, strong augmentation, sqrt-per-source class-balanced sampling.

   Excluded:
   - Vietnam (`minhhuy2810`): web-collected; 190 images within 4 bits of DIU.
   - Karnataka: 200 images, 140 shared with Sethy.
2. **V8_all_b2_320:** the same data with EfficientNet-B2 (timm, ImageNet pretrained).
   - The ONNX file will be about 35 MB.
   - If it is selected, it is deployed as ≤ 25 MiB parts joined in the browser, verified by the decode-path test before any release.

## Held out
- DIU and Aman: leakage guard ≤ 4 pHash bits; logits saved, no metrics printed.
- Aman is scored only on `run7_v7/aman_unique_gt8.txt`.

## Selection (DIU half A, app rule, `ml/tools/eval_diu_app_path.py`)
- Among V7_dhan_320, V8_all_b0_320 and V8_all_b2_320: more right answers at max(live coverage on A, 30%).
- If no variant reaches that answer rate, the one with the highest raw macro-F1 on A is recorded as the best candidate, but it is **NO-GO** (amendment 2 of v5). Half B stays unread.
- Half A is now used a fourth time, so its numbers are optimistic; half B and Aman decide.

## Release gate
Unchanged from `run7_v7/PROTOCOL.md` (+ amendment 1 for Aman).
