# Smoke Test Report (X1 Automated Check)

**Date / Time:** 01 Nov 2026, 09:38:14 BST
**Target URL:** http://localhost:60479 (Vite production preview)
**Overall Status:** ✅ ALL CHECKS PASSED

## Asset Verification
| Asset | Check | Status | Details |
|---|---|---|---|
| `/ort/ort-wasm-simd-threaded.wasm` | Content-Type & WASM magic header | ✅ PASS | HTTP 200, content-type: "application/wasm", magic header: \0asm (valid) |

## UI & Responsiveness Checks
| Viewport | Route | Sticker (≥40px in header) | Horizontal Overflow | Console Errors | Forbidden Copy | Status |
|---|---|---|---|---|---|---|
| 360px | Home | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Accuracy | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | About | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Healthy | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Blast | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Brown Spot | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Leaf Smut | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Tungro | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Sheath Blight | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 360px | Result: Not Sure | ✅ 45px | ✅ 0px (360px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Home | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Accuracy | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | About | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Healthy | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Blast | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Brown Spot | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Leaf Smut | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Tungro | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Sheath Blight | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 390px | Result: Not Sure | ✅ 45px | ✅ 0px (390px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Home | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Accuracy | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | About | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Healthy | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Blast | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Brown Spot | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Leaf Smut | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Tungro | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Sheath Blight | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |
| 1280px | Result: Not Sure | ✅ 54px | ✅ 0px (1280px) | ✅ 0 | ✅ Clean | ✅ PASS |

## Criteria Summary
1. **Sticker:** `img[src*="aignite-sticker"]` exists, is visible inside `<header>`, height ≥ 40 px, and within viewport.
2. **No horizontal overflow:** `scrollWidth <= innerWidth` on 360px, 390px, and 1280px.
3. **No console errors:** 0 runtime exceptions or console.error calls.
4. **No forbidden text:** Zero occurrences of "diagnosis", "রোগ নির্ণয়", "100%", or "free call".
5. **Asset check:** CPU WASM served with correct binary headers.

*Exit Code: 0*
