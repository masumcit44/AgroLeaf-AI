import * as ort from 'onnxruntime-web/wasm';
import { loadModel } from './loadModel.js';
import { resizeAndCrop, normalizeToNCHW } from './preprocess.js';
import { softmax, decide } from './decide.js';
import { plantPixelFraction } from './leafCheck.js';
import { gateSaysNotRice } from './nonriceGate.js';

/**
 * Run end-to-end leaf disease inference on an HTMLCanvasElement or OffscreenCanvas.
 *
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas - In-memory preprocessed leaf image canvas
 * @param {(progressPercent: number) => void} [onProgress] - Download progress callback on cold start
 * @returns {Promise<{
 *   probs: Record<string, number>,
 *   ms: number,
 *   calibration: Object,
 *   decision: ReturnType<typeof decide>
 * }>}
 */
export async function predictLeaf(canvas, onProgress) {
  // 1. Ensure model session & configs are loaded (singleton)
  const { session, gateSession, classIndex, preprocess, calibration } = await loadModel(onProgress);

  // 2. Preprocess canvas into NCHW Float32Array [3, crop, crop]; the leaf-colour
  //    gate reads the same crop the model sees
  const cropSize = preprocess.crop || 224;
  const imageData = resizeAndCrop(canvas, preprocess);
  const tensorData = normalizeToNCHW(imageData.data, cropSize, cropSize, preprocess);
  const leafCheck = calibration.leaf_check;
  const leafFraction = leafCheck ? plantPixelFraction(imageData.data, leafCheck) : undefined;

  // 3. Construct input tensor
  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, cropSize, cropSize]);

  // 4. Run inference and time it
  const inputName = session.inputNames[0] || 'input';
  const outputName = session.outputNames[0] || 'logits';
  const feeds = { [inputName]: inputTensor };

  const t0 = performance.now();
  const results = await session.run(feeds);
  const ms = Math.round(performance.now() - t0);

  const outputTensor = results[outputName];
  const logits = Array.from(outputTensor.data);
  const camTensor = results['cam_maps'];

  // 5. Apply temperature scaling + softmax
  const temp = calibration.temperature || 1.0;
  const rawProbs = softmax(logits, temp);

  // 6. Map to class keys
  const classes = classIndex.classes || [];
  const probs = {};
  for (let i = 0; i < classes.length; i++) {
    probs[classes[i]] = rawProbs[i] ?? 0;
  }

  // 7. Make decision: safety gate, weak-class suppression, calibrated threshold
  let decision = decide(probs, calibration.threshold || 0.60, calibration.suppress || [], {
    leafFraction,
    leafMinFraction: leafCheck?.min_fraction,
    healthyThreshold: calibration.healthy_threshold,
  });

  // 8. Non-rice gate (roadmap G1): same input tensor, second model; it can only
  //    turn an answer into "not a rice leaf", never name a disease
  let gateNotRice = false;
  if (gateSession) {
    const gateOut = await gateSession.run({ [gateSession.inputNames[0] || 'input']: inputTensor });
    gateNotRice = gateSaysNotRice(gateOut[gateSession.outputNames[0] || 'logits'].data, calibration.nonrice_gate.not_rice_index);
    if (gateNotRice) decision = { status: 'not_sure', top: null, top2: [], reason: 'not_leaf' };
  }

  return {
    probs,
    leafFraction,
    gateNotRice,
    ms,
    calibration,
    decision,
    camMaps: camTensor ? {
      data: Array.from(camTensor.data),
      dims: camTensor.dims,
    } : null,
  };
}
