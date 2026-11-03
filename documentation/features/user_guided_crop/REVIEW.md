# User-guided crop ("Focus on the diseased leaf") — review notes

Flag `user_guided_crop` (default **OFF**). Branch `feat/user-guided-crop`. Not merged, not deployed.

## 1. Architecture
```
Preview ─┬─ "Check" (unchanged: full photo)
         └─ "Focus on the diseased leaf"  (flag on only)
               → CropScreen (move / resize / zoom; touch, mouse, keyboard)
               → cropCanvas(photo, box): drawImage of the box, same pixels, no scaling
               → runInference(cropped)  → predictLeaf (unchanged v10: Resize 366 + CenterCrop 320)
Result ── "Select a different area" → CropScreen with the last box → crop or full image
```
- The decoded photo (`scanFlow.canvas`) is never modified.
- The crop is a separate canvas (`analysisCanvas`). Older crops' pixel buffers are released (`width = 0`).
- No server, network, API, database or analytics. `crop_used` is not logged, because the app has no analytics framework (by design).

## 2. Files changed
| File | Change |
|---|---|
| `features/user_guided_crop/cropMath.js` (new) | clamp, min 128 px, default box, drag/resize, keyboard steps, `cropCanvas` |
| `features/user_guided_crop/CropScreen.jsx` (new) | the crop UI |
| `features/user_guided_crop/i18n.js` (new) | Bangla + English texts |
| `features/user_guided_crop/__tests__/*` (new) | 15 tests |
| `features/flags.js` | `user_guided_crop: false` |
| `state/useScanFlow.js` | CROP step; `analysisCanvas`, `cropBox`, `cropFallback`; `startCrop` / `cancelCrop` / `confirmCrop`; `runInference(target?)` |
| `pages/HomePage.jsx` | shows CropScreen; passes the crop props only when the flag is on |
| `components/PreviewScreen.jsx` | optional `onFocusCrop` button (absent = unchanged) |
| `components/ResultScreen.jsx` | optional re-crop button and "only the selected area was analysed" / fallback note |
| `features/__tests__/foundation.test.jsx` | loads feature texts with the same glob as the app |

## 3. Accessibility
- The box is a focusable group (`tabIndex=0`) with an `aria-label` that includes its size.
- Keyboard: arrows move, Shift + arrows resize, Enter analyses. Instructions are visible and also in `#ugc-help` for screen readers.
- The size readout and the "too small" alert are live regions (`aria-live`, `role="alert"`).
- Every action is a real button with a label (zoom −/+, reset, analyse area, analyse full image, back).
- **High contrast:** the box has a white border plus a black outline, so it is visible on light and dark photos. Handles are white circles with black rims. Colour is never the only signal (text states the size and errors).
- Not yet checked with TalkBack on a real phone (owner test).

## 4. Mobile performance (measured, `ml/tools/e2e_crop_live.mjs`, 390×844, touch, CPU 4× slower)
- **Crop operation:** median **4.6 ms**, max 44.6 ms (target < 500 ms).
- **Tap "analyse this area" → analysing screen:** about 1.25 s. This is the model's own preprocessing starting before the screen repaints; the full-image path has the same step. It is not caused by the crop. Possible follow-up: yield one frame before preprocessing so the spinner appears at once.
- Memory: one extra canvas, at most the photo size (≤ 1024 px). Released on re-crop and reset.

## 5. Failure modes
| Case | Behaviour |
|---|---|
| Box smaller than 128 × 128 | Cannot be dragged smaller. If the whole photo is smaller, the "too small" alert shows and Analyse is disabled. "Analyse the full image" stays available |
| Box dragged outside the photo | Clamped inside, on every move |
| Cropping throws or returns nothing | Full image analysed; result says "the area could not be cut out, so the full image was analysed" |
| Model / WASM error during a crop analysis | Same as today: back to preview with the error and a retry that re-analyses the same crop |
| Offline | Works: crop and inference are on the phone (tested with the browser offline after the first load) |
| Flag off | Preview, result and scan flow render exactly as before (tests). Live upload test: identical to production for all 20 photos |

## 6. Screenshots
`crop_screen_bn.png` (crop screen, 390 px) and `crop_result_bn.png` (result after a crop).

## 7. Tests
- **Unit (15):** clamping; minimum size; corner and move drags; keyboard steps; pixel-exact crop; null-safe crop; flag OFF by default; no new buttons when off; buttons and notes when on; crop screen texts in BN/EN.
- **Live e2e (`e2e_crop_live.mjs`, 12 checks, all pass):**
  - focus button shown;
  - crop screen opens offline;
  - 44 px handles;
  - drag and resize change the box;
  - keyboard resize;
  - crop < 500 ms;
  - offline result with the crop note;
  - re-crop keeps the box;
  - "analyse full image";
  - no page errors.
- **Flag off:** `e2e_upload_live.mjs` output identical to production.

## 8. Rollback
The feature is behind `user_guided_crop: false`; with the flag off nothing changes. To remove it entirely, revert the merge commit of this branch; there are no data, schema or model changes to undo.

## 9. Not claimed
This change does **not** claim that cropping improves accuracy. That needs a measured comparison (e.g. simulated boxes from RiceLeafDiseaseBD lesion annotations vs the full image) before the flag is turned on for farmers.
