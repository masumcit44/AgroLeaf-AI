/**
 * Normalise RGBA pixel array to NCHW Float32Array matching PyTorch ImageNet transforms.
 * Pure function, testable in Vitest without canvas or DOM.
 *
 * @param {Uint8ClampedArray|number[]} rgba - RGBA pixel array of size width * height * 4
 * @param {number} width - image width (e.g. 224)
 * @param {number} height - image height (e.g. 224)
 * @param {{ mean: number[], std: number[] }} cfg - normalization config
 * @returns {Float32Array} - NCHW channel-first tensor of shape [3, height, width]
 */
export function normalizeToNCHW(rgba, width, height, cfg) {
  const numPixels = width * height;
  const tensor = new Float32Array(3 * numPixels);

  const meanR = cfg.mean[0];
  const meanG = cfg.mean[1];
  const meanB = cfg.mean[2];

  const stdR = cfg.std[0];
  const stdG = cfg.std[1];
  const stdB = cfg.std[2];

  const planeR = 0;
  const planeG = numPixels;
  const planeB = 2 * numPixels;

  for (let i = 0; i < numPixels; i++) {
    const r = rgba[i * 4] / 255.0;
    const g = rgba[i * 4 + 1] / 255.0;
    const b = rgba[i * 4 + 2] / 255.0;

    tensor[planeR + i] = (r - meanR) / stdR;
    tensor[planeG + i] = (g - meanG) / stdG;
    tensor[planeB + i] = (b - meanB) / stdB;
  }

  return tensor;
}

/**
 * Python's round(): halves go to the nearest even integer (58.5 -> 58).
 * torchvision CenterCrop uses it for the crop offset.
 *
 * @param {number} x
 * @returns {number}
 */
export function roundHalfEven(x) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

const PRECISION_BITS = 22; // Pillow Resample.c: 32 - 8 - 2

/**
 * Pillow's per-output-pixel filter windows and fixed-point weights for a
 * BILINEAR (triangle, support 1) resize along one axis, with antialiasing.
 *
 * @param {number} inSize
 * @param {number} outSize
 * @returns {{ bounds: Int32Array, weights: Int32Array, ksize: number }}
 */
function bilinearCoeffs(inSize, outSize) {
  const scale = inSize / outSize;
  const filterScale = Math.max(scale, 1);
  const support = filterScale; // bilinear support 1.0 * filterscale
  const ksize = Math.ceil(support) * 2 + 1;
  const bounds = new Int32Array(outSize * 2);
  const weights = new Int32Array(outSize * ksize);
  const k = new Float64Array(ksize);
  for (let xx = 0; xx < outSize; xx++) {
    const center = (xx + 0.5) * scale;
    const xmin = Math.max(Math.trunc(center - support + 0.5), 0);
    const xmax = Math.min(Math.trunc(center + support + 0.5), inSize) - xmin;
    let ww = 0;
    for (let x = 0; x < xmax; x++) {
      const d = Math.abs((x + xmin - center + 0.5) / filterScale);
      k[x] = d < 1 ? 1 - d : 0;
      ww += k[x];
    }
    for (let x = 0; x < xmax; x++) {
      const w = ww !== 0 ? k[x] / ww : k[x];
      weights[xx * ksize + x] = Math.trunc(w < 0 ? -0.5 + w * (1 << PRECISION_BITS) : 0.5 + w * (1 << PRECISION_BITS));
    }
    bounds[xx * 2] = xmin;
    bounds[xx * 2 + 1] = xmax;
  }
  return { bounds, weights, ksize };
}

function clip8(ss) {
  if (ss >= 255 * 2 ** PRECISION_BITS) return 255;
  if (ss <= 0) return 0;
  return Math.floor(ss / 2 ** PRECISION_BITS);
}

/**
 * Byte-exact port of Pillow's Image.resize(size, BILINEAR) for 8-bit RGB(A),
 * which torchvision's Resize uses on PIL images: horizontal pass, round to
 * 8 bit, then vertical pass. Alpha is written as 255 (the canvas is opaque).
 * Only the output window is computed (every output pixel is independent),
 * so resize + center crop costs about half of a full resize. Pure function.
 *
 * @param {Uint8ClampedArray} rgba - source pixels, width * height * 4
 * @param {number} width
 * @param {number} height
 * @param {number} outW - full resized width
 * @param {number} outH - full resized height
 * @param {{ x: number, y: number, w: number, h: number }} [win] - output window (default: everything)
 * @returns {Uint8ClampedArray} - RGBA pixels of the window, win.w * win.h * 4
 */
export function resizeBilinearPil(rgba, width, height, outW, outH, win = { x: 0, y: 0, w: outW, h: outH }) {
  const half = 2 ** (PRECISION_BITS - 1);
  const { x: x0, y: y0, w: winW, h: winH } = win;
  const hc = outW !== width ? bilinearCoeffs(width, outW) : null;
  const vc = outH !== height ? bilinearCoeffs(height, outH) : null;

  // Source rows the vertical pass will read (filter windows are monotonic)
  let rowLo = y0;
  let rowHi = y0 + winH;
  if (vc) {
    const last = y0 + winH - 1;
    rowLo = vc.bounds[y0 * 2];
    rowHi = vc.bounds[last * 2] + vc.bounds[last * 2 + 1];
  }

  // Horizontal pass: window columns, needed rows only
  const tmp = new Uint8ClampedArray(winW * (rowHi - rowLo) * 4);
  for (let y = rowLo; y < rowHi; y++) {
    const row = y * width * 4;
    for (let c = 0; c < winW; c++) {
      const xx = x0 + c;
      const o = ((y - rowLo) * winW + c) * 4;
      if (!hc) {
        tmp.set(rgba.subarray(row + xx * 4, row + xx * 4 + 3), o);
        continue;
      }
      const xmin = hc.bounds[xx * 2];
      const xmax = hc.bounds[xx * 2 + 1];
      let r = half;
      let g = half;
      let b = half;
      for (let x = 0; x < xmax; x++) {
        const w = hc.weights[xx * hc.ksize + x];
        const i = row + (x + xmin) * 4;
        r += rgba[i] * w;
        g += rgba[i + 1] * w;
        b += rgba[i + 2] * w;
      }
      tmp[o] = clip8(r);
      tmp[o + 1] = clip8(g);
      tmp[o + 2] = clip8(b);
    }
  }

  // Vertical pass: window rows
  const out = new Uint8ClampedArray(winW * winH * 4);
  for (let rIdx = 0; rIdx < winH; rIdx++) {
    const yy = y0 + rIdx;
    for (let c = 0; c < winW; c++) {
      const o = (rIdx * winW + c) * 4;
      if (!vc) {
        const i = ((yy - rowLo) * winW + c) * 4;
        out[o] = tmp[i];
        out[o + 1] = tmp[i + 1];
        out[o + 2] = tmp[i + 2];
      } else {
        const ymin = vc.bounds[yy * 2];
        const ymax = vc.bounds[yy * 2 + 1];
        let r = half;
        let g = half;
        let b = half;
        for (let y = 0; y < ymax; y++) {
          const w = vc.weights[yy * vc.ksize + y];
          const i = ((y + ymin - rowLo) * winW + c) * 4;
          r += tmp[i] * w;
          g += tmp[i + 1] * w;
          b += tmp[i + 2] * w;
        }
        out[o] = clip8(r);
        out[o + 1] = clip8(g);
        out[o + 2] = clip8(b);
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

/**
 * Geometry of torchvision Resize(resize_shorter) + CenterCrop(crop): the long
 * side is truncated, the crop offset is rounded half-to-even. Pure function.
 *
 * @param {number} srcW
 * @param {number} srcH
 * @param {{ resize_shorter?: number, crop?: number }} cfg
 * @returns {{ resizedW: number, resizedH: number, cropX: number, cropY: number }}
 */
export function resizeCropGeometry(srcW, srcH, cfg) {
  const cropSize = cfg.crop || 224;
  const resizeShorter = cfg.resize_shorter || 256;
  const resizedW = srcW < srcH ? resizeShorter : Math.floor((srcW * resizeShorter) / srcH);
  const resizedH = srcW < srcH ? Math.floor((srcH * resizeShorter) / srcW) : resizeShorter;
  return {
    resizedW,
    resizedH,
    cropX: roundHalfEven((resizedW - cropSize) / 2),
    cropY: roundHalfEven((resizedH - cropSize) / 2),
  };
}

/**
 * Resize shorter side to cfg.resize_shorter (256) and center-crop to cfg.crop (224x224).
 *
 * The resize is the Pillow-exact port above, not a canvas draw: browser
 * smoothing differs from torchvision enough to flip borderline predictions.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} sourceCanvas
 * @param {{ resize_shorter: number, crop: number }} cfg
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }} - RGBA crop
 */
export function resizeAndCrop(sourceCanvas, cfg) {
  const cropSize = cfg.crop || 224;
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const { resizedW, resizedH, cropX, cropY } = resizeCropGeometry(srcW, srcH, cfg);

  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2D context for source canvas');
  const data = resizeBilinearPil(ctx.getImageData(0, 0, srcW, srcH).data, srcW, srcH, resizedW, resizedH, {
    x: cropX,
    y: cropY,
    w: cropSize,
    h: cropSize,
  });
  return { data, width: cropSize, height: cropSize };
}

/**
 * Full preprocessing pipeline from input canvas to NCHW Float32Array tensor.
 *
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {{ resize_shorter: number, crop: number, mean: number[], std: number[] }} cfg
 * @returns {Float32Array}
 */
export function toInputTensorData(canvas, cfg) {
  const cropSize = cfg.crop || 224;
  const imageData = resizeAndCrop(canvas, cfg);
  return normalizeToNCHW(imageData.data, cropSize, cropSize, cfg);
}
