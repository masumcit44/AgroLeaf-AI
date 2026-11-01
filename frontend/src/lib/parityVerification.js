import * as ort from 'onnxruntime-web/wasm';
import { softmax } from '../ml/decide.js';
import { predictLeaf } from '../ml/predict.js';

export function decodeTensorData(sample) {
  if (Array.isArray(sample.preprocessed_tensor)) {
    return new Float32Array(sample.preprocessed_tensor);
  }
  if (typeof sample.preprocessed_tensor_b64 === 'string') {
    const binStr = atob(sample.preprocessed_tensor_b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new Float32Array(bytes.buffer);
  }
  return null;
}

export async function runParityCheckA(sample, modelBundle) {
  const { session, calibration } = modelBundle;
  const tensorData = decodeTensorData(sample);
  if (!tensorData) {
    return {
      pass: false,
      maxDiff: Infinity,
      error: 'Missing preprocessed tensor data in sample',
    };
  }

  const inputName = session.inputNames[0] || 'input';
  const outputName = session.outputNames[0] || 'logits';
  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);

  const results = await session.run({ [inputName]: inputTensor });
  const logits = Array.from(results[outputName].data);

  const temp = calibration.temperature || 1.0;
  const actualProbs = softmax(logits, temp);
  const expectedProbs = sample.expected_probabilities || [];

  let maxDiff = 0;
  for (let i = 0; i < expectedProbs.length; i++) {
    const diff = Math.abs((actualProbs[i] || 0) - (expectedProbs[i] || 0));
    if (diff > maxDiff) maxDiff = diff;
  }

  const pass = maxDiff < 1e-3;
  return {
    pass,
    maxDiff,
    actualProbs,
    expectedProbs,
  };
}

export async function runParityCheckB(sample, sampleBaseUrl = '/samples') {
  const imgSrc = `${sampleBaseUrl}/${sample.filename}`;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Failed to load ${imgSrc}`));
      img.src = imgSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width || 224;
    canvas.height = img.height || 224;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const result = await predictLeaf(canvas);
    const top1Actual = result.decision.top?.key;
    const top1Expected = sample.predicted_class;
    const pass = top1Actual === top1Expected;

    return {
      pass,
      top1Actual,
      top1Expected,
      available: true,
    };
  } catch (err) {
    return {
      pass: false,
      top1Actual: null,
      top1Expected: sample.predicted_class,
      available: false,
      error: err.message,
    };
  }
}
