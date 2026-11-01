import { describe, it, expect } from 'vitest';
import { roundHalfEven, resizeCropGeometry, normalizeToNCHW, resizeBilinearPil } from '../preprocess.js';
import cases from './pil_resize_cases.json';

// [srcW, srcH, resizedW, resizedH, cropX, cropY] computed with torchvision 0.29:
// T.Resize(256)(img).size and int(round((side - 224) / 2.0)) as in T.CenterCrop
const TORCHVISION = [
  [224, 224, 256, 256, 16, 16],
  [320, 320, 256, 256, 16, 16],
  [480, 320, 384, 256, 80, 16],
  [1366, 768, 455, 256, 116, 16],
  [683, 1024, 256, 383, 16, 80],
  [1024, 461, 568, 256, 172, 16],
  [1024, 683, 383, 256, 80, 16],
  [1600, 1200, 341, 256, 58, 16],
  [300, 1000, 256, 853, 16, 314],
  [1001, 257, 997, 256, 386, 16],
];

describe('roundHalfEven', () => {
  it('matches Python round()', () => {
    expect([0.5, 1.5, 2.5, 58.5, 57.5, 115.5, 16, 3.2, 3.7].map(roundHalfEven)).toEqual([0, 2, 2, 58, 58, 116, 16, 3, 4]);
  });
});

describe('resizeCropGeometry', () => {
  it.each(TORCHVISION)('%ix%i matches torchvision Resize(256) + CenterCrop(224)', (w, h, rw, rh, cx, cy) => {
    expect(resizeCropGeometry(w, h, { resize_shorter: 256, crop: 224 })).toEqual({
      resizedW: rw, resizedH: rh, cropX: cx, cropY: cy,
    });
  });
});

describe('normalizeToNCHW', () => {
  it('produces planar RGB with ImageNet normalisation and ignores alpha', () => {
    const cfg = { mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225] };
    // 2 pixels: pure red (alpha 255), mid grey (alpha 0: the canvas is already composited on white)
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 128, 128, 128, 0]);
    const t = normalizeToNCHW(rgba, 2, 1, cfg);
    const v = (x, c) => (x / 255 - cfg.mean[c]) / cfg.std[c];
    const expected = [v(255, 0), v(128, 0), v(0, 1), v(128, 1), v(0, 2), v(128, 2)];
    expect(Array.from(t).map((x) => +x.toFixed(5))).toEqual(expected.map((x) => +Math.fround(x).toFixed(5)));
  });
});

describe('resizeBilinearPil', () => {
  // Byte-exact reference from Pillow 12.2 Image.resize(size, BILINEAR), see pil_resize_cases.json
  it.each(cases.map((c) => [`${c.w}x${c.h} -> ${c.ow}x${c.oh}`, c]))('%s matches Pillow exactly', (_, c) => {
    const rgba = new Uint8ClampedArray(c.w * c.h * 4);
    for (let i = 0; i < c.w * c.h; i++) {
      rgba.set(c.rgb.slice(i * 3, i * 3 + 3), i * 4);
      rgba[i * 4 + 3] = 255;
    }
    const out = resizeBilinearPil(rgba, c.w, c.h, c.ow, c.oh);
    const rgb = [];
    for (let i = 0; i < c.ow * c.oh; i++) rgb.push(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]);
    expect(rgb).toEqual(c.expected);
  });
});

describe('resizeBilinearPil output window', () => {
  it('equals the same region of the full resize, byte for byte', () => {
    for (const c of cases) {
      const rgba = new Uint8ClampedArray(c.w * c.h * 4);
      for (let i = 0; i < c.w * c.h; i++) {
        rgba.set(c.rgb.slice(i * 3, i * 3 + 3), i * 4);
        rgba[i * 4 + 3] = 255;
      }
      const full = resizeBilinearPil(rgba, c.w, c.h, c.ow, c.oh);
      const win = { x: Math.floor(c.ow / 3), y: Math.floor(c.oh / 4), w: Math.ceil(c.ow / 2), h: Math.ceil(c.oh / 2) };
      const part = resizeBilinearPil(rgba, c.w, c.h, c.ow, c.oh, win);
      for (let y = 0; y < win.h; y++) {
        const a = Array.from(full.subarray(((y + win.y) * c.ow + win.x) * 4, ((y + win.y) * c.ow + win.x + win.w) * 4));
        expect(Array.from(part.subarray(y * win.w * 4, (y + 1) * win.w * 4))).toEqual(a);
      }
    }
  });
});
