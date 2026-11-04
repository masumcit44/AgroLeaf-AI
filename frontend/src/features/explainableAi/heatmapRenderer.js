// F11 Heatmap Rendering & Coordinate Alignment
// Bilinear upsampling and Turbo/Thermal colormapping for CAM heatmaps.

/**
 * Returns RGBA tuple for normalized value in [0, 1] using high-contrast thermal palettes.
 *
 * Supports two distinct modes:
 * 1. 'overlay' (default): Designed for blending over leaf photography.
 *    - Low values (<0.18) are transparent (alpha=0) to keep healthy tissue crisp.
 *    - Lesion attribution (>=0.18) transitions from Warm Amber to Intense Crimson,
 *      providing maximum visual contrast against green rice leaves (Delta E > 40).
 *    - Alpha scales dynamically with baseAlpha (opacity slider).
 *
 * 2. 'heatmap': Designed for standalone "AI Highlight" view.
 *    - Full continuous thermal spectrum from Deep Navy/Indigo (cold) to Crimson (hot).
 *    - Fully opaque (alpha=255) so there are zero pitch-black or missing areas.
 *
 * @param {number} val - Normalized attribution value in [0, 1]
 * @param {number} baseAlpha - Maximum alpha for peak values (0.0 - 1.0)
 * @param {'overlay'|'heatmap'} mode - Palette mode
 * @returns {[number, number, number, number]} [r, g, b, a] in 0-255 range
 */
export function valueToRgba(val, baseAlpha = 0.65, mode = 'overlay') {
  const v = Math.max(0, Math.min(1, Number(val) || 0));

  if (mode === 'heatmap') {
    // Continuous full-spectrum thermal Grad-CAM palette (Alpha = 255)
    let r;
    let g;
    let b;
    if (v < 0.25) {
      // Deep Indigo/Blue -> Cyan: [20, 30, 110] -> [0, 185, 235]
      const t = v / 0.25;
      r = Math.round(20 + t * (0 - 20));
      g = Math.round(30 + t * (185 - 30));
      b = Math.round(110 + t * (235 - 110));
    } else if (v < 0.50) {
      // Cyan -> Lime / Yellow-Green: [0, 185, 235] -> [160, 220, 20]
      const t = (v - 0.25) / 0.25;
      r = Math.round(0 + t * 160);
      g = Math.round(185 + t * (220 - 185));
      b = Math.round(235 - t * 215);
    } else if (v < 0.75) {
      // Lime / Yellow-Green -> Bright Amber-Orange: [160, 220, 20] -> [255, 140, 0]
      const t = (v - 0.50) / 0.25;
      r = Math.round(160 + t * (255 - 160));
      g = Math.round(220 - t * (220 - 140));
      b = Math.round(20 - t * 20);
    } else {
      // Bright Amber-Orange -> Vivid Fire Red / Crimson: [255, 140, 0] -> [235, 20, 20]
      const t = (v - 0.75) / 0.25;
      r = Math.round(255 - t * 20);
      g = Math.round(140 - t * 120);
      b = Math.round(0 + t * 20);
    }
    return [r, g, b, 255];
  }

  // mode === 'overlay': High-contrast lesion attribution over green leaf
  // Background threshold: below 0.18 is transparent
  if (v < 0.18) {
    return [0, 0, 0, 0];
  }

  // Normalized position within active lesion range
  const normV = (v - 0.18) / 0.82;

  // Responsive alpha scaling driven directly by user opacity slider (baseAlpha)
  const effectiveAlpha = Math.round(
    Math.min(255, Math.max(30, (0.35 + normV * 0.65) * baseAlpha * 255))
  );

  let r;
  let g;
  let b;
  if (normV < 0.40) {
    // Warm Amber / Golden Yellow: [255, 210, 15] -> [255, 155, 0]
    const t = normV / 0.40;
    r = 255;
    g = Math.round(210 - t * 55);
    b = Math.round(15 - t * 15);
  } else if (normV < 0.75) {
    // Bright Orange: [255, 155, 0] -> [250, 75, 10]
    const t = (normV - 0.40) / 0.35;
    r = Math.round(255 - t * 5);
    g = Math.round(155 - t * 80);
    b = Math.round(0 + t * 10);
  } else {
    // Intense Fire Red / Crimson: [250, 75, 10] -> [230, 20, 20]
    const t = (normV - 0.75) / 0.25;
    r = Math.round(250 - t * 20);
    g = Math.round(75 - t * 55);
    b = Math.round(10 + t * 10);
  }

  return [r, g, b, effectiveAlpha];
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

  const safeCropX = Math.max(0, Math.min(origW - 1, origCropX));
  const safeCropY = Math.max(0, Math.min(origH - 1, origCropY));

  return {
    cropX: safeCropX,
    cropY: safeCropY,
    cropW: Math.max(1, Math.min(origW - safeCropX, origCropW)),
    cropH: Math.max(1, Math.min(origH - safeCropY, origCropH)),
    scale,
  };
}

/**
 * Renders CAM grid into RGBA ImageData array for HTML5 canvas.
 */
export function generateHeatmapRgba(upsampledGrid, width, height, opacity = 0.65, mode = 'overlay') {
  const totalPixels = width * height;
  const rgba = new Uint8ClampedArray(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    const val = upsampledGrid[i];
    const [r, g, b, a] = valueToRgba(val, opacity, mode);
    const offset = i * 4;
    rgba[offset] = r;
    rgba[offset + 1] = g;
    rgba[offset + 2] = b;
    rgba[offset + 3] = a;
  }

  return rgba;
}
