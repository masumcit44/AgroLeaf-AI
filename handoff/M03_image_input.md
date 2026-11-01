# M03 — Image input, validation, preview and quality hints

**Goal:** the farmer can take a photo or pick one from the gallery, see a preview, and get a friendly hint if it is too dark or blurry. The image stays in memory and is never uploaded.
**Branch:** `feat/m03-image-input` · **Tag:** `m03` · **User gate:** none.

## Files
| File | Contents |
|---|---|
| `src/components/PhotoPicker.jsx` | Two large buttons: "📷 ক্যামেরা" (`<input type="file" accept="image/*" capture="environment">`) and "🖼️ গ্যালারি" (same input without `capture`). Hidden inputs, visible buttons ≥ 56 px tall |
| `src/lib/validateImageFile.js` | **Pure function.** Allowed types: `image/jpeg`, `image/png`, `image/webp` (also allow an empty type if the extension is .jpg/.jpeg/.png/.webp; some Android galleries send an empty type). Max 10 MB. Returns `{ok, errorKey}` |
| `src/lib/decodeImage.js` | `createImageBitmap(file, {imageOrientation:'from-image'})` (handles EXIF rotation). Fallback: `<img>` + objectURL. Downscale to max 1024 px on the long side into an `OffscreenCanvas` or `<canvas>`. Returns `{canvas, width, height}`. Revoke object URLs |
| `src/lib/imageQuality.js` | **Pure functions on luminance arrays:** `meanLuminance(gray)`, `laplacianVariance(gray, w, h)`, plus a helper that builds a 256-px grayscale array from the canvas. Constants `DARK_MAX=45`, `BRIGHT_MIN=235`, `BLUR_MIN=60`, marked `// TODO(M08): tune on real sample photos` |
| `src/components/PreviewScreen.jsx` | Shows the image (`object-contain`, max-height 55vh). Quality hint banner (amber, icon + text) if dark, overexposed or blurry. **Hints never block:** buttons are "🔍 পরীক্ষা করুন" (Check; disabled until M04 with the note "মডেল যোগ হচ্ছে" — "model being added") and "↺ আবার ছবি দিন" (Retake) |
| `src/state/useScanFlow.js` | Simple state machine: `idle → preview → (later) analysing → result`. Holds the canvas reference only, never the file bytes in global storage |
| `src/lib/__tests__/validateImageFile.test.js`, `imageQuality.test.js` | **Vitest** (`npm i -D vitest`; script `"test": "vitest run"`). Test: type and size rules; a uniform grey array → laplacianVariance ≈ 0; a checkerboard → high variance; dark array flagged |

**Update `HomePage.jsx`:** enable the main button to open PhotoPicker. Add three small pictogram tips: "একটি পাতা" (one leaf), "দিনের আলো" (daylight), "কাছ থেকে" (close up).

**Bangla error strings in i18n:**
- unsupported type: "শুধু ছবি (JPG/PNG/WebP) দিন" ("only images: JPG/PNG/WebP")
- too large: "ছবি ১০ এমবির বেশি" ("image is over 10 MB")
- decode failed: "ছবিটি খোলা যাচ্ছে না, আরেকটি দিন" ("this image can't be opened; try another")

## Acceptance checks
- [ ] On an Android phone (or DevTools mobile emulation), the camera button opens the camera and the gallery button opens the gallery.
- [ ] A rotated phone photo shows upright.
- [ ] A PDF or an 11 MB file shows the right Bangla error. Nothing crashes.
- [ ] A very dark photo shows the dark hint. A sharp photo shows no hint.
- [ ] `npm test`, `npm run lint`, and `npm run build` pass.
- [ ] Network tab: **no request** is made when a photo is chosen.
- [ ] Commits (examples):
  - `feat(input): add camera/gallery picker with file validation`
  - `feat(input): decode with EXIF orientation and downscale in memory`
  - `feat(quality): add brightness and Laplacian blur hints`
  - `test(input): cover validation and quality metrics`
