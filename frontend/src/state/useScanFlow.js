import { useState, useCallback } from 'react';
import { validateImageFile } from '../lib/validateImageFile.js';
import { decodeImage } from '../lib/decodeImage.js';
import { checkImageQuality } from '../lib/imageQuality.js';

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

  const selectFile = useCallback(async (file) => {
    if (!file) return;

    setErrorKey(null);
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

  const reset = useCallback(() => {
    setCanvas(null);
    setQuality(null);
    setErrorKey(null);
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
    selectFile,
    reset,
  };
}
