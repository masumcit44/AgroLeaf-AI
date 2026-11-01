# Frontend (to be built)

## Screens
1. **Home**
   - Sticker (navbar, top)
   - App name
   - One line in Bangla: "ধানের পাতার ছবি দিন, রোগ জানুন" ("Upload a rice leaf photo, find the disease")
   - Big button: 📷 ছবি তুলুন / আপলোড করুন ("Take / upload photo")
   - Sample images
   - BN/EN toggle
2. **Preview**
   - Image shown
   - Quality warning (blur/dark)
   - Buttons: "পরীক্ষা করুন" ("Check") and "আবার তুলুন" ("Retake")
3. **Result**
   - Disease name in BN and EN
   - Confidence as words ("বেশ নিশ্চিত" / "fairly sure"), not just a percentage
   - Meaning and 3–5 steps
   - ▶/⏸ Bangla audio
   - "সরকারি পরামর্শ দেখুন" ("See official advice") with the BAMIS quote and link
   - Buttons: 📞 16123 and Share
4. **Not sure**
   - Clear message
   - Top-2 "possible" diseases
   - Retake tips
   - 📞 16123
   - Audio
5. **How accurate is it?**
   - Measured metrics
   - Dataset credits (CC BY)
   - Limitations
   - Privacy line

## Technical (locked 1 Nov 2026)
- **React + Vite + Tailwind** (fallback: plain HTML/JS).
- **`import * as ort from 'onnxruntime-web/wasm'`**. Do **not** use the default import: it loads `ort-wasm-simd-threaded.jsep.wasm` (29.5 MB), which is over Cloudflare's 25 MiB per-file limit. The `/wasm` import loads the 14.8 MB file.
- Copy `node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{wasm,mjs}` to `public/ort/`.
- Set `ort.env.wasm.wasmPaths = '/ort/'` and `ort.env.wasm.numThreads = 1`.
- Create **one** InferenceSession with `executionProviders: ['wasm']`, after the first paint, and reuse it.
- Add the `public/_headers` file from `documentation/system_architecture.md`.
- Show confidence as words ("বেশ নিশ্চিত" / "fairly sure"), with numbers on the Accuracy page only.
- Fonts: Noto Sans Bengali / Hind Siliguri (Google Fonts).
- `<input type="file" accept="image/*" capture="environment">`
- Resize on a canvas to 256, then center-crop 224. Must match `preprocess.json` exactly.
- Every async step has a loading state; every failure has a Bangla message and a retry.
- Audio: `<audio src="audio/<class>.mp3">` with one large play/pause button.
