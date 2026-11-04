// Authoritative camera preview-to-capture framing geometry utility
// Solves preview-to-capture mismatch by calculating the exact visible source rectangle
// under CSS object-fit: cover and object-fit: contain.
// Zero pixel distortion, zero side leakage, native sensor resolution preserved.

/**
 * Calculates the exact source crop rectangle corresponding to what is visible
 * in the camera preview element.
 *
 * @param {Object} params
 * @param {number} params.sourceWidth - Intrinsic video width (video.videoWidth)
 * @param {number} params.sourceHeight - Intrinsic video height (video.videoHeight)
 * @param {number} params.previewWidth - Rendered preview display width (e.g. clientWidth)
 * @param {number} params.previewHeight - Rendered preview display height (e.g. clientHeight)
 * @param {'cover'|'contain'} [params.fit='cover'] - CSS object-fit mode
 * @param {'center'} [params.position='center'] - CSS object-position mode
 * @returns {Object} { sx, sy, sw, sh, dw, dh, scale, aspectRatio }
 */
export function getVisibleCameraSourceRect(params = {}) {
  const p = params || {};
  const sw_raw = Number(p.sourceWidth) || 0;
  const sh_raw = Number(p.sourceHeight) || 0;
  const pw_raw = Number(p.previewWidth) || 0;
  const ph_raw = Number(p.previewHeight) || 0;
  const fit = p.fit || 'cover';
  const position = p.position || 'center';

  // Fallback to full source if preview dimensions are invalid or not yet measured
  if (sw_raw <= 0 || sh_raw <= 0 || pw_raw <= 0 || ph_raw <= 0) {
    const defaultW = sw_raw > 0 ? sw_raw : 1280;
    const defaultH = sh_raw > 0 ? sh_raw : 720;
    return {
      sx: 0,
      sy: 0,
      sw: defaultW,
      sh: defaultH,
      dw: defaultW,
      dh: defaultH,
      scale: 1,
      aspectRatio: defaultW / defaultH,
    };
  }

  if (fit === 'contain') {
    // Under contain, the whole source is visible inside letterbox bars
    return {
      sx: 0,
      sy: 0,
      sw: sw_raw,
      sh: sh_raw,
      dw: sw_raw,
      dh: sh_raw,
      scale: Math.min(pw_raw / sw_raw, ph_raw / sh_raw),
      aspectRatio: sw_raw / sh_raw,
    };
  }

  // Under 'cover': Video is scaled to fill the entire preview container
  const scale = Math.max(pw_raw / sw_raw, ph_raw / sh_raw);
  const visibleSourceW = pw_raw / scale;
  const visibleSourceH = ph_raw / scale;

  // Calculate centered crop offsets
  let sx = 0;
  let sy = 0;

  if (position === 'center') {
    sx = Math.max(0, (sw_raw - visibleSourceW) / 2);
    sy = Math.max(0, (sh_raw - visibleSourceH) / 2);
  }

  // Round coordinates to integer pixel boundaries
  const roundSx = Math.round(sx);
  const roundSy = Math.round(sy);
  const roundSw = Math.min(sw_raw - roundSx, Math.round(visibleSourceW));
  const roundSh = Math.min(sh_raw - roundSy, Math.round(visibleSourceH));

  return {
    sx: roundSx,
    sy: roundSy,
    sw: roundSw,
    sh: roundSh,
    dw: roundSw,
    dh: roundSh,
    scale,
    aspectRatio: roundSw / roundSh,
  };
}

/**
 * Captures the exact visible camera frame onto a cleanly sized HTMLCanvasElement.
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLElement|{clientWidth: number, clientHeight: number}} [previewContainer]
 * @param {Object} [options]
 * @param {'cover'|'contain'} [options.fit='cover']
 * @returns {HTMLCanvasElement|null} Clean canvas containing strictly visible preview pixels
 */
export function captureVisibleFrameToCanvas(videoElement, previewContainer = null, options = {}) {
  if (!videoElement || typeof document === 'undefined') return null;

  const sourceWidth = videoElement.videoWidth || 1280;
  const sourceHeight = videoElement.videoHeight || 720;

  const container = previewContainer || videoElement;
  const previewWidth = container.clientWidth || container.offsetWidth || window?.innerWidth || sourceWidth;
  const previewHeight = container.clientHeight || container.offsetHeight || window?.innerHeight || sourceHeight;

  const rect = getVisibleCameraSourceRect({
    sourceWidth,
    sourceHeight,
    previewWidth,
    previewHeight,
    fit: options.fit || 'cover',
    position: options.position || 'center',
  });

  const canvas = document.createElement('canvas');
  canvas.width = rect.dw;
  canvas.height = rect.dh;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Exact crop: Draw only the visible portion of the video frame
  ctx.drawImage(
    videoElement,
    rect.sx,
    rect.sy,
    rect.sw,
    rect.sh,
    0,
    0,
    rect.dw,
    rect.dh
  );

  return canvas;
}
