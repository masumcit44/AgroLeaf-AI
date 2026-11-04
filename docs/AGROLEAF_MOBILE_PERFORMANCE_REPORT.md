# AgroLeaf AI — Mobile Performance & Bundle Budget Report
**Document ID:** `docs/AGROLEAF_MOBILE_PERFORMANCE_REPORT.md`  
**Focus:** Production Bundle Size, Cloudflare 25 MiB Compliance, CPU & Frame Budgets  
**Author:** Application Performance Lead  
**Date:** 2026-11-04  
**Status:** Validated  

---

## 1. Production Bundle Measurement

Vite production build was executed and verified:

```
dist/manifest.webmanifest                              0.65 kB
dist/index.html                                        2.19 kB │ gzip:     0.92 kB
dist/assets/index-Ca3uA67C.css                        75.64 kB │ gzip:    12.48 kB
dist/assets/rolldown-runtime-COiEfhsA.js               1.11 kB │ gzip:     0.62 kB
dist/assets/AboutPage-Dk9COOiQ.js                      4.00 kB │ gzip:     1.26 kB
dist/assets/DevParityPage-D4gnlhAb.js                  7.37 kB │ gzip:     2.85 kB
dist/assets/AccuracyPage-DJ8SWWpv.js                  16.78 kB │ gzip:     4.26 kB
dist/assets/leaflet-src-DJ4Q_oD4.js                  148.61 kB │ gzip:    43.33 kB
dist/assets/index-D57uKCBP.js                        821.45 kB │ gzip:   231.42 kB
dist/assets/ort-wasm-simd-threaded-qh98TCA_.wasm  14,848.85 kB │ gzip: 3,878.24 kB
```

### 1.1 Cloudflare Pages 25 MiB File Ceiling Check
- `ort-wasm-simd-threaded.wasm`: $14.16$ MiB (PASS, $< 25$ MiB)
- `rice-effb0-v10-320.onnx`: $15.34$ MiB (PASS, $< 25$ MiB)
- `index.js`: $0.82$ MiB (PASS, $< 25$ MiB)
- All distributed assets comply 100% with Cloudflare Pages free tier limits.

---

## 2. Real-Time Resource Budget
- Camera stream: Hardware composited in GPU layer (`<video>` hardware acceleration).
- Background guidance loop: Throttled to $7$ FPS on offscreen downsampled $160 \times 160$ canvas with `willReadFrequently: true`.
- Zero background audio or camera drain when leaving scan modal.

