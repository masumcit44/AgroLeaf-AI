/**
 * Normalise RGBA pixel array to NCHW Float32Array matching PyTorch ImageNet transforms.
 * Pure function, testable in Vitest without canvas or DOM.
 *
 * @param {Uint8ClampedArray|number[]} rgba - RGBA pixel array of size width * height * 4
 * @param {number} width - image width (e.g. 224)
 * @param {number} height - image height (e.g. 224)
 * @param {{ mean: number[], std: number[] }} cfg - normalization config
 * @returns {Float32Array} - NCHW channel-first tensor of shape [3, height, width]
 */
export function normalizeToNCHW(rgba, width, height, cfg) {
  const numPixels = width * height;
  const tensor = new Float32Array(3 * numPixels);

  const meanR = cfg.mean[0];
  const meanG = cfg.mean[1];
  const meanB = cfg.mean[2];

  const stdR = cfg.std[0];
  const stdG = cfg.std[1];
  const stdB = cfg.std[2];

  const planeR = 0;
  const planeG = numPixels;
  const planeB = 2 * numPixels;

  for (let i = 0; i < numPixels; i++) {
    const r = rgba[i * 4] / 255.0;
    const g = rgba[i * 4 + 1] / 255.0;
    const b = rgba[i * 4 + 2] / 255.0;

    tensor[planeR + i] = (r - meanR) / stdR;
    tensor[planeG + i] = (g - meanG) / stdG;
    tensor[planeB + i] = (b - meanB) / stdB;
  }

  return tensor;
}

/**
 * Resize shorter side to cfg.resize_shorter (256) and center-crop to cfg.crop (224x224).
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} sourceCanvas
 * @param {{ resize_shorter: number, crop: number }} cfg
 * @returns {ImageData} - RGBA 224x224 ImageData
 */
export function resizeAndCrop(sourceCanvas, cfg) {
  const cropSize = cfg.crop || 224;
  const resizeShorter = cfg.resize_shorter || 256;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  // 1. Calculate resized dimensions so shorter side equals resizeShorter
  let resizedW, resizedH;
  if (srcW < srcH) {
    resizedW = resizeShorter;
    resizedH = Math.round(srcH * (resizeShorter / srcW));
  } else {
    resizedH = resizeShorter;
    resizedW = Math.round(srcW * (resizeShorter / srcH));
  }

  // Intermediate canvas for shorter-side resize
  let resizeCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    resizeCanvas = new OffscreenCanvas(resizedW, resizedH);
  } else {
    resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = resizedW;
    resizeCanvas.height = resizedH;
  }

  const resizeCtx = resizeCanvas.getContext('2d');
  if (!resizeCtx) throw new Error('Cannot get 2D context for resizeCanvas');
  resizeCtx.imageSmoothingEnabled = true;
  resizeCtx.imageSmoothingQuality = 'high';
  resizeCtx.drawImage(sourceCanvas, 0, 0, resizedW, resizedH);

  // 2. Center crop cropSize x cropSize
  const cropX = Math.floor((resizedW - cropSize) / 2);
  const cropY = Math.floor((resizedH - cropSize) / 2);

  let cropCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    cropCanvas = new OffscreenCanvas(cropSize, cropSize);
  } else {
    cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
  }

  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Cannot get 2D context for cropCanvas');
  cropCtx.drawImage(
    resizeCanvas,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    cropSize,
    cropSize
  );

  return cropCtx.getImageData(0, 0, cropSize, cropSize);
}

/**
 * Full preprocessing pipeline from input canvas to NCHW Float32Array tensor.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {{ resize_shorter: number, crop: number, mean: number[], std: number[] }} cfg
 * @returns {Float32Array}
 */
export function toInputTensorData(canvas, cfg) {
  const cropSize = cfg.crop || 224;
  const imageData = resizeAndCrop(canvas, cfg);
  return normalizeToNCHW(imageData.data, cropSize, cropSize, cfg);
}
