# M04 — In-browser inference engine (with a placeholder model)

**Goal:** the full prediction pipeline works end to end in the browser, using a **placeholder** ONNX model with the exact same interface as the real one. M07 then only swaps files.
**Branch:** `feat/m04-inference-engine` · **Tag:** `m04` · **User gate:** none.

**Critical rule:** `import * as ort from 'onnxruntime-web/wasm'`. Never the bare `onnxruntime-web` import. See `research/final_decisions.md` §3: the default loads a 29.5 MB jsep wasm, which is over Cloudflare's 25 MiB limit.

## Part A — placeholder model (Python, CPU)
- `ml/tools/make_placeholder_model.py`:
  - torchvision `mobilenet_v3_small(weights=None)`, last layer → 6 outputs, random init, seed 42
  - export with the **same function and contract as `ml/export_onnx.py`** (input `input` [1,3,224,224], output `logits` [1,6], opset 17)
  - write to `frontend/public/models/rice-placeholder.onnx`
  - write `frontend/public/data/class_index.json`, `preprocess.json` (same as M01), and `calibration.json` = `{"temperature":1.0,"threshold":0.6,"placeholder":true}`
- Small variant = smaller file in Git. The real model replaces it in M07.

## Part B — frontend
1. `npm i onnxruntime-web@1.31.1 --save-exact`. **Pin it:** the wasm file-size check in final_decisions was done on this version.
2. `frontend/scripts/copy-ort.mjs`: copies `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm` and `ort-wasm-simd-threaded.mjs` to `public/ort/`. Fail with a clear message if missing. Add `"predev"` and `"prebuild"` scripts that run it (`public/ort/` is git-ignored).
3. `vite.config.js`: add `optimizeDeps: { exclude: ['onnxruntime-web'] }` if Vite dev shows wasm or worker loading errors. Note in the commit why.
4. `src/ml/config.js`: `MODEL_URL='/models/rice-placeholder.onnx'`, `CLASS_INDEX_URL`, `PREPROCESS_URL`, `CALIBRATION_URL`. This is the one place to change in M07.
5. `src/ml/loadModel.js`:
   - **singleton promise** (create the InferenceSession only once)
   - `ort.env.wasm.wasmPaths='/ort/'`, `ort.env.wasm.numThreads=1`
   - fetch the model as an ArrayBuffer **with progress** (`Content-Length`) for a % bar
   - **guard:** if the response `content-type` includes `text/html`, or the first byte isn't `0x08` (ONNX protobuf), throw `MODEL_NOT_FOUND`. This catches Cloudflare serving index.html instead of the model.
   - `executionProviders:['wasm']`
   - load the 3 JSON configs in parallel
6. `src/ml/preprocess.js`: **pure function** `toInputTensorData(imageData, cfg)`:
   - resize shorter side to `cfg.resize_shorter` (canvas `drawImage`, `imageSmoothingQuality='high'`)
   - center-crop `cfg.crop`
   - RGB, /255, (x−mean)/std, NCHW Float32Array of length 3·224·224
   - split into `resizeAndCrop(canvas,cfg)` (DOM) and `normalizeToNCHW(rgbaUint8, w, h, cfg)` (pure, testable)
7. `src/ml/predict.js`: `predictLeaf(canvas)` → runs the session → logits → `softmax(logits / T)` → returns `{probs: {key:prob}, ms}`, timed with `performance.now()`.
8. `src/ml/decide.js`: **pure** `decide(probs, threshold)` → `{status:'confident'|'not_sure', top:{key,prob}, top2:[{key,prob},{key,prob}]}`. A tie or NaN → `not_sure`.
9. **UI wiring:**
   - "পরীক্ষা করুন" (Check) → `analysing` state: spinner + "পাতার ছবি পরীক্ষা করা হচ্ছে…" ("checking the leaf photo…"); on first use, model download progress "এআই মডেল প্রস্তুত হচ্ছে… 42%" ("AI model getting ready…")
   - then a **temporary** debug result list (key + %), replaced by real cards in M05
   - If `calibration.placeholder===true`, show a fixed amber banner on every result: "ডেমো মডেল — এখনো প্রশিক্ষিত নয়" / "Demo model — not trained yet"
10. Start loading the model **after first paint**, idle (`requestIdleCallback` or a 1500 ms timeout), so the home screen is instant.
11. **Errors:**
    - model fetch failed → Bangla message + "আবার চেষ্টা করুন" (Try again), which resets the singleton
    - WASM unsupported → message to use updated Chrome

## Tests (Vitest)
- `normalizeToNCHW`: 2×2 known pixels → exact expected floats, channel-first order.
- `softmax` with a temperature: sums to 1; T>1 flattens.
- `decide`: above threshold → confident; below → not_sure; top2 order correct; NaN → not_sure.

## Acceptance checks
- [ ] Choose any photo → analysing → probability list appears. The second prediction is faster (session reused).
- [ ] The Network tab shows `ort-wasm-simd-threaded.wasm` (~14.8 MB) loaded from `/ort/`, and **no** `.jsep.wasm`.
- [ ] `npm run build` → **every file in `dist/` is < 25 MiB.** Add `frontend/scripts/check-dist-sizes.mjs` run in `postbuild`; it fails the build if any file is ≥ 25 MiB.
- [ ] Rename the model URL to a wrong path in dev → the friendly error appears (not a crash). Then revert.
- [ ] Tests, lint, and build pass. The placeholder banner is visible.
- [ ] Commits (examples):
  - `feat(ml): add placeholder ONNX with production I/O contract`
  - `feat(inference): load onnxruntime-web/wasm session once with progress`
  - `feat(inference): add preprocessing identical to training config`
  - `feat(inference): add temperature softmax and abstention decision`
  - `ci(build): fail build when any asset exceeds Cloudflare 25 MiB`
  - `test(inference): cover normalisation, softmax and decision rule`
