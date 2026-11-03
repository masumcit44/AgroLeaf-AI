# v9 amendment 3 — stronger backbone, v9c (written 3 Nov 2026, ~10:35 BST, before training; Sylhet unread)

**Why:**
- Every model so far is EfficientNet-B0 (ImageNet-1k).
- The EDA shows source-specific features dominate (95% source separability; leave-one-source-out probe 0.12–0.36).
- The user confirmed that model size and inference time are **not** constraints; accuracy is.
- Stronger pretraining and higher resolution are the main untested levers.

## v9c (`V9c_convnext_384`)
- **Backbone:** `convnext_tiny.fb_in22k_ft_in1k` (timm; ImageNet-22k pretraining), drop_path 0.1.
- **Input 384** (app preprocessing Resize 439 + CenterCrop 384); image cache short side 460.
- **Recipe identical to v9b** (`PROTOCOL_AMENDMENT_1.md`):
  - the same data and guard, augmentation, domain-adversarial head (λ → 0.1), sampling, label smoothing;
  - 20 epochs, Mixup / CutMix off in the last 4;
  - final = mean of the last 4 epochs, fixed in advance.
- **Necessary for this backbone:** batch 32 (memory at 384), AdamW lr 2e-4 (a fine-tuning rate for ConvNeXt), weight decay 0.05.
- **Export:** ONNX (~110 MB), served as parts under 25 MiB (`ml/tools/split_model.py`, already verified in the browser).

## Before Sylhet
The candidates at the half-A check grow to:
- v9b;
- v9c;
- avg / class-wise blends of v8_b0 with v9b (amendment 2);
- avg(v8_b0, v9b, v9c).

The qualifying rule of amendment 2 is unchanged: on DIU half A, reach v8_b0's answer rate **and** be more often right. The best qualifying candidate gets the single Sylhet read.
