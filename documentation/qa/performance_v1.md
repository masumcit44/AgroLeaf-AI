# Performance Budget & Loading Evidence (V1)

**Date / Time:** 2026-11-01 03:55:10 UTC
**Environment:** Production Vite Preview (Brotli/Gzip)
**Network Profile:** Simulated Slow 4G (150ms RTT, 1.6 Mbps download, 750 Kbps upload)
**CPU Profile:** 4× Mobile CPU Throttling (Emulated low-tier agricultural smartphone)
**Viewport:** 390×844 px (iPhone Modern)

## 1. Bundle & Asset Sizes

| File / Asset | Raw Size | Gzip Size | Cloudflare Ceiling (25 MiB) |
|---|:---:|:---:|:---:|
| `AboutPage-B1a8Wovc.js` | 3.7 kB | 1.2 kB | ✓ Under limit |
| `AccuracyPage-Cf1rpV2d.js` | 14.7 kB | 3.9 kB | ✓ Under limit |
| `DevParityPage-fRHaCJ-1.js` | 7.2 kB | 2.8 kB | ✓ Under limit |
| `index-CVMzZf9m.js` | 352.8 kB | 109.5 kB | ✓ Under limit |
| `index-HF_3jG2L.css` | 39.2 kB | 7.5 kB | ✓ Under limit |
| **Production Model (`rice-mnv3l-v1.onnx`)** | **16.05 MB** | *(Static binary)* | ✓ Under 25 MiB |
| **CPU WASM Engine (`ort-wasm-simd-threaded.wasm`)** | **14.16 MB** | ~3.88 MB | ✓ Under 25 MiB |

**Key JS Takeaways:**
- **Main Entry Bundle (Home):** Only ~109.5 kB gzip (ultra-lean initial load).
- **Lazy Loaded Route Chunks:** `AccuracyPage` (~3.9 kB gzip), `AboutPage` (~1.2 kB gzip), and `DevParityPage` (~2.8 kB gzip) are loaded on demand.

## 2. Throttled Loading Metrics (Slow 4G + 4× CPU)

| Page / Route | First Load (Excl. Model/WASM) | FCP | DOM Interactive | TTI / Network Idle |
|---|:---:|:---:|:---:|:---:|
| **Home** | 39.3 kB | 1820 ms | 226 ms | 1088 ms |
| **Accuracy** | 146.2 kB | 920 ms | 213 ms | 497 ms |
| **About** | 25.0 kB | 944 ms | 216 ms | 537 ms |

## 3. Optimizations Applied
- **Code-Splitting via `React.lazy()` & `Suspense`:** Route-level separation keeps the initial JavaScript payload under ~115 kB gzip.
- **High-Priority Header Sticker:** Added `fetchpriority="high"` with explicit dimensions (124×44) on the AIgnite competition sticker to eliminate layout shift.
- **Preconnected Google Fonts:** Preconnect hints for `fonts.googleapis.com` and `fonts.gstatic.com` eliminate roundtrips for Bengali font delivery.
- **Deferred Model Loading:** The 16.05 MB ONNX model and 14.16 MB WASM runtime are never loaded synchronously on boot; they are prefetched during browser idle or upon the first image upload.
- **Zero Network Telemetry:** Complete offline inference guarantees zero user bandwidth consumption after initial caching.
