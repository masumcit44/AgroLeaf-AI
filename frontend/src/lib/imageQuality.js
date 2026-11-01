// Threshold constants
// TODO(M08): tune on real sample photos
export const DARK_MAX = 45;
export const BRIGHT_MIN = 235;
export const BLUR_MIN = 60;

/**
 * Compute the average luminance of a grayscale array.
 * Pure function.
 *
 * @param {Uint8ClampedArray|number[]} gray
 * @returns {number}
 */
export function meanLuminance(gray) {
  if (!gray || gray.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < gray.length; i++) {
    sum += gray[i];
  }
  return sum / gray.length;
}

/**
 * Compute the variance of the discrete 3x3 Laplacian operator over a grayscale image.
 * Uses kernel:
 *  0  1  0
 *  1 -4  1
 *  0  1  0
 *
 * Low variance (< BLUR_MIN) indicates lack of high-frequency edges (blurry).
 * Pure function.
 *
 * @param {Uint8ClampedArray|number[]} gray
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function laplacianVariance(gray, width, height) {
  if (!gray || width < 3 || height < 3) return 0;

  const count = (width - 2) * (height - 2);
  if (count <= 0) return 0;

  let sum = 0;
  let sumSq = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const prevRowOffset = (y - 1) * width;
    const nextRowOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const center = gray[rowOffset + x];
      const top = gray[prevRowOffset + x];
      const bottom = gray[nextRowOffset + x];
      const left = gray[rowOffset + (x - 1)];
      const right = gray[rowOffset + (x + 1)];

      const lap = top + bottom + left + right - 4 * center;
      sum += lap;
      sumSq += lap * lap;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}

/**
 * Extract a downscaled grayscale array from a source canvas.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {number} targetSize
 * @returns {{ gray: Uint8ClampedArray, width: number, height: number }}
 */
export function buildGrayscaleArray(canvas, targetSize = 256) {
  let sampleCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    sampleCanvas = new OffscreenCanvas(targetSize, targetSize);
  } else {
    sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = targetSize;
    sampleCanvas.height = targetSize;
  }

  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available for quality inspection');
  }

  ctx.drawImage(canvas, 0, 0, targetSize, targetSize);
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const rgba = imgData.data;
  const numPixels = targetSize * targetSize;
  const gray = new Uint8ClampedArray(numPixels);

  // Rec. 601 luma: Y = 0.299 R + 0.587 G + 0.114 B
  for (let i = 0; i < numPixels; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return { gray, width: targetSize, height: targetSize };
}

/**
 * Perform all image quality checks on a canvas.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @returns {{ isDark: boolean, isOverexposed: boolean, isBlurry: boolean, meanLum: number, blurScore: number, hintKey: string|null }}
 */
export function checkImageQuality(canvas) {
  const { gray, width, height } = buildGrayscaleArray(canvas, 256);
  const meanLum = meanLuminance(gray);
  const blurScore = laplacianVariance(gray, width, height);

  const isDark = meanLum < DARK_MAX;
  const isOverexposed = meanLum > BRIGHT_MIN;
  const isBlurry = blurScore < BLUR_MIN;

  let hintKey = null;
  if (isDark) {
    hintKey = 'hintTooDark';
  } else if (isOverexposed) {
    hintKey = 'hintTooBright';
  } else if (isBlurry) {
    hintKey = 'hintBlurry';
  }

  return {
    isDark,
    isOverexposed,
    isBlurry,
    meanLum: Math.round(meanLum * 10) / 10,
    blurScore: Math.round(blurScore * 10) / 10,
    hintKey,
  };
}
