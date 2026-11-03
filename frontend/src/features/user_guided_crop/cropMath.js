// User-guided crop ("focus on the diseased leaf"): pure geometry and the canvas crop.
// Background: automatic colour isolation was measured and rejected
// (documentation/preprocessing/LEAF_ISOLATION_RESULT.md in the lead worktree): in field photos the
// background is rice too. Here the farmer chooses the region; the crop goes through the unchanged
// v10 pipeline (predictLeaf → Resize 366 + CenterCrop 320). No server, no network.

export const MIN_CROP_PX = 128; // smallest side, in source-image pixels

/** Keeps a box inside the image and at least `min` on each side (when the image allows it). */
export function clampBox(box, imgW, imgH, min = MIN_CROP_PX) {
  const minW = Math.min(min, imgW);
  const minH = Math.min(min, imgH);
  let w = Math.max(minW, Math.min(Math.round(box.w), imgW));
  let h = Math.max(minH, Math.min(Math.round(box.h), imgH));
  let x = Math.round(box.x);
  let y = Math.round(box.y);
  x = Math.min(Math.max(0, x), imgW - w);
  y = Math.min(Math.max(0, y), imgH - h);
  return { x, y, w, h };
}

/** Is the box big enough to analyse (before clamping enlarges it)? */
export function isBoxTooSmall(box, min = MIN_CROP_PX) {
  return !(box.w >= min && box.h >= min);
}

/** Default box: centred square covering 60% of the shorter side. */
export function defaultBox(imgW, imgH) {
  const side = Math.round(Math.min(imgW, imgH) * 0.6);
  return clampBox({ x: (imgW - side) / 2, y: (imgH - side) / 2, w: side, h: side }, imgW, imgH);
}

/**
 * Applies one drag. `handle` is 'move' or a corner 'nw' | 'ne' | 'sw' | 'se'; dx, dy are in
 * source-image pixels. The opposite corner stays fixed while resizing.
 */
export function dragBox(box, handle, dx, dy, imgW, imgH) {
  let { x, y, w, h } = box;
  if (handle === 'move') return clampBox({ x: x + dx, y: y + dy, w, h }, imgW, imgH);
  const right = x + w;
  const bottom = y + h;
  if (handle.includes('w')) x = Math.min(x + dx, right - MIN_CROP_PX);
  if (handle.includes('e')) w = Math.max(MIN_CROP_PX, w + dx);
  if (handle.includes('n')) y = Math.min(y + dy, bottom - MIN_CROP_PX);
  if (handle.includes('s')) h = Math.max(MIN_CROP_PX, h + dy);
  if (handle.includes('w')) w = right - Math.max(0, x);
  if (handle.includes('n')) h = bottom - Math.max(0, y);
  return clampBox({ x: Math.max(0, x), y: Math.max(0, y), w, h }, imgW, imgH);
}

/** Keyboard step: arrows move; with resize=true they grow/shrink the right/bottom edge. */
export function keyStepBox(box, key, resize, imgW, imgH, step = 16) {
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[key];
  if (!d) return box;
  return resize ? dragBox(box, 'se', d[0], d[1], imgW, imgH) : dragBox(box, 'move', d[0], d[1], imgW, imgH);
}

/**
 * Copies the box out of the source canvas into a new canvas (same pixels, no scaling, no
 * filtering), so predictLeaf sees exactly the farmer's region. Returns null if it cannot.
 */
export function cropCanvas(source, box, doc = typeof document !== 'undefined' ? document : null) {
  if (!source || !doc) return null;
  const b = clampBox(box, source.width, source.height);
  const out = doc.createElement('canvas');
  out.width = b.w;
  out.height = b.h;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  return out;
}
