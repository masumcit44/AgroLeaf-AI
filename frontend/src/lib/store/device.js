// Anonymous device identity: no name, phone or password. The secret never leaves the phone.
// Requests are signed with a key derived from it (SHA-256 of the secret); that derived key is
// registered once and is what the server stores and verifies with. A server-side leak would let
// someone sign as that device (low value: no personal data is attached), but not learn the secret.
import { getDb, STORES, newId } from './db.js';

function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The device record, created on first use. */
export async function getOrCreateDevice() {
  const db = await getDb();
  const existing = await db.get(STORES.DEVICE, 'self');
  if (existing) return existing;
  const device = {
    device_id: newId(),
    device_secret: toBase64(crypto.getRandomValues(new Uint8Array(32))),
    created_at: new Date().toISOString(),
  };
  await db.put(STORES.DEVICE, device, 'self');
  return device;
}

/** The signing key registered with the server (POST /api/v1/devices {device_id, signing_key}). */
export async function signingKey(device) {
  return sha256Hex(device.device_secret);
}

/** HMAC-SHA256 over METHOD\npath\nsha256(body)\ntimestamp, base64. Shared by client and server. */
export async function hmacSign(keyHex, method, path, bodySha256Hex, timestamp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyHex),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = `${method.toUpperCase()}\n${path}\n${bodySha256Hex}\n${timestamp}`;
  return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))));
}

/** Headers that authenticate one API request. */
export async function signRequest(device, method, path, body = '', timestamp = new Date().toISOString()) {
  return {
    'X-Device-Id': device.device_id,
    'X-Timestamp': timestamp,
    'X-Device-Signature': await hmacSign(await signingKey(device), method, path, await sha256Hex(body), timestamp),
  };
}
