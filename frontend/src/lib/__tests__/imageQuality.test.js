import { describe, it, expect } from 'vitest';
import { meanLuminance, laplacianVariance, DARK_MAX, BRIGHT_MIN } from '../imageQuality.js';

describe('imageQuality pure functions', () => {
  it('computes mean luminance accurately', () => {
    const black = new Uint8ClampedArray([0, 0, 0, 0]);
    const white = new Uint8ClampedArray([255, 255, 255, 255]);
    const mid = new Uint8ClampedArray([100, 100, 100, 100]);

    expect(meanLuminance(black)).toBe(0);
    expect(meanLuminance(white)).toBe(255);
    expect(meanLuminance(mid)).toBe(100);
    expect(meanLuminance(black) < DARK_MAX).toBe(true);
    expect(meanLuminance(white) > BRIGHT_MIN).toBe(true);
  });

  it('computes near-zero laplacian variance on uniform gray arrays (blurry / flat)', () => {
    const size = 16;
    const uniform = new Uint8ClampedArray(size * size).fill(128);
    const variance = laplacianVariance(uniform, size, size);

    expect(variance).toBe(0);
  });

  it('computes high laplacian variance on high-contrast checkerboard pattern (sharp edges)', () => {
    const size = 16;
    const checkerboard = new Uint8ClampedArray(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        checkerboard[y * size + x] = (x + y) % 2 === 0 ? 0 : 255;
      }
    }

    const variance = laplacianVariance(checkerboard, size, size);
    expect(variance).toBeGreaterThan(1000); // Very high variance on alternating pixels
  });

  it('handles edge cases safely with tiny or empty arrays', () => {
    expect(laplacianVariance(new Uint8ClampedArray([]), 0, 0)).toBe(0);
    expect(laplacianVariance(new Uint8ClampedArray([1, 2, 3, 4]), 2, 2)).toBe(0);
  });
});
