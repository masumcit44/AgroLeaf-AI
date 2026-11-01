# Experiment log template

Copy this file to `YYYY-MM-DD_<model>.md` for each run.

- **Date / commit / notebook link:**
- **Data:** splits.csv hash; dataset version; classes
- **Model / pretrained weights:**
- **Hyper-parameters:** epochs, lr, batch, augmentation, class weights, seed
- **Results:**
  - val macro-F1
  - internal test macro-F1
  - **external macro-F1**
  - per-class table
  - confusion matrix image
- **Calibration:** T = ; threshold t = ; coverage = ; answered accuracy =
- **Unseen-disease rejection rate:**
- **Export:** ONNX size (MB); max logit diff; browser ms on <phone>
- **Decision / notes:**
