import { useState, useCallback } from 'react';
import { validateImageFile } from '../lib/validateImageFile.js';
import { decodeImage } from '../lib/decodeImage.js';
import { checkImageQuality } from '../lib/imageQuality.js';
import { predictLeaf } from '../ml/predict.js';
import { resetModel, isModelReady } from '../ml/loadModel.js';
import { cropCanvas } from '../features/user_guided_crop/cropMath.js';

// Frees a canvas's pixel buffer (user-guided crop: old crops are not kept in memory)
function releaseCanvas(c) {
  if (c && typeof c.getContext === 'function') c.width = 0;
}

export const SCAN_STEPS = {
  IDLE: 'idle',
  PREVIEW: 'preview',
  ANALYSING: 'analysing',
  RESULT: 'result',
  CROP: 'crop', // user-guided crop (feature flag user_guided_crop)
};

export function useScanFlow() {
  const [step, setStep] = useState(SCAN_STEPS.IDLE);
  const [canvas, setCanvas] = useState(null); // the decoded photo; never modified
  // User-guided crop: the region actually analysed, and the box it came from (for re-cropping)
  const [analysisCanvas, setAnalysisCanvas] = useState(null);
  const [cropBox, setCropBox] = useState(null);
  const [cropFallback, setCropFallback] = useState(false);
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
      setAnalysisCanvas(null);
      setCropBox(null);
      setCropFallback(false);

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

  // `target` (optional) is a canvas to analyse instead of the full photo. Buttons call this with
  // a click event, so anything that is not a canvas means "the full photo".
  const runInference = useCallback(async (target) => {
    const input = target && typeof target.getContext === 'function' ? target : canvas;
    if (!input) return;
    if (input === canvas) {
      setAnalysisCanvas(null);
    }

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

      const result = await predictLeaf(input, (pct) => {
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

  // --- User-guided crop -------------------------------------------------------------
  const startCrop = useCallback(() => {
    if (canvas) setStep(SCAN_STEPS.CROP);
  }, [canvas]);

  const cancelCrop = useCallback(() => {
    setStep(analysisResult ? SCAN_STEPS.RESULT : SCAN_STEPS.PREVIEW);
  }, [analysisResult]);

  // Cuts the box out of the photo and analyses it; if cutting fails, analyses the full photo
  // so the diagnosis flow never breaks.
  const confirmCrop = useCallback((box) => {
    let cropped = null;
    try {
      cropped = cropCanvas(canvas, box);
    } catch (err) {
      console.error('Crop failed, analysing the full image:', err);
    }
    if (analysisCanvas !== cropped) releaseCanvas(analysisCanvas);
    setCropBox(box);
    setCropFallback(!cropped);
    setAnalysisCanvas(cropped);
    runInference(cropped || canvas);
  }, [canvas, analysisCanvas, runInference]);

  const reset = useCallback(() => {
    releaseCanvas(analysisCanvas);
    setAnalysisCanvas(null);
    setCropBox(null);
    setCropFallback(false);
    setCanvas(null);
    setQuality(null);
    setErrorKey(null);
    setInferenceError(null);
    setModelProgress(null);
    setAnalysisResult(null);
    setIsProcessing(false);
    setStep(SCAN_STEPS.IDLE);
  }, [analysisCanvas]);

  return {
    step,
    setStep,
    canvas,
    analysisCanvas,
    cropBox,
    cropFallback,
    quality,
    errorKey,
    isProcessing,
    modelProgress,
    analysisResult,
    inferenceError,
    selectFile,
    runInference,
    startCrop,
    cancelCrop,
    confirmCrop,
    reset,
  };
}
