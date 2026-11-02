import { describe, it, expect } from 'vitest';
import { rgbToHsv255, plantPixelFraction } from '../leafCheck.js';
import { decide } from '../decide.js';

// Reference values from Pillow: Image.new('RGB',(1,1),c).convert('HSV').getpixel((0,0))
describe('rgbToHsv255 (Pillow-compatible)', () => {
  it('matches Pillow for primaries, grey and a leaf green', () => {
    expect(rgbToHsv255(255, 0, 0)).toEqual([0, 255, 255]);
    expect(rgbToHsv255(0, 255, 0)).toEqual([85, 255, 255]);
    expect(rgbToHsv255(0, 0, 255)).toEqual([170, 255, 255]);
    expect(rgbToHsv255(128, 128, 128)).toEqual([0, 0, 128]);
    expect(rgbToHsv255(90, 140, 60)).toEqual([69, 145, 140]);
  });
});

describe('plantPixelFraction', () => {
  const rule = { hue_bin_min: 3, hue_bin_max: 15, sat_min: 51, val_min: 38 };
  const px = (rgb, n) => {
    const a = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) a.set([...rgb, 255], i * 4);
    return a;
  };

  it('counts green leaf pixels and ignores grey or blue ones', () => {
    expect(plantPixelFraction(px([90, 140, 60], 10), rule)).toBe(1);
    expect(plantPixelFraction(px([128, 128, 128], 10), rule)).toBe(0);
    expect(plantPixelFraction(px([40, 60, 200], 10), rule)).toBe(0);
  });

  it('returns 0 for an empty image', () => {
    expect(plantPixelFraction(new Uint8ClampedArray(0), rule)).toBe(0);
  });
});

describe('decide with safety gate', () => {
  const healthyMid = { healthy: 0.62, blast: 0.2, brown_spot: 0.1, leaf_smut: 0.03, tungro: 0.03, sheath_blight: 0.02 };
  const blastMid = { healthy: 0.2, blast: 0.62, brown_spot: 0.1, leaf_smut: 0.03, tungro: 0.03, sheath_blight: 0.02 };

  it('rejects non-leaf images and hides candidates', () => {
    const d = decide(blastMid, 0.48, [], { leafFraction: 0.05, leafMinFraction: 0.3 });
    expect(d.status).toBe('not_sure');
    expect(d.reason).toBe('not_leaf');
    expect(d.top2).toEqual([]);
  });

  it('lets leaf images through to the model decision', () => {
    const d = decide(blastMid, 0.48, [], { leafFraction: 0.9, leafMinFraction: 0.3 });
    expect(d.status).toBe('confident');
    expect(d.top.key).toBe('blast');
  });

  it('requires the stricter threshold for healthy only', () => {
    const h = decide(healthyMid, 0.48, [], { healthyThreshold: 0.8 });
    expect(h.status).toBe('not_sure');
    expect(h.reason).toBe('healthy_needs_high_confidence');
    expect(h.top2.map((x) => x.key)).toEqual(['healthy', 'blast']);

    const b = decide(blastMid, 0.48, [], { healthyThreshold: 0.8 });
    expect(b.status).toBe('confident');
  });

  it('keeps the old behaviour when no safety config is given', () => {
    expect(decide(healthyMid, 0.48).status).toBe('confident');
    expect(decide(healthyMid, 0.7).reason).toBe('low_confidence');
  });
});

describe('decide with model v3 reject outputs', () => {
  const v3 = (top, p) => {
    const keys = ['healthy', 'blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight', 'other_rice', 'not_rice'];
    const rest = (1 - p) / (keys.length - 1);
    return Object.fromEntries(keys.map((k) => [k, k === top ? p : rest]));
  };

  it('treats a "not_rice" answer as not a leaf, with no candidates', () => {
    const d = decide(v3('not_rice', 0.9), 0.5);
    expect(d).toMatchObject({ status: 'not_sure', top: null, top2: [], reason: 'not_leaf' });
  });

  it('never names a disease for "other_rice"', () => {
    const d = decide(v3('other_rice', 0.6), 0.5);
    expect(d).toMatchObject({ status: 'not_sure', top: null, top2: [], reason: 'other_problem' });
  });

  it('never offers reject outputs as possible conditions', () => {
    const probs = { ...v3('blast', 0.4), not_rice: 0.35, other_rice: 0.1 };
    const d = decide(probs, 0.5);
    expect(d.reason).toBe('low_confidence');
    expect(d.top2.map((x) => x.key)).not.toContain('not_rice');
    expect(d.top2.map((x) => x.key)).not.toContain('other_rice');
  });
});
