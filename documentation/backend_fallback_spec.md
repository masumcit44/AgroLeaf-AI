# Backend

**The MVP needs no backend.** The model runs in the browser (see `documentation/system_architecture.md`).

## Fallback (build only if in-browser inference fails on phones)
- FastAPI + onnxruntime (CPU), one endpoint:
```
POST /predict   multipart: image (jpeg/png/webp, ≤10 MB)
→ 200 {"model_version":"v1","probs":{"blast":0.81,...},"top":"blast","confident":true,"threshold":0.7}
→ 415 unsupported type | 413 too large | 422 unreadable image
```
- Validate the MIME type and decode with Pillow. Re-encode; never store the file. Limit request size. Set CORS to the frontend domain only.
- **Host:** Hugging Face Spaces (Docker or Gradio SDK) or Render, free CPU.
- **Cold starts:** free instances sleep. Before the demo, warm up with a timed ping and show a "starting up…" message in the UI.
- **Same artefacts as the frontend:** `model.onnx`, `class_index.json`, `preprocess.json`, `calibration.json`.
