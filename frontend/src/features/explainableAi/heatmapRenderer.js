// F11 Heatmap Rendering & Coordinate Alignment
// Bilinear upsampling and Turbo/Thermal colormapping for CAM heatmaps.

/**
 * Returns RGBA tuple for normalized value in [0, 1] using perceptually uniform thermal palette.
 * Low values (<0.15) have alpha=0 (transparent) so healthy leaf tissue remains natural.
 * High values (>0.65) transition to vibrant red with user-controlled opacity.
 *
 * @param {number} val - Normalized attribution value in [0, 1]
 * @param {number} baseAlpha - Maximum alpha for peak values (0.0 - 1.0)
 * @returns {[number, number, number, number]} [r, g, b, a] in 0-255 range
 */
export function valueToRgba(val, baseAlpha = 0.65) {
  const v = Math.max(0, Math.min(1, Number(val) || 0));

  // Background threshold: below 0.15 is transparent
  if (v < 0.15) {
    return [0, 0, 0, 0];
  }

  // Alpha scales smoothly from 0.2 at threshold to baseAlpha at peak
  const normV = (v - 0.15) / 0.85;
  const alpha = Math.round(Math.min(255, Math.max(0, (0.25 + normV * (baseAlpha - 0.25)) * 255)));

  let r, g, b;

  if (v < 0.35) {
    // Deep Cyan to Sea Green: [0, 160, 220] -> [30, 210, 170]
    const t = (v - 0.15) / 0.20;
    r = Math.round(0 + t * 30);
    g = Math.round(160 + t * 50);
    b = Math.round(220 - t * 50);
  } else if (v < 0.65) {
    // Greenish Yellow to Golden Amber: [30, 210, 170] -> [255, 200, 0]
    const t = (v - 0.35) / 0.30;
    r = Math.round(30 + t * 225);
    g = Math.round(210 - t * 10);
    b = Math.round(170 - t * 170);
  } else {
    // Bright Orange to Deep Crimson: [255, 200, 0] -> [235, 30, 20]
    const t = (v - 0.65) / 0.35;
    r = Math.round(255 - t * 20);
    g = Math.round(200 - t * 170);
    b = Math.round(0 + t * 20);
  }

  return [r, g, b, alpha];
}

/**
 * Bilinearly interpolates 2D CAM grid to arbitrary resolution (e.g. 10x10 -> 320x320).
 * Returns Float32Array of length (targetWidth * targetHeight).
 */
export function upsampleBilinear(grid, srcW, srcH, dstW, dstH) {
  const out = new Float32Array(dstW * dstH);
  const xRatio = (srcW - 1) / Math.max(1, dstW - 1);
  const yRatio = (srcH - 1) / Math.max(1, dstH - 1);

  for (let y = 0; y < dstH; y++) {
    const srcY = y * yRatio;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const yLerp = srcY - y0;

    for (let x = 0; x < dstW; x++) {
      const srcX = x * xRatio;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const xLerp = srcX - x0;

      const v00 = grid[y0 * srcW + x0];
      const v10 = grid[y0 * srcW + x1];
      const v01 = grid[y1 * srcW + x0];
      const v11 = grid[y1 * srcW + x1];

      const top = v00 + xLerp * (v10 - v00);
      const bottom = v01 + xLerp * (v11 - v01);
      out[y * dstW + x] = top + yLerp * (bottom - top);
    }
  }

  return out;
}

/**
 * Computes bounding box mapping from 320x320 model space to original canvas coordinates.
 */
export function calculateSourceCropMapping(origW, origH, modelCropSize = 320, resizeShorter = 366) {
  const sMin = Math.min(origW, origH);
  const scale = resizeShorter / Math.max(1, sMin);

  const scaledW = origW * scale;
  const scaledH = origH * scale;

  const cropXOnScaled = (scaledW - modelCropSize) / 2;
  const cropYOnScaled = (scaledH - modelCropSize) / 2;

  // Invert back to original image coordinates
  const origCropX = Math.round(cropXOnScaled / scale);
  const origCropY = Math.round(cropYOnScaled / scale);
  const origCropW = Math.round(modelCropSize / scale);
  const origCropH = Math.round(modelCropSize / scale);

  return {
    cropX: Math.max(0, origCropX),
    cropY: Math.max(0, origCropY),
    cropW: Math.min(origW, origCropW),
    cropH: Math.min(origH, origCropH),
    scale,
  };
}

/**
 * Renders CAM grid into RGBA ImageData array for HTML5 canvas.
 */
export function generateHeatmapRgba(upsampledGrid, width, height, opacity = 0.65) {
  const totalPixels = width * height;
  const rgba = new Uint8ClampedArray(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    const val = upsampledGrid[i];
    const [r, g, b, a] = valueToRgba(val, opacity);
    const offset = i * 4;
    rgba[offset] = r;
    rgba[offset + 1] = g;
    rgba[offset + 2] = b;
    rgba[offset + 3] = a;
  }

  return rgba;
}
