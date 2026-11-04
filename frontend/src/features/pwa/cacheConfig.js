// Shared by vite.config.js (Workbox runtime cache) and PwaStatus (cache warming).
// Keep the cache name and URL rules in one place so the page and the service
// worker always read and write the same Cache Storage bucket.

export const MODEL_CACHE_NAME = 'agroleaf-model-cache-v2';

// Legacy cache names that must be evicted on startup to force fresh ONNX model
// delivery. The v10 CAM-enhanced model (cam_maps output) is incompatible with
// the older single-output model cached under these names.
export const LEGACY_MODEL_CACHE_NAMES = ['agroleaf-model-cache-v1'];

// Same-origin model and ONNX Runtime assets are large (about 30 MB) and are
// fetched on the first analysis, so they are runtime cached instead of precached.
export const MODEL_URL_PATTERN = /\/(?:models|ort)\//;

// Chrome routes a fetch() whose URL path ends in .mp3 through its media cache,
// which hands the page a synthetic 204 instead of the bytes. Workbox precache
// therefore cannot fetch the voice clips. Cache them at runtime instead: the
// page warms this cache with a Range request and the service worker serves it.
export const AUDIO_CACHE_NAME = 'agroleaf-audio-cache-v1';
export const AUDIO_URL_PATTERN = /\/audio\/[^/?]+\.mp3$/;

// ONNX Runtime loads these two files from /ort/ (see src/ml/loadModel.js).
export const ORT_ASSETS = [
  '/ort/ort-wasm-simd-threaded.mjs',
  '/ort/ort-wasm-simd-threaded.wasm',
];
