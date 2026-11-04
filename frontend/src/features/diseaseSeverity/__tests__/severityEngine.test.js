import { describe, it, expect } from 'vitest';
import { measureLeafAndLesion, assessDiseaseSeverity } from '../severityEngine.js';

function makeMockCanvas(width, height, fillFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b, a] = fillFn(i % width, Math.floor(i / width));
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a ?? 255;
  }

  return {
    width,
    height,
    getContext(type) {
      if (type !== '2d') return null;
      return {
        getImageData: (x, y, w, h) => ({
          data,
          width: w,
          height: h,
        }),
      };
    },
  };
}

describe('F31 Severity Engine', () => {
  describe('measureLeafAndLesion', () => {
    it('returns invalid on missing or invalid canvas', () => {
      expect(measureLeafAndLesion(null).valid).toBe(false);
      expect(measureLeafAndLesion({}).valid).toBe(false);
    });

    it('returns insufficient_leaf_area when leaf pixels are below 3% threshold', () => {
      // 100x100 = 10,000 pixels. Fill with white background (no green/lesion).
      const canvas = makeMockCanvas(100, 100, () => [255, 255, 255, 255]);
      const res = measureLeafAndLesion(canvas);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('insufficient_leaf_area');
    });

    it('calculates lesion coverage percentage correctly on green leaf with brown lesions', () => {
      // 100x100 canvas. 1000 pixels green leaf, 200 pixels brown lesion.
      const canvas = makeMockCanvas(100, 100, (x, y) => {
        const idx = y * 100 + x;
        if (idx < 800) {
          // Healthy green: R=40, G=160, B=40
          return [40, 160, 40, 255];
        } else if (idx < 1000) {
          // Necrotic lesion: R=160, G=80, B=30
          return [160, 80, 30, 255];
        }
        // White background
        return [255, 255, 255, 255];
      });

      const res = measureLeafAndLesion(canvas);
      expect(res.valid).toBe(true);
      expect(res.leafPixels).toBe(1000);
      expect(res.lesionPixels).toBe(200);
      expect(res.coveragePct).toBe(20);
    });
  });

  describe('assessDiseaseSeverity', () => {
    const confidentDecision = { status: 'confident', top: { prob: 0.92 } };

    it('abstains on inconclusive diagnostic decision', () => {
      const res = assessDiseaseSeverity('blast', 15, { status: 'inconclusive' });
      expect(res.status).toBe('abstain');
      expect(res.reason).toBe('inconclusive_diagnosis');
    });

    it('returns not_applicable for healthy or not_rice', () => {
      expect(assessDiseaseSeverity('healthy', 0, confidentDecision).status).toBe('not_applicable');
      expect(assessDiseaseSeverity('not_rice', 5, confidentDecision).status).toBe('not_applicable');
    });

    it('abstains on Tungro with honest systemic viral limitation explanation', () => {
      const res = assessDiseaseSeverity('tungro', 15, confidentDecision);
      expect(res.status).toBe('abstain');
      expect(res.reason).toBe('tungro_systemic_limitation');
    });

    it('abstains on Sheath Blight with honest culm-height limitation explanation', () => {
      const res = assessDiseaseSeverity('sheath_blight', 15, confidentDecision);
      expect(res.status).toBe('abstain');
      expect(res.reason).toBe('sheath_blight_height_limitation');
    });

    it('maps Rice Blast to IRRI 0-9 SES Scale correctly', () => {
      // <= 1% -> scale 1 (low)
      const res1 = assessDiseaseSeverity('blast', 0.8, confidentDecision);
      expect(res1.level).toBe('low');
      expect(res1.irriScale).toBe(1);

      // <= 5% -> scale 3 (low)
      const res3 = assessDiseaseSeverity('blast', 4.5, confidentDecision);
      expect(res3.level).toBe('low');
      expect(res3.irriScale).toBe(3);

      // <= 15% -> scale 4 (medium)
      const res4 = assessDiseaseSeverity('blast', 12.0, confidentDecision);
      expect(res4.level).toBe('medium');
      expect(res4.irriScale).toBe(4);

      // <= 25% -> scale 5 (medium)
      const res5 = assessDiseaseSeverity('blast', 22.0, confidentDecision);
      expect(res5.level).toBe('medium');
      expect(res5.irriScale).toBe(5);

      // <= 50% -> scale 7 (high)
      const res7 = assessDiseaseSeverity('blast', 35.0, confidentDecision);
      expect(res7.level).toBe('high');
      expect(res7.irriScale).toBe(7);

      // > 50% -> scale 9 (high)
      const res9 = assessDiseaseSeverity('blast', 65.0, confidentDecision);
      expect(res9.level).toBe('high');
      expect(res9.irriScale).toBe(9);
    });

    it('evaluates Brown Spot severity levels correctly', () => {
      expect(assessDiseaseSeverity('brown_spot', 3.0, confidentDecision).level).toBe('low');
      expect(assessDiseaseSeverity('brown_spot', 10.0, confidentDecision).level).toBe('medium');
      expect(assessDiseaseSeverity('brown_spot', 25.0, confidentDecision).level).toBe('high');
    });

    it('evaluates Bacterial Leaf Blight severity levels correctly', () => {
      expect(assessDiseaseSeverity('bacterial_leaf_blight', 5.0, confidentDecision).level).toBe('low');
      expect(assessDiseaseSeverity('bacterial_leaf_blight', 15.0, confidentDecision).level).toBe('medium');
      expect(assessDiseaseSeverity('bacterial_leaf_blight', 30.0, confidentDecision).level).toBe('high');
    });

    it('abstains on unknown/unsupported disease classes', () => {
      const res = assessDiseaseSeverity('unknown_fungus', 20, confidentDecision);
      expect(res.status).toBe('abstain');
      expect(res.reason).toBe('unsupported_disease_class');
    });
  });
});

