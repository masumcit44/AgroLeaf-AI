import * as ort from 'onnxruntime-web/wasm';
import {
  MODEL_PARTS,
  CLASS_INDEX_URL,
  PREPROCESS_URL,
  CALIBRATION_URL,
} from './config.js';

// Configure ONNX Runtime to load CPU WebAssembly builds from /ort/
ort.env.wasm.wasmPaths = '/ort/';
ort.env.wasm.numThreads = 1;

let sessionPromise = null;

/**
 * Fetch a binary file with progress callback using ReadableStream.
 *
 * @param {string} url
 * @param {(progressPercent: number) => void} [onProgress]
 * @param {boolean} [checkHeader] - check the ONNX header byte (first part of a split model only)
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchWithProgress(url, onProgress, checkHeader = true) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MODEL_NOT_FOUND: HTTP ${response.status} fetching ${url}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`MODEL_NOT_FOUND: Expected binary ONNX, received HTML (SPA fallback)`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (onProgress) onProgress(100);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedBytes += value.length;

    if (total > 0 && onProgress) {
      const pct = Math.min(99, Math.round((receivedBytes / total) * 100));
      onProgress(pct);
    }
  }

  // Concatenate chunks into single Uint8Array
  const combined = new Uint8Array(receivedBytes);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(chunk, position);
    position += chunk.length;
  }

  // Guard: Validate ONNX protobuf header byte (ONNX model proto starts with field 1: ir_version -> 0x08)
  if (checkHeader && (combined.length === 0 || combined[0] !== 0x08)) {
    throw new Error(
      `MODEL_NOT_FOUND: Invalid ONNX binary format (first byte 0x${combined[0]?.toString(16) || 'none'} != 0x08)`
    );
  }

  if (onProgress) onProgress(100);
  return combined.buffer;
}

/**
 * Fetch a model served as one or more parts and join them in order.
 *
 * @param {string[]} urls
 * @param {(progressPercent: number) => void} [onProgress]
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchModel(urls, onProgress) {
  if (urls.length === 1) return fetchWithProgress(urls[0], onProgress);
  const parts = [];
  for (let i = 0; i < urls.length; i++) {
    const partProgress = onProgress
      ? (pct) => onProgress(Math.min(99, Math.round(((i + pct / 100) / urls.length) * 100)))
      : undefined;
    parts.push(new Uint8Array(await fetchWithProgress(urls[i], partProgress, i === 0)));
  }
  const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let position = 0;
  for (const p of parts) {
    joined.set(p, position);
    position += p.length;
  }
  if (onProgress) onProgress(100);
  return joined.buffer;
}

/**
 * Load the model and its metadata as a singleton.
 *
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ session: ort.InferenceSession, classIndex: Object, preprocess: Object, calibration: Object }>}
 */
export function loadModel(onProgress) {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      // 1. Fetch JSON configs and model arrayBuffer in parallel
      const [classIndexRes, preprocessRes, calibRes, modelBuffer] = await Promise.all([
        fetch(CLASS_INDEX_URL).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${CLASS_INDEX_URL}`);
          return r.json();
        }),
        fetch(PREPROCESS_URL).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${PREPROCESS_URL}`);
          return r.json();
        }),
        fetch(CALIBRATION_URL).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${CALIBRATION_URL}`);
          return r.json();
        }),
        fetchModel(MODEL_PARTS, onProgress),
      ]);

      // 2. Instantiate ONNX Runtime InferenceSession with CPU wasm
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      // 3. Optional non-rice gate (calibration.json -> nonrice_gate). If it cannot
      //    load, the app keeps working with the main model alone, as before G1.
      let gateSession = null;
      if (calibRes.nonrice_gate?.model) {
        try {
          const gateBuffer = await fetch(calibRes.nonrice_gate.model).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${calibRes.nonrice_gate.model}`);
            return r.arrayBuffer();
          });
          gateSession = await ort.InferenceSession.create(gateBuffer, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
          });
        } catch (gateErr) {
          console.warn('[loadModel] non-rice gate unavailable, using the main model alone:', gateErr.message);
        }
      }

      return {
        session,
        gateSession,
        classIndex: classIndexRes,
        preprocess: preprocessRes,
        calibration: calibRes,
      };
    } catch (err) {
      // Reset singleton promise on error so retry works
      sessionPromise = null;
      throw err;
    }
  })();

  return sessionPromise;
}

/**
 * Check whether the model session is already loaded in memory.
 *
 * @returns {boolean}
 */
export function isModelReady() {
  return sessionPromise !== null;
}

/**
 * Reset the model singleton (used on retry).
 */
export function resetModel() {
  sessionPromise = null;
}
