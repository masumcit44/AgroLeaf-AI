import { describe, it, expect, vi } from 'vitest';
import {
  getVisibleCameraSourceRect,
  captureVisibleFrameToCanvas,
} from '../cameraFraming.js';

describe('F1 Camera Framing Geometry - getVisibleCameraSourceRect', () => {
  it('correctly calculates centered crop for iPhone 14 viewport with 1080x1920 portrait stream', () => {
    // iPhone 14 screen: 390 x 844 (aspect ratio ~0.4621)
    // Camera stream: 1080 x 1920 (aspect ratio 0.5625)
    // Screen is narrower/taller than stream -> stream sides must be cropped
    const rect = getVisibleCameraSourceRect({
      sourceWidth: 1080,
      sourceHeight: 1920,
      previewWidth: 390,
      previewHeight: 844,
      fit: 'cover',
      position: 'center',
    });

    // Scale is driven by height: 844 / 1920 = 0.439583...
    // Visible width in source pixels = 390 / (844/1920) = 887.2037...
    expect(rect.sh).toBe(1920);
    expect(rect.sy).toBe(0);
    expect(rect.sw).toBe(887);
    expect(rect.sx).toBe(96); // (1080 - 887) / 2 = 96.5 -> 96

    // Output canvas dimensions match the cropped source pixels
    expect(rect.dw).toBe(887);
    expect(rect.dh).toBe(1920);

    // Aspect ratio of output matches the preview window within 0.1%
    const previewAspect = 390 / 844;
    const outputAspect = rect.dw / rect.dh;
    expect(Math.abs(previewAspect - outputAspect)).toBeLessThan(0.002);
  });

  it('correctly calculates centered crop for standard 4:3 (1440x1920) stream on mobile viewport', () => {
    const rect = getVisibleCameraSourceRect({
      sourceWidth: 1440,
      sourceHeight: 1920,
      previewWidth: 360,
      previewHeight: 800,
      fit: 'cover',
      position: 'center',
    });

    // 800 / 1920 = 0.41666...
    // Visible width = 360 / 0.41666... = 864
    expect(rect.sw).toBe(864);
    expect(rect.sh).toBe(1920);
    expect(rect.sx).toBe((1440 - 864) / 2); // 288 px cropped from each side
    expect(rect.sy).toBe(0);
  });

  it('handles wide desktop or landscape preview with height cropped', () => {
    // 1920x1080 landscape video on ultra-wide container 1000x300
    const rect = getVisibleCameraSourceRect({
      sourceWidth: 1920,
      sourceHeight: 1080,
      previewWidth: 1000,
      previewHeight: 300,
      fit: 'cover',
      position: 'center',
    });

    // Scale is driven by width: 1000 / 1920 = 0.52083...
    // Visible height in source = 300 / 0.52083 = 576
    expect(rect.sw).toBe(1920);
    expect(rect.sx).toBe(0);
    expect(rect.sh).toBe(576);
    expect(rect.sy).toBe((1080 - 576) / 2); // 252
  });

  it('preserves full uncropped frame under fit: contain', () => {
    const rect = getVisibleCameraSourceRect({
      sourceWidth: 1280,
      sourceHeight: 720,
      previewWidth: 390,
      previewHeight: 844,
      fit: 'contain',
    });

    expect(rect.sx).toBe(0);
    expect(rect.sy).toBe(0);
    expect(rect.sw).toBe(1280);
    expect(rect.sh).toBe(720);
  });

  it('verifies asymmetric coordinate isolation: side-margin objects are strictly excluded from capture', () => {
    // 1080x1920 sensor in 390x844 viewport: sx=96, sw=887.
    // Left margin: 0..95. Visible: 96..982. Right margin: 983..1079.
    const rect = getVisibleCameraSourceRect({
      sourceWidth: 1080,
      sourceHeight: 1920,
      previewWidth: 390,
      previewHeight: 844,
      fit: 'cover',
    });

    const isInsideCapture = (x, y) => {
      return (
        x >= rect.sx &&
        x < rect.sx + rect.sw &&
        y >= rect.sy &&
        y < rect.sy + rect.sh
      );
    };

    // Asymmetric feature points
    const leftMarginPoint = { x: 30, y: 960 }; // Object in left side margin (not seen in preview)
    const rightMarginPoint = { x: 1020, y: 960 }; // Object in right side margin (not seen in preview)
    const centerPoint = { x: 540, y: 960 }; // Centered rice leaf
    const visibleLeftLeaf = { x: 120, y: 960 }; // Leaf edge barely visible in preview
    const visibleRightLeaf = { x: 950, y: 960 }; // Leaf edge barely visible in preview

    expect(isInsideCapture(leftMarginPoint.x, leftMarginPoint.y)).toBe(false);
    expect(isInsideCapture(rightMarginPoint.x, rightMarginPoint.y)).toBe(false);
    expect(isInsideCapture(centerPoint.x, centerPoint.y)).toBe(true);
    expect(isInsideCapture(visibleLeftLeaf.x, visibleLeftLeaf.y)).toBe(true);
    expect(isInsideCapture(visibleRightLeaf.x, visibleRightLeaf.y)).toBe(true);
  });

  it('handles invalid or zero dimensions gracefully without crashing', () => {
    const rect1 = getVisibleCameraSourceRect({
      sourceWidth: 0,
      sourceHeight: 0,
      previewWidth: 390,
      previewHeight: 844,
    });
    expect(rect1.sw).toBeGreaterThan(0);
    expect(rect1.sh).toBeGreaterThan(0);
    expect(Number.isNaN(rect1.sx)).toBe(false);

    const rect2 = getVisibleCameraSourceRect(null);
    expect(rect2.sw).toBe(1280);
    expect(rect2.sh).toBe(720);
  });
});

describe('F1 Camera Framing Geometry - captureVisibleFrameToCanvas', () => {
  it('creates canvas with calculated crop dimensions and invokes drawImage with exact crop offsets', () => {
    const drawImageMock = vi.fn();
    const mockContext = {
      drawImage: drawImageMock,
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
    };

    const prevDoc = globalThis.document;
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };

    try {
      const mockVideo = {
        videoWidth: 1080,
        videoHeight: 1920,
        clientWidth: 390,
        clientHeight: 844,
      };

      const result = captureVisibleFrameToCanvas(mockVideo, mockVideo);

      expect(result).toBe(mockCanvas);
      expect(mockCanvas.width).toBe(887);
      expect(mockCanvas.height).toBe(1920);

      // Verify exact drawImage parameters: (video, sx, sy, sw, sh, dx, dy, dw, dh)
      expect(drawImageMock).toHaveBeenCalledWith(
        mockVideo,
        96,  // sx
        0,   // sy
        887, // sw
        1920,// sh
        0,   // dx
        0,   // dy
        887, // dw
        1920 // dh
      );
    } finally {
      globalThis.document = prevDoc;
    }
  });
});
