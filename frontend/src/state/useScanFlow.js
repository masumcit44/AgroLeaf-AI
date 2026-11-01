import { useState, useCallback } from 'react';
import { validateImageFile } from '../lib/validateImageFile.js';
import { decodeImage } from '../lib/decodeImage.js';
import { checkImageQuality } from '../lib/imageQuality.js';
import { predictLeaf } from '../ml/predict.js';
import { resetModel, isModelReady } from '../ml/loadModel.js';

export const SCAN_STEPS = {
  IDLE: 'idle',
  PREVIEW: 'preview',
  ANALYSING: 'analysing',
  RESULT: 'result',
};

export function useScanFlow() {
  const [step, setStep] = useState(SCAN_STEPS.IDLE);
  const [canvas, setCanvas] = useState(null);
  const [quality, setQuality] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // M04 Inference states
  const [modelProgress, setModelProgress] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [inferenceError, setInferenceError] = useState(null);

  const selectFile = useCallback(async (file) => {
    if (!file) return;

    setErrorKey(null);
    setInferenceError(null);
    setIsProcessing(true);

    // 1. Validation
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setErrorKey(validation.errorKey);
      setIsProcessing(false);
      return;
    }

    try {
      // 2. In-memory decode & EXIF orientation (downscales to <= 1024px)
      const decoded = await decodeImage(file);
      setCanvas(decoded.canvas);

      // 3. Quality evaluation
      const qualityReport = checkImageQuality(decoded.canvas);
      setQuality(qualityReport);

      // Transition to preview
      setStep(SCAN_STEPS.PREVIEW);
    } catch (err) {
      console.error('Image processing failure:', err);
      setErrorKey('errDecodeFailed');
      setCanvas(null);
      setQuality(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const runInference = useCallback(async () => {
    if (!canvas) return;

    if (!isModelReady() && typeof navigator !== 'undefined' && navigator.onLine === false) {
      setInferenceError('errOfflineFirstTime');
      return;
    }

    setInferenceError(null);
    setModelProgress(0);
    setStep(SCAN_STEPS.ANALYSING);

    try {
      // Check WASM support guard
      if (typeof WebAssembly === 'undefined' || !WebAssembly.instantiate) {
        throw new Error('WASM_UNSUPPORTED');
      }

      const result = await predictLeaf(canvas, (pct) => {
        setModelProgress(pct);
      });

      setAnalysisResult(result);
      setStep(SCAN_STEPS.RESULT);
    } catch (err) {
      console.error('Inference error:', err);
      resetModel();
      if (err.message === 'WASM_UNSUPPORTED') {
        setInferenceError('errWasmUnsupported');
      } else {
        setInferenceError('errModelLoad');
      }
      setStep(SCAN_STEPS.PREVIEW);
    } finally {
      setModelProgress(null);
    }
  }, [canvas]);

  const reset = useCallback(() => {
    setCanvas(null);
    setQuality(null);
    setErrorKey(null);
    setInferenceError(null);
    setModelProgress(null);
    setAnalysisResult(null);
    setIsProcessing(false);
    setStep(SCAN_STEPS.IDLE);
  }, []);

  return {
    step,
    setStep,
    canvas,
    quality,
    errorKey,
    isProcessing,
    modelProgress,
    analysisResult,
    inferenceError,
    selectFile,
    runInference,
    reset,
  };
}
