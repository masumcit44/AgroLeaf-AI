/**
 * Leaf-colour gate: share of "plant-coloured" pixels in the 224x224 model crop.
 * Pure functions, testable in Vitest without canvas or DOM.
 *
 * The thresholds are fitted offline (ml/tools/fit_safety_gate.py) on histograms
 * computed with Pillow's RGB->HSV conversion on the same crop, so rgbToHsv255
 * reproduces Pillow's integer arithmetic (libImaging/Convert.c rgb2hsv).
 */

/**
 * @param {number} r 0..255
 * @param {number} g 0..255
 * @param {number} b 0..255
 * @returns {[number, number, number]} [h, s, v] each 0..255 (Pillow scale)
 */
export function rgbToHsv255(r, g, b) {
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  if (maxc === minc) return [0, 0, maxc];
  // Pillow stores intermediates in 32-bit float variables but evaluates each
  // expression in double; Math.fround at every store reproduces its rounding.
  const f = Math.fround;
  const cr = maxc - minc;
  const s = f(cr / maxc);
  const rc = f((maxc - r) / cr);
  const gc = f((maxc - g) / cr);
  const bc = f((maxc - b) / cr);
  let h;
  if (r === maxc) h = f(bc - gc);
  else if (g === maxc) h = f(2.0 + rc - bc);
  else h = f(4.0 + gc - rc);
  h = f((h / 6.0 + 1.0) % 1.0);
  return [Math.min(255, Math.trunc(h * 255.0)), Math.min(255, Math.trunc(s * 255.0)), maxc];
}

/**
 * Fraction of pixels that look like leaf tissue (green, yellow or brown lesion).
 * Hue is tested by 36-bin index (bin = floor(h * 36 / 256)) to match the
 * offline histogram exactly.
 *
 * @param {Uint8ClampedArray|number[]} rgba - RGBA pixels
 * @param {{ hue_bin_min: number, hue_bin_max: number, sat_min: number, val_min: number }} rule
 * @returns {number} 0..1
 */
export function plantPixelFraction(rgba, rule) {
  const n = Math.floor(rgba.length / 4);
  if (n === 0) return 0;
  let hits = 0;
  for (let i = 0; i < n; i++) {
    const [h, s, v] = rgbToHsv255(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    const bin = Math.floor((h * 36) / 256);
    if (bin >= rule.hue_bin_min && bin <= rule.hue_bin_max && s >= rule.sat_min && v >= rule.val_min) {
      hits++;
    }
  }
  return hits / n;
}
