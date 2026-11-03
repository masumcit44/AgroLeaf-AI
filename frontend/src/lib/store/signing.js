// Request signing shared by the browser (lib/store/device.js) and the API (functions/): Web Crypto
// only, no other imports, so the same code runs in both places.
export function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA256 over METHOD\npath\nsha256(body)\ntimestamp, base64. */
export async function hmacSign(keyHex, method, path, bodySha256Hex, timestamp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyHex),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = `${method.toUpperCase()}\n${path}\n${bodySha256Hex}\n${timestamp}`;
  return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))));
}

/** Constant-time string comparison (signatures). */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
