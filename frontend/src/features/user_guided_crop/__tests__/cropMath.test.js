import { describe, it, expect, vi } from 'vitest';
import { clampBox, isBoxTooSmall, defaultBox, dragBox, keyStepBox, cropCanvas, MIN_CROP_PX } from '../cropMath.js';

const W = 1024;
const H = 768;

describe('crop box geometry', () => {
  it('clamps a box that leaves the image back inside it', () => {
    expect(clampBox({ x: -50, y: 700, w: 300, h: 300 }, W, H)).toEqual({ x: 0, y: 468, w: 300, h: 300 });
    expect(clampBox({ x: 900, y: -10, w: 400, h: 2000 }, W, H)).toEqual({ x: 624, y: 0, w: 400, h: 768 });
  });

  it('enforces the minimum size, but never more than the image', () => {
    expect(clampBox({ x: 10, y: 10, w: 20, h: 20 }, W, H)).toMatchObject({ w: MIN_CROP_PX, h: MIN_CROP_PX });
    expect(clampBox({ x: 0, y: 0, w: 20, h: 20 }, 100, 90)).toEqual({ x: 0, y: 0, w: 100, h: 90 });
  });

  it('flags boxes below 128 x 128 as too small', () => {
    expect(isBoxTooSmall({ w: 127, h: 300 })).toBe(true);
    expect(isBoxTooSmall({ w: 128, h: 128 })).toBe(false);
  });

  it('starts with a centred square of 60% of the shorter side', () => {
    expect(defaultBox(W, H)).toEqual({ x: 282, y: 154, w: 461, h: 461 });
  });

  it('moves and resizes from each corner, keeping the opposite corner fixed', () => {
    const b = { x: 200, y: 200, w: 300, h: 300 };
    expect(dragBox(b, 'move', 50, -20, W, H)).toEqual({ x: 250, y: 180, w: 300, h: 300 });
    expect(dragBox(b, 'se', 40, 60, W, H)).toEqual({ x: 200, y: 200, w: 340, h: 360 });
    expect(dragBox(b, 'nw', -40, -60, W, H)).toEqual({ x: 160, y: 140, w: 340, h: 360 });
    const shrunk = dragBox(b, 'nw', 1000, 1000, W, H);
    expect(shrunk.w).toBe(MIN_CROP_PX);
    expect(shrunk.x + shrunk.w).toBe(500); // right edge stayed
  });

  it('never lets a drag push the box outside the image', () => {
    const b = dragBox({ x: 10, y: 10, w: 300, h: 300 }, 'move', -500, -500, W, H);
    expect(b).toMatchObject({ x: 0, y: 0 });
    const g = dragBox({ x: 800, y: 500, w: 200, h: 200 }, 'se', 500, 500, W, H);
    expect(g.x + g.w).toBeLessThanOrEqual(W);
    expect(g.y + g.h).toBeLessThanOrEqual(H);
  });

  it('keyboard: arrows move, shift+arrows resize', () => {
    const b = { x: 200, y: 200, w: 300, h: 300 };
    expect(keyStepBox(b, 'ArrowRight', false, W, H)).toMatchObject({ x: 216, w: 300 });
    expect(keyStepBox(b, 'ArrowDown', true, W, H)).toMatchObject({ y: 200, h: 316 });
    expect(keyStepBox(b, 'Enter', false, W, H)).toBe(b);
  });
});

describe('canvas crop', () => {
  it('copies exactly the clamped box, pixel for pixel, without scaling', () => {
    const drawImage = vi.fn();
    const out = { getContext: () => ({ drawImage }) };
    const doc = { createElement: () => out };
    const source = { width: W, height: H };
    const res = cropCanvas(source, { x: 900, y: 10, w: 300, h: 200 }, doc);
    expect(res).toBe(out);
    expect([out.width, out.height]).toEqual([300, 200]);
    expect(drawImage).toHaveBeenCalledWith(source, 724, 10, 300, 200, 0, 0, 300, 200);
  });

  it('returns null instead of throwing when it cannot crop', () => {
    expect(cropCanvas(null, { x: 0, y: 0, w: 200, h: 200 }, {})).toBeNull();
    expect(cropCanvas({ width: 10, height: 10 }, { x: 0, y: 0, w: 5, h: 5 }, { createElement: () => ({ getContext: () => null }) })).toBeNull();
  });
});
