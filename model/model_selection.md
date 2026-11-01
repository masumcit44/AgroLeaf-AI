# Model selection (a plan, not a result: nothing is trained yet)

## Candidates
| Model (ImageNet-pretrained) | Size | Strengths | Limitations | Role |
|---|---|---|---|---|
| **MobileNetV3-Large** | ~5.5M params, ~20 MB fp32 | Designed for mobile CPUs; fast in the browser (WASM) | Slightly less accurate than EfficientNet on fine texture | **Primary candidate** |
| **EfficientNet-B0** | ~5.3M params, ~20 MB fp32 | Strong accuracy per parameter; common in plant-disease papers | Slower than MobileNetV3 on CPU; SiLU/SE ops are a little heavier in WASM | **Main comparison** |
| MobileNetV3-Small | ~2.5M params | Smallest and fastest | Lower capacity; may confuse Brown Spot and Leaf Smut | Fallback if phones are slow |
| ConvNeXt-Tiny / ResNet-50 | 25–28M params, ~100 MB | High accuracy | Too large for a fast browser load | Upper-bound reference only, if there is time |
| Custom CNN from scratch | small | — | Needs much more data; worse generalisation | **Not recommended** |
| Vision transformers (ViT/DeiT) | large | — | Data-hungry; heavy in the browser | Not for this MVP |

Parameter counts are the standard torchvision/timm figures. Exported file sizes are approximate; measure them after export.

## Decision (locked 1 Nov 2026; see `research/final_decisions.md`)
1. Train **MobileNetV3-Large** first: ImageNet weights, **fp32 ONNX**.
   - TorchVision lists 5.48M params and a 21.1 MB weights file.
   - The exported file **must be < 25 MiB** (Cloudflare per-file limit).
2. **MobileNetV3-Small** is the fallback, with the same recipe. Use it if the ONNX file is too big, the phone is too slow, or it matches Large on macro-F1.
3. EfficientNet-B0 is only an accuracy challenger, if time allows.
4. **No quantisation for the MVP.** ORT docs recommend *static* quantisation for CNNs, and dynamic INT8 (as one report suggested) does not fit CNNs. fp32 already fits the size limit.
5. If you compare models, pick the one with the better **macro-F1 on the external test**. If they are within about 2 points, pick the faster one in the browser.

**Why:**
- The data is a few thousand field images, so transfer learning from ImageNet is the standard, data-efficient choice.
- Both models fit in a browser download.
- Earlier team research also proposed MobileNetV3 for on-device use (`dataset research` report §9).

## Uncertainty and "not sure" handling
- **Temperature scaling** on the validation set gives calibrated probabilities.
- **Rule:** if the top probability is below threshold *t*, show "not sure".
  - Choose *t* on validation so that answered predictions reach the target precision (for example, ≥ 90%).
  - Report coverage: the share of images that get an answer.
- **Check *t* on the "unseen diseases" set** (BLB, Narrow Brown Spot): most of these should land below *t*.
- **Optional:** a simple OOD score (energy score) if time allows.
