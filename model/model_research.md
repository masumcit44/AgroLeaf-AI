# Model research extracted from the team files

**Sources:** `ai_battle/dataset research/AgroLeaf_AI_Bangladesh_Crop_Disease_Deep_Research_Report.pdf` §7, §9; `AgroLeaf_Core_AI_BN/Research/Core_AI_Research_Report.md`.

## What the team files propose
- Candidates: **MobileNetV2** (baseline), **MobileNetV3-Small** (primary), **EfficientNet-Lite0** (alternative). Train all on identical splits.
- Never report accuracy alone. Use per-class P/R/F1, macro-F1, a confusion matrix, size and latency, and an **independent field test**.
- Post-training quantisation (float16/INT8), then TFLite for Android.
- Start with one model per crop, then compare against a unified model.

### Multi-crop evidence
The Core AI report cites **Picon et al. 2019**. Over 100k field photos, 5 crops and 17 diseases, balanced accuracy was:
- crop-specific models: 0.92
- one multi-crop model: 0.93
- crop-conditional network: 0.98

The team files give no DOI, only the repository link https://dsp.tecnalia.com/handle/11556/904 (not opened by me). Find the DOI before citing it.

### Foundational reference
Mohanty, Hughes & Salathé 2016, "Using Deep Learning for Image-Based Plant Disease Detection", *Frontiers in Plant Science*, DOI 10.3389/fpls.2016.01419. It is widely cited for the gap between PlantVillage lab-image accuracy and real-field accuracy.

## What changed for AIgnite
- **Target: browser (ONNX/WASM), not Android TFLite.** MobileNetV3-Large and EfficientNet-B0 are affordable on the web, so they replace the -Small and -Lite variants as primary candidates (see `model_selection.md`).
- **No measured results exist yet.** The INT8 latency figures in `Evidence_Bank.csv` (EV-21) are unverified. Do not quote them.
