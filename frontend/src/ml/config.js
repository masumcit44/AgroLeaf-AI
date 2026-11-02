/**
 * Central configuration for ML model and metadata URLs.
 * In M07, only MODEL_URL changes to point to the trained model.
 */
export const MODEL_URL = '/models/rice-effb0-v8-320.onnx';
// Files the model is served as, joined in order. A model over Cloudflare's 25 MiB
// per-file limit is split into parts (ml/tools/split_model.py).
export const MODEL_PARTS = [MODEL_URL];
export const CLASS_INDEX_URL = '/data/class_index.json';
export const PREPROCESS_URL = '/data/preprocess.json';
export const CALIBRATION_URL = '/data/calibration.json';
