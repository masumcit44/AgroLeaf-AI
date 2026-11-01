import { describe, it, expect } from 'vitest';
import { normalizeToNCHW } from '../preprocess.js';
import { softmax, decide } from '../decide.js';

describe('normalizeToNCHW', () => {
  it('normalizes 2x2 pixels to channel-first NCHW layout correctly', () => {
    // 2x2 image (4 pixels, 16 RGBA bytes)
    // Pixel 0: (255, 0, 0, 255)
    // Pixel 1: (0, 255, 0, 255)
    // Pixel 2: (0, 0, 255, 255)
    // Pixel 3: (255, 255, 255, 255)
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ]);

    const cfg = {
      mean: [0.5, 0.5, 0.5],
      std: [0.5, 0.5, 0.5],
    };

    const tensor = normalizeToNCHW(rgba, 2, 2, cfg);
    expect(tensor.length).toBe(12); // 3 channels * 4 pixels

    // Plane R: indices 0..3
    // Pixel 0 R: (1.0 - 0.5) / 0.5 = 1.0
    // Pixel 1 R: (0.0 - 0.5) / 0.5 = -1.0
    // Pixel 2 R: (0.0 - 0.5) / 0.5 = -1.0
    // Pixel 3 R: (1.0 - 0.5) / 0.5 = 1.0
    expect(tensor[0]).toBeCloseTo(1.0, 4);
    expect(tensor[1]).toBeCloseTo(-1.0, 4);
    expect(tensor[2]).toBeCloseTo(-1.0, 4);
    expect(tensor[3]).toBeCloseTo(1.0, 4);

    // Plane G: indices 4..7
    // Pixel 0 G: (0 - 0.5) / 0.5 = -1.0
    // Pixel 1 G: (1.0 - 0.5) / 0.5 = 1.0
    // Pixel 2 G: (0 - 0.5) / 0.5 = -1.0
    // Pixel 3 G: (1.0 - 0.5) / 0.5 = 1.0
    expect(tensor[4]).toBeCloseTo(-1.0, 4);
    expect(tensor[5]).toBeCloseTo(1.0, 4);
    expect(tensor[6]).toBeCloseTo(-1.0, 4);
    expect(tensor[7]).toBeCloseTo(1.0, 4);

    // Plane B: indices 8..11
    // Pixel 0 B: (0 - 0.5) / 0.5 = -1.0
    // Pixel 1 B: (0 - 0.5) / 0.5 = -1.0
    // Pixel 2 B: (1.0 - 0.5) / 0.5 = 1.0
    // Pixel 3 B: (1.0 - 0.5) / 0.5 = 1.0
    expect(tensor[8]).toBeCloseTo(-1.0, 4);
    expect(tensor[9]).toBeCloseTo(-1.0, 4);
    expect(tensor[10]).toBeCloseTo(1.0, 4);
    expect(tensor[11]).toBeCloseTo(1.0, 4);
  });
});

describe('softmax', () => {
  it('sums to 1.0 with temperature = 1.0', () => {
    const logits = [2.0, 1.0, 0.1, -1.0, 0.5, 0.0];
    const probs = softmax(logits, 1.0);

    expect(probs.length).toBe(6);
    const sum = probs.reduce((acc, p) => acc + p, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    // Highest logit has highest prob
    expect(probs[0]).toBeGreaterThan(probs[1]);
  });

  it('flattens distributions when temperature > 1.0', () => {
    const logits = [3.0, 0.0, 0.0];
    const cold = softmax(logits, 0.5);
    const normal = softmax(logits, 1.0);
    const hot = softmax(logits, 3.0);

    // As temperature increases, the top probability should decrease towards uniform (1/3 = ~0.333)
    expect(cold[0]).toBeGreaterThan(normal[0]);
    expect(normal[0]).toBeGreaterThan(hot[0]);
    expect(hot[0]).toBeGreaterThan(1 / 3);
  });

  it('handles negative and extreme logits without NaN or overflow', () => {
    const extreme = [1000, 999, -1000];
    const probs = softmax(extreme, 1.0);
    expect(probs.some(isNaN)).toBe(false);
    expect(probs[0]).toBeCloseTo(0.731, 2);
    expect(probs[1]).toBeCloseTo(0.268, 2);
    expect(probs[2]).toBeCloseTo(0.0, 4);
  });
});

describe('decide', () => {
  it('returns confident when top probability exceeds threshold', () => {
    const probs = {
      blast: 0.85,
      brown_spot: 0.08,
      healthy: 0.04,
      leaf_smut: 0.01,
      tungro: 0.01,
      sheath_blight: 0.01,
    };
    const res = decide(probs, 0.60);
    expect(res.status).toBe('confident');
    expect(res.top.key).toBe('blast');
    expect(res.top.prob).toBe(0.85);
    expect(res.top2[0].key).toBe('blast');
    expect(res.top2[1].key).toBe('brown_spot');
  });

  it('returns not_sure when top probability is below threshold', () => {
    const probs = {
      blast: 0.45,
      brown_spot: 0.35,
      healthy: 0.10,
      leaf_smut: 0.05,
      tungro: 0.03,
      sheath_blight: 0.02,
    };
    const res = decide(probs, 0.60);
    expect(res.status).toBe('not_sure');
    expect(res.top.key).toBe('blast');
    expect(res.top.prob).toBe(0.45);
    expect(res.top2.length).toBe(2);
  });

  it('returns not_sure when top 2 classes have an exact tie', () => {
    const probs = {
      blast: 0.70,
      brown_spot: 0.70,
      healthy: 0.0,
    };
    const res = decide(probs, 0.60);
    expect(res.status).toBe('not_sure');
  });

  it('returns not_sure when any probability is NaN or invalid', () => {
    const probs = {
      blast: NaN,
      brown_spot: 0.5,
    };
    const res = decide(probs, 0.60);
    expect(res.status).toBe('not_sure');
    expect(res.top).toBeNull();
  });

  it('forces not_sure when top-1 class is in calibration.suppress list, preserving class in top2', () => {
    const probs = {
      leaf_smut: 0.88,
      blast: 0.08,
      healthy: 0.04,
    };
    // Suppress leaf_smut
    const res = decide(probs, 0.60, ['leaf_smut']);
    expect(res.status).toBe('not_sure');
    expect(res.suppressed).toBe(true);
    expect(res.top.key).toBe('leaf_smut');
    expect(res.top.prob).toBe(0.88);
    expect(res.top2[0].key).toBe('leaf_smut');
    expect(res.top2[1].key).toBe('blast');
  });

  it('keeps decision confident when top-1 class is NOT in calibration.suppress list', () => {
    const probs = {
      blast: 0.88,
      leaf_smut: 0.08,
      healthy: 0.04,
    };
    // Suppress only leaf_smut, but top-1 is blast
    const res = decide(probs, 0.60, ['leaf_smut']);
    expect(res.status).toBe('confident');
    expect(res.top.key).toBe('blast');
    expect(res.top.prob).toBe(0.88);
  });
});
