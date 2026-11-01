const MAX_DIMENSION = 1024;

/**
 * Decode and orient an image file in memory, downscaling to a maximum of 1024px
 * on the longest dimension while preserving aspect ratio.
 *
 * @param {File|Blob} file
 * @returns {Promise<{ canvas: HTMLCanvasElement|OffscreenCanvas, width: number, height: number }>}
 */
export async function decodeImage(file) {
  let sourceWidth = 0;
  let sourceHeight = 0;
  let sourceDrawable = null;
  let objectUrlToRevoke = null;

  try {
    // 1. Attempt modern createImageBitmap with EXIF orientation
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      try {
        sourceDrawable = await createImageBitmap(file, { imageOrientation: 'from-image' });
        sourceWidth = sourceDrawable.width;
        sourceHeight = sourceDrawable.height;
      } catch {
        // Fall back to Image element if createImageBitmap options fail
        sourceDrawable = null;
      }
    }

    // 2. Fallback using HTMLImageElement and ObjectURL
    if (!sourceDrawable) {
      objectUrlToRevoke = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrlToRevoke;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image into DOM element'));
      });
      sourceDrawable = img;
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
    }

    if (!sourceWidth || !sourceHeight) {
      throw new Error('Invalid image dimensions');
    }

    // Compute downscaled dimensions (max 1024px on long side)
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;
    const maxSide = Math.max(sourceWidth, sourceHeight);

    if (maxSide > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxSide;
      targetWidth = Math.round(sourceWidth * scale);
      targetHeight = Math.round(sourceHeight * scale);
    }

    // Render to Canvas
    let canvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(targetWidth, targetHeight);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Transparent pixels become white, not black (PIL's convert("RGB") keeps
    // the colour under the alpha; white is the closer match for cut-out leaves)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceDrawable, 0, 0, targetWidth, targetHeight);

    // Close ImageBitmap if supported
    if (sourceDrawable && typeof sourceDrawable.close === 'function') {
      sourceDrawable.close();
    }

    return {
      canvas,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    if (objectUrlToRevoke) {
      URL.revokeObjectURL(objectUrlToRevoke);
    }
  }
}
