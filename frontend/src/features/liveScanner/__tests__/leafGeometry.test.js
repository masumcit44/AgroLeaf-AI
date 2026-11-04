import { describe, it, expect } from 'vitest';
import {
  isPlantPixel,
  extractPlantMask,
  computeLeafMoments,
  classifyLeafFraming,
} from '../leafGeometry.js';

describe('Live Camera Scanner: leafGeometry', () => {
  it('correctly identifies vivid green plant pixels using Excess Green index', () => {
    // Rich green leaf pixel: R=45, G=140, B=35
    expect(isPlantPixel(45, 140, 35)).toBe(true);

    // Mud/soil brown: R=110, G=70, B=40
    expect(isPlantPixel(110, 70, 40)).toBe(false);

    // Blue sky: R=60, G=120, B=210
    expect(isPlantPixel(60, 120, 210)).toBe(false);

    // Dark shadow/black: R=10, G=15, B=10
    expect(isPlantPixel(10, 15, 10)).toBe(false);
  });

  it('computes spatial centroid and coverage ratio accurately from synthetic frame', () => {
    const width = 10;
    const height = 10;
    const rgba = new Uint8ClampedArray(width * height * 4);

    // Create a 2x2 green patch in the top-left corner (x=1..2, y=1..2)
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 2; x++) {
        const idx = (y * width + x) * 4;
        rgba[idx] = 40;     // R
        rgba[idx + 1] = 150;// G
        rgba[idx + 2] = 30; // B
        rgba[idx + 3] = 255;// A
      }
    }

    const mask = extractPlantMask(rgba, width, height);
    expect(mask[1 * width + 1]).toBe(1);
    expect(mask[0]).toBe(0);

    const moments = computeLeafMoments(mask, width, height);
    expect(moments.pixelCount).toBe(4);
    expect(moments.areaRatio).toBeCloseTo(0.04, 2);
    // Centroid should be around x=1.5/10 = 0.15, y=1.5/10 = 0.15
    expect(moments.cx).toBeCloseTo(0.15, 2);
    expect(moments.cy).toBeCloseTo(0.15, 2);
  });

  it('classifies framing instructions appropriately based on spatial position and quality', () => {
    // 1. Dark environment
    expect(classifyLeafFraming({ isDetected: true }, { isDark: true })).toBe('DARK');

    // 2. Overexposed / bright
    expect(classifyLeafFraming({ isDetected: true }, { isBright: true })).toBe('BRIGHT');

    // 3. No leaf detected
    expect(classifyLeafFraming({ isDetected: false, areaRatio: 0.02 }, {})).toBe('NO_LEAF');

    // 4. Blurry leaf
    const centeredMoments = { isDetected: true, areaRatio: 0.40, cx: 0.50, cy: 0.50 };
    expect(classifyLeafFraming(centeredMoments, { isBlurry: true })).toBe('BLURRY');

    // 5. Leaf on far left -> Move left
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.30, cx: 0.20, cy: 0.50 }, {})).toBe('MOVE_LEFT');

    // 6. Leaf on far right -> Move right
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.30, cx: 0.80, cy: 0.50 }, {})).toBe('MOVE_RIGHT');

    // 7. Leaf too high -> Move up
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.30, cx: 0.50, cy: 0.15 }, {})).toBe('MOVE_UP');

    // 8. Leaf too low -> Move down
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.30, cx: 0.50, cy: 0.85 }, {})).toBe('MOVE_DOWN');

    // 9. Centered but too small -> Move closer
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.08, cx: 0.50, cy: 0.50 }, {})).toBe('MOVE_CLOSER');

    // 10. Ideally centered, sharp, and adequately sized -> READY
    expect(classifyLeafFraming({ isDetected: true, areaRatio: 0.35, cx: 0.50, cy: 0.50 }, { isBlurry: false, isDark: false })).toBe('READY');
  });
});

