import { describe, it, expect } from 'vitest';
import {
  valueToRgba,
  upsampleBilinear,
  calculateSourceCropMapping,
  generateHeatmapRgba,
} from '../heatmapRenderer.js';

describe('F11 Explainable AI: heatmapRenderer', () => {
  // -------------------------------------------------------------------------
  // valueToRgba — overlay mode (default)
  // -------------------------------------------------------------------------
  describe('overlay mode', () => {
    it('maps low attribution values (<0.18) to transparent alpha=0', () => {
      const [, , , a1] = valueToRgba(0.0, 0.65, 'overlay');
      expect(a1).toBe(0);

      const [, , , a2] = valueToRgba(0.17, 0.65, 'overlay');
      expect(a2).toBe(0);
    });

    it('maps high attribution values (>=0.18) to warm amber-to-crimson with nonzero alpha', () => {
      const [r, g, b, a] = valueToRgba(1.0, 0.75, 'overlay');
      expect(r).toBeGreaterThan(200); // Red dominant (crimson)
      expect(g).toBeLessThan(50);     // Very low green
      expect(b).toBeLessThan(50);     // Very low blue
      expect(a).toBeGreaterThan(100); // Visible
    });

    it('amber zone (normV ≈ 0.3) has yellow-gold tone: high R, high G, low B', () => {
      // v=0.42 → normV ≈ 0.293 → amber zone
      const [r, g, b, a] = valueToRgba(0.42, 0.75, 'overlay');
      expect(r).toBe(255);
      expect(g).toBeGreaterThan(100);
      expect(b).toBeLessThan(20);
      expect(a).toBeGreaterThan(30);
    });

    it('provides high RGB contrast against green leaf background at mid values', () => {
      // Green leaf ≈ [70, 150, 60]. Attribution at v=0.6 should be warm amber/orange.
      const [r, g, b] = valueToRgba(0.6, 0.75, 'overlay');
      // Delta from green: check at least R or B is significantly different
      const deltaR = Math.abs(r - 70);
      const deltaG = Math.abs(g - 150);
      expect(deltaR + deltaG).toBeGreaterThan(100); // meaningful contrast
      expect(b).toBeLessThan(50); // orange/amber has minimal blue
    });
  });

  // -------------------------------------------------------------------------
  // valueToRgba — heatmap mode (full-spectrum thermal, fully opaque)
  // -------------------------------------------------------------------------
  describe('heatmap mode', () => {
    it('low values produce cool indigo/blue tones, alpha=255', () => {
      const [r, g, b, a] = valueToRgba(0.0, 1.0, 'heatmap');
      expect(a).toBe(255); // Always fully opaque
      expect(b).toBeGreaterThan(r + 20); // Blue dominant
    });

    it('mid values produce cyan/lime tones, alpha=255', () => {
      const [r, g, b, a] = valueToRgba(0.5, 1.0, 'heatmap');
      expect(a).toBe(255);
      // Transition zone — either greenish or orangish, not pure black
      expect(r + g + b).toBeGreaterThan(200);
    });

    it('high values produce vivid red/crimson tones, alpha=255', () => {
      const [r, , b, a] = valueToRgba(1.0, 1.0, 'heatmap');
      expect(a).toBe(255);
      expect(r).toBeGreaterThan(200); // Red dominant
      expect(b).toBeLessThan(50);
    });

    it('no pixel is pure black [0,0,0,255] or transparent in heatmap mode', () => {
      for (let v = 0; v <= 1.0; v += 0.05) {
        const [r, g, b, a] = valueToRgba(v, 1.0, 'heatmap');
        expect(a).toBe(255); // Never transparent
        // Should have some color
        expect(r + g + b).toBeGreaterThan(30);
      }
    });
  });

  // -------------------------------------------------------------------------
  // upsampleBilinear
  // -------------------------------------------------------------------------
  it('upsamples 2x2 grid to 4x4 using bilinear interpolation smoothly', () => {
    const src = new Float32Array([0.0, 1.0, 0.0, 1.0]);
    const up = upsampleBilinear(src, 2, 2, 4, 4);

    expect(up.length).toBe(16);
    expect(up[0]).toBeCloseTo(0.0, 2);
    expect(up[3]).toBeCloseTo(1.0, 2);
    // Center columns should be strictly interpolated
    expect(up[1]).toBeGreaterThan(0.0);
    expect(up[1]).toBeLessThan(1.0);
  });

  // -------------------------------------------------------------------------
  // calculateSourceCropMapping
  // -------------------------------------------------------------------------
  it('calculates crop mapping back to original coordinates correctly', () => {
    const mapping = calculateSourceCropMapping(1200, 1600, 320, 366);
    expect(mapping.scale).toBeCloseTo(366 / 1200, 3);
    expect(mapping.cropX).toBeGreaterThanOrEqual(0);
    expect(mapping.cropY).toBeGreaterThanOrEqual(0);
    expect(mapping.cropW).toBeLessThanOrEqual(1200);
    expect(mapping.cropH).toBeLessThanOrEqual(1600);
  });

  it('handles square input (ROI crop) correctly with minimal offset', () => {
    // Square image 320x320 — should map nearly 1:1 (or exactly 1:1)
    const mapping = calculateSourceCropMapping(320, 320, 320, 366);
    // scale = 366/320 ≈ 1.44; cropXOnScaled = (366*1.44 - 320)/2 — negative, clamped to 0
    expect(mapping.cropX).toBeGreaterThanOrEqual(0);
    expect(mapping.cropY).toBeGreaterThanOrEqual(0);
  });

  // -------------------------------------------------------------------------
  // generateHeatmapRgba
  // -------------------------------------------------------------------------
  it('generates clamped Uint8ClampedArray for ImageData — overlay mode', () => {
    const grid = new Float32Array([0.1, 0.5, 0.8, 1.0]);
    const rgba = generateHeatmapRgba(grid, 2, 2, 0.70, 'overlay');

    expect(rgba).toBeInstanceOf(Uint8ClampedArray);
    expect(rgba.length).toBe(16);
    // First pixel (0.1 < 0.18) → transparent
    expect(rgba[3]).toBe(0);
    // Last pixel (1.0) → visible alpha
    expect(rgba[15]).toBeGreaterThan(100);
  });

  it('generates fully opaque pixels in heatmap mode', () => {
    const grid = new Float32Array([0.0, 0.25, 0.75, 1.0]);
    const rgba = generateHeatmapRgba(grid, 2, 2, 1.0, 'heatmap');

    expect(rgba).toBeInstanceOf(Uint8ClampedArray);
    // All pixels alpha=255
    expect(rgba[3]).toBe(255);
    expect(rgba[7]).toBe(255);
    expect(rgba[11]).toBe(255);
    expect(rgba[15]).toBe(255);
  });
});
