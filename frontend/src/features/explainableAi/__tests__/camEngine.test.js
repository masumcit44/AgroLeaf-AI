import { describe, it, expect } from 'vitest';
import { extractClassCam, analyzeCamMetrics } from '../camEngine.js';

describe('F11 Explainable AI: camEngine', () => {
  it('returns null for missing or invalid camMaps', () => {
    expect(extractClassCam(null)).toBeNull();
    expect(extractClassCam({})).toBeNull();
    expect(extractClassCam({ data: [] })).toBeNull();
    expect(extractClassCam(new Float32Array(50))).toBeNull(); // Less than 800 elements
  });

  it('extracts class-specific slice, applies ReLU, and normalizes to [0, 1]', () => {
    // Generate synthetic 800-length array (8 classes x 10 x 10)
    const raw = new Float32Array(800);
    const blastOffset = 1 * 100; // Class 1 is 'blast'

    // Set some negative and positive values in blast slice
    raw[blastOffset + 10] = -5.0; // Should be clipped to 0 by ReLU
    raw[blastOffset + 45] = 10.0;
    raw[blastOffset + 55] = 20.0; // Peak
    raw[blastOffset + 75] = 5.0;

    const cam = extractClassCam({ data: raw }, 'blast');
    expect(cam).not.toBeNull();
    expect(cam.classKey).toBe('blast');
    expect(cam.classIndex).toBe(1);
    expect(cam.width).toBe(10);
    expect(cam.height).toBe(10);
    expect(cam.grid.length).toBe(100);

    // Negative value must be 0
    expect(cam.grid[10]).toBe(0);

    // Peak at index 55 must be normalized to 1.0
    expect(cam.grid[55]).toBe(1.0);
    expect(cam.maxPos).toEqual({ x: 5, y: 5 });

    // Mid value at index 45 (10.0 / 20.0) must be 0.5
    expect(cam.grid[45]).toBeCloseTo(0.5, 2);

    // Range must be strictly within [0, 1]
    for (let i = 0; i < 100; i++) {
      expect(cam.grid[i]).toBeGreaterThanOrEqual(0);
      expect(cam.grid[i]).toBeLessThanOrEqual(1.0);
    }
  });

  it('correctly extracts different classes from same tensor', () => {
    const raw = new Float32Array(800);
    // Blast peak at index 12 (y=1, x=2)
    raw[1 * 100 + 12] = 15.0;
    // Brown spot peak at index 78 (y=7, x=8)
    raw[2 * 100 + 78] = 25.0;

    const camBlast = extractClassCam(raw, 'blast');
    const camBrownSpot = extractClassCam(raw, 'brown_spot');

    expect(camBlast.classKey).toBe('blast');
    expect(camBlast.maxPos).toEqual({ x: 2, y: 1 });

    expect(camBrownSpot.classKey).toBe('brown_spot');
    expect(camBrownSpot.maxPos).toEqual({ x: 8, y: 7 });
  });

  it('handles uniform/degraded CAM safely without dividing by zero', () => {
    const raw = new Float32Array(800).fill(2.0);
    const cam = extractClassCam(raw, 'tungro');

    expect(cam.isDegraded).toBe(true);
    expect(cam.grid[0]).toBe(0);
    expect(cam.grid[50]).toBe(0);
  });

  it('computes metrics: mean intensity, peak focus, and diffuse status', () => {
    const raw = new Float32Array(800);
    const offset = 1 * 100;
    // Put a sharp focal peak (only 3 pixels > 0.70)
    raw[offset + 44] = 10.0;
    raw[offset + 45] = 9.0;
    raw[offset + 55] = 8.0;

    const cam = extractClassCam(raw, 'blast');
    const metrics = analyzeCamMetrics(cam);

    expect(metrics).not.toBeNull();
    expect(metrics.focusPercentage).toBeLessThan(10);
    expect(metrics.isDiffuse).toBe(false);
  });
});
