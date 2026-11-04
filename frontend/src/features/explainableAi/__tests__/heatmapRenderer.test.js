import { describe, it, expect } from 'vitest';
import {
  valueToRgba,
  upsampleBilinear,
  calculateSourceCropMapping,
  generateHeatmapRgba,
} from '../heatmapRenderer.js';

describe('F11 Explainable AI: heatmapRenderer', () => {
  it('maps low attribution values (<0.15) to transparent alpha=0', () => {
    const [, , , a1] = valueToRgba(0.0);
    expect(a1).toBe(0);

    const [, , , a2] = valueToRgba(0.14);
    expect(a2).toBe(0);
  });

  it('maps high attribution values (>0.65) to crimson/red with high alpha', () => {
    const [r, , b, a] = valueToRgba(1.0, 0.75);
    expect(r).toBeGreaterThan(200); // Red dominant
    expect(b).toBeLessThan(50); // Low blue
    expect(a).toBeGreaterThan(180); // High opacity
  });

  it('upsamples 2x2 grid to 4x4 using bilinear interpolation smoothly', () => {
    // 2x2 grid: top-left 0, top-right 1.0, bottom-left 0, bottom-right 1.0
    const src = new Float32Array([
      0.0, 1.0,
      0.0, 1.0,
    ]);
    const up = upsampleBilinear(src, 2, 2, 4, 4);

    expect(up.length).toBe(16);
    expect(up[0]).toBeCloseTo(0.0, 2);
    expect(up[3]).toBeCloseTo(1.0, 2);
    // Center columns should be strictly interpolated between 0 and 1
    expect(up[1]).toBeGreaterThan(0.0);
    expect(up[1]).toBeLessThan(1.0);
  });

  it('calculates crop mapping back to original coordinates correctly', () => {
    // Original photo 1200 x 1600 (portrait)
    const mapping = calculateSourceCropMapping(1200, 1600, 320, 366);

    expect(mapping.scale).toBeCloseTo(366 / 1200, 3);
    expect(mapping.cropX).toBeGreaterThanOrEqual(0);
    expect(mapping.cropY).toBeGreaterThanOrEqual(0);
    expect(mapping.cropW).toBeLessThanOrEqual(1200);
    expect(mapping.cropH).toBeLessThanOrEqual(1600);
  });

  it('generates clamped Uint8ClampedArray for ImageData', () => {
    const grid = new Float32Array([0.1, 0.5, 0.8, 1.0]);
    const rgba = generateHeatmapRgba(grid, 2, 2, 0.70);

    expect(rgba).toBeInstanceOf(Uint8ClampedArray);
    expect(rgba.length).toBe(16); // 4 pixels * 4 channels
    // First pixel (0.1) must be transparent
    expect(rgba[3]).toBe(0);
    // Last pixel (1.0) must be non-zero alpha
    expect(rgba[15]).toBeGreaterThan(150);
  });
});
