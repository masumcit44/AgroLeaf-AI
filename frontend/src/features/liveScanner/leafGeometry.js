// F1 Advanced: Live Guided Camera Scanner - Leaf Geometry & Visual Moments
// Pure mathematical functions for real-time plant leaf spatial localization.

/**
 * Checks if a pixel matches rice plant leaf pigmentation.
 * Uses Excess Green Index: 2G - R - B > 15 and green dominant over red/blue.
 *
 * @param {number} r - Red channel [0, 255]
 * @param {number} g - Green channel [0, 255]
 * @param {number} b - Blue channel [0, 255]
 * @returns {boolean}
 */
export function isPlantPixel(r, g, b) {
  if (g < 35) return false; // Too dark to be valid illuminated foliage
  const exg = 2 * g - r - b;
  return exg > 15 && g > r * 0.95 && g > b * 0.95;
}

/**
 * Generates a binary plant mask from downsampled RGBA buffer.
 *
 * @param {Uint8ClampedArray|number[]} rgba - RGBA pixel array
 * @param {number} width - Downsampled frame width (e.g. 160)
 * @param {number} height - Downsampled frame height (e.g. 160)
 * @returns {Uint8Array} Binary mask (1 for plant, 0 for background)
 */
export function extractPlantMask(rgba, width, height) {
  const numPixels = width * height;
  const mask = new Uint8Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const offset = i * 4;
    const r = rgba[offset];
    const g = rgba[offset + 1];
    const b = rgba[offset + 2];
    if (isPlantPixel(r, g, b)) {
      mask[i] = 1;
    }
  }

  return mask;
}

/**
 * Computes spatial moments and bounding box from a binary plant mask.
 *
 * @param {Uint8Array} mask - Binary mask
 * @param {number} width - Frame width
 * @param {number} height - Frame height
 * @returns {{
 *   pixelCount: number,
 *   areaRatio: number,
 *   cx: number,
 *   cy: number,
 *   bbox: { xMin: number, yMin: number, xMax: number, yMax: number, w: number, h: number },
 *   isDetected: boolean
 * }}
 */
export function computeLeafMoments(mask, width, height) {
  const totalPixels = width * height;
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let xMin = width;
  let xMax = 0;
  let yMin = height;
  let yMax = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[rowOffset + x] === 1) {
        count++;
        sumX += x;
        sumY += y;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  if (count === 0) {
    return {
      pixelCount: 0,
      areaRatio: 0,
      cx: 0.5,
      cy: 0.5,
      bbox: { xMin: 0, yMin: 0, xMax: 0, yMax: 0, w: 0, h: 0 },
      isDetected: false,
    };
  }

  const cxNorm = (sumX / count) / width;
  const cyNorm = (sumY / count) / height;
  const w = (xMax - xMin + 1) / width;
  const h = (yMax - yMin + 1) / height;

  return {
    pixelCount: count,
    areaRatio: count / totalPixels,
    cx: cxNorm,
    cy: cyNorm,
    bbox: {
      xMin: xMin / width,
      yMin: yMin / height,
      xMax: xMax / width,
      yMax: yMax / height,
      w,
      h,
    },
    isDetected: count / totalPixels >= 0.05, // At least 5% of frame contains plant foliage
  };
}

/**
 * Classifies raw leaf framing and quality into candidate directional guidance states.
 *
 * @param {{ isDetected: boolean, cx: number, cy: number, areaRatio: number, bbox: Object }} moments
 * @param {{ isDark?: boolean, isBright?: boolean, isBlurry?: boolean }} quality
 * @returns {string} One of: 'NO_LEAF'|'DARK'|'BRIGHT'|'BLURRY'|'MOVE_LEFT'|'MOVE_RIGHT'|'MOVE_UP'|'MOVE_DOWN'|'MOVE_CLOSER'|'MOVE_AWAY'|'READY'
 */
export function classifyLeafFraming(moments, quality = {}) {
  // 1. Lighting checks take precedence
  if (quality.isDark) return 'DARK';
  if (quality.isBright) return 'BRIGHT';

  // 2. No leaf detected
  if (!moments.isDetected || moments.areaRatio < 0.06) {
    return 'NO_LEAF';
  }

  // 3. Severe blur check
  if (quality.isBlurry) return 'BLURRY';

  // 4. Directional alignment (target box is [0.35, 0.65] horizontally, [0.30, 0.70] vertically)
  if (moments.cx < 0.35) return 'MOVE_LEFT';
  if (moments.cx > 0.65) return 'MOVE_RIGHT';
  if (moments.cy < 0.28) return 'MOVE_UP';
  if (moments.cy > 0.72) return 'MOVE_DOWN';

  // 5. Distance and framing scale
  if (moments.areaRatio < 0.14) return 'MOVE_CLOSER';
  if (moments.areaRatio > 0.85 || (moments.bbox && moments.bbox.w > 0.92 && moments.bbox.h > 0.92)) {
    return 'MOVE_AWAY';
  }

  // 6. All criteria satisfied: leaf is centered, well-lit, sharp, and properly sized
  return 'READY';
}
