import { getOrCreateDevice, signingKey } from '../../lib/store/device.js';
import { enqueue, flushOutbox } from '../../lib/store/outbox.js';
import { newId } from '../../lib/store/db.js';

const CLASS_KEYS = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
  'other_rice',
  'not_rice',
  'unknown',
];

const MAX_COMMENT = 500;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MODEL_VERSION = 'v10';

const API = '/api/v1';

function imageSigningBody(phash, token, bytes) {
  const prefix = new TextEncoder().encode(`${phash}\n${token || ''}\n`);
  const out = new Uint8Array(prefix.length + bytes.length);
  out.set(prefix, 0);
  out.set(bytes, prefix.length);
  return out;
}

export function getTurnstileToken() {
  if (typeof window === 'undefined') return null;
  try {
    if (window.turnstile?.getResponse) {
      const widget = document.querySelector?.('.cf-turnstile');
      if (widget) return window.turnstile.getResponse(widget) || null;
    }
    if (typeof window.__TURNSTILE_TOKEN__ === 'string') return window.__TURNSTILE_TOKEN__;
  } catch (_) {}
  return null;
}

export function deriveBand(scan) {
  if (scan?.band && ['high', 'medium', 'not_sure'].includes(scan.band)) return scan.band;
  if (!scan?.isConfident || scan?.decision?.status !== 'confident') return 'not_sure';
  return 'high';
}

export function buildFeedbackPayload(scan, {
  reportedClass = null,
  comment = '',
  includePhoto = false,
  photo = null,
  phash = null,
  id = newId(),
} = {}) {
  const key = reportedClass || 'unknown';
  if (!CLASS_KEYS.includes(key)) throw new Error('invalid_reported_class');

  const probs = CLASS_KEYS.map((k) => {
    const v = Number(scan?.probs?.[k]);
    return Number.isFinite(v) ? v : 0;
  });

  const predictedClass = CLASS_KEYS.includes(scan?.classKey) ? scan.classKey : 'unknown';
  const text = String(comment || '').trim();
  if (text.length > MAX_COMMENT) throw new Error('comment_too_long');

  const payload = {
    device_id: scan?.deviceId,
    model_version: MODEL_VERSION,
    predicted_class: predictedClass,
    reported_class: key,
    band: deriveBand(scan),
    probs,
    comment: text || null,
    image_id: null,
    upazila_code: null,
  };

  if (includePhoto && photo && phash) {
    payload.photo = photo;
    payload.phash = phash;
  }
  return { id, payload };
}

export function feedbackRequestBody(payload) {
  const { photo, phash, ...rest } = payload;
  return rest;
}

export async function ensureDeviceRegistered() {
  const device = await getOrCreateDevice();
  const key = await signingKey(device);
  const token = getTurnstileToken();
  const body = JSON.stringify({ device_id: device.device_id, signing_key: key, ...(token ? { turnstile_token: token } : {}) });
  const res = await fetch(`${API}/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (res.status === 200 || res.status === 201) return device;
  const data = await res.json().catch(() => ({}));
  throw new Error(`${res.status}: ${data?.error?.code || 'register_failed'}`);
}

export async function sendFeedbackItem(item) {
  if (item?.kind !== 'feedback') return 'retry';
  let device;
  try { device = await ensureDeviceRegistered(); }
  catch { return 'retry'; }

  const payload = item.payload || {};

  // Optional photo upload before feedback
  if (payload.photo && !payload.image_id) {
    const phash = String(payload.phash || '');
    const token = getTurnstileToken() || '';
    let bytes;
    try { bytes = new Uint8Array(await payload.photo.arrayBuffer()); } catch { return 'retry'; }
    const canonical = imageSigningBody(phash, token, bytes);
    const sigBuf = await crypto.subtle.sign('SHA-256', new TextEncoder().encode(`${phash}\n${token || ''}\n` + bytes), new TextEncoder().encode(''));
    const sig = new TextEncoder().encode('') // dummy, actual signature bytes used as-is; we just need the Buffer
    // The signature is raw bytes; we'll encode as base64 string for header
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    const headers = { 'X-Device-Id': device.device_id, 'X-Timestamp': new Date().toISOString(), 'X-Device-Signature': sigB64 };
    const form = new FormData();
    form.append('file', payload.photo, 'photo.jpg');
    form.append('phash', phash);
    if (token) form.append('turnstile_token', token);
    let res;
    try { res = await fetch(`${API}/images`, { method: 'POST', body: form, headers }); } catch { return 'retry'; }
    if (res.status === 201) {
      const data = await res.json().catch(() => ({}));
      if (data?.image_id) payload.image_id = data.image_id;
    }
    if ([400, 413, 422].includes(res.status)) {
      delete payload.photo; delete payload.phash;
    } else if (res.status !== 200 && res.status !== 201) {
      return 'retry';
    }
  }

  // POST feedback JSON
  const body = feedbackRequestBody(payload);
  const text = JSON.stringify(body);
  let sigHeaders;
  try {
    const sig = await new Promise((resolve, reject) => {
      crypto.subtle.sign('SHA-256', new TextEncoder().encode(text), new TextEncoder().encode('')).then(resolve).catch(reject);
    });
    sigHeaders = { 'X-Device-Id': device.device_id, 'X-Timestamp': new Date().toISOString(), 'X-Device-Signature': sig };
  } catch { return 'retry'; }
  let res;
  try { res = await fetch(`${API}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...sigHeaders }, body: text }); } catch { return 'retry'; }
  if (res.status === 200 || res.status === 201) return 'sent';
  if (res.status === 401 || res.status === 429 || res.status >= 500) return 'retry';
  return 'reject';
}

export async function submitFeedback(payload) {
  const item = await enqueue('feedback', payload);
  let outcome = null;
  await flushOutbox(async (queued) => {
    const result = await sendFeedbackItem(queued);
    if (queued.id === item.id) outcome = result;
    return result;
  });
  return { item, outcome };
}

export async function flushFeedbackOutbox(onOutcome) {
  return flushOutbox(async (item) => {
    const outcome = await sendFeedbackItem(item);
    if (onOutcome) onOutcome(item, outcome);
    return outcome;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('jpeg_failed'))), 'image/jpeg', quality);
  });
}

export async function preparePhoto(sourceCanvas) {
  if (!sourceCanvas) throw new Error('photo_unavailable');
  if (typeof document === 'undefined') throw new Error('photo_unavailable');
  const w0 = Number(sourceCanvas.width) || 0;
  const h0 = Number(sourceCanvas.height) || 0;
  if (!w0 || !h0) throw new Error('photo_unavailable');
  const maxSide = 1024;
  const sizes = [maxSide, 800, 640, 480];
  const qualities = [0.85, 0.7, 0.55];
  for (const side of sizes) {
    const scale = Math.min(1, side / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(sourceCanvas, 0, 0, w, h);
    for (const quality of qualities) {
      try {
        const blob = await canvasToBlob(canvas, quality);
        if (blob && blob.size <= MAX_IMAGE_BYTES) {
          return { photo: blob, phash: perceptualHash(canvas) };
        }
      } catch (_) {}
    }
  }
  throw new Error('photo_too_large');
}

function perceptualHash(canvasEl) {
  const size = 8;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '0'.repeat(16);
  ctx.drawImage(canvasEl, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4; j += 1) nibble = (nibble << 1) | (gray[i + j] >= avg ? 1 : 0);
    hex += nibble.toString(16);
  }
  return hex;
}