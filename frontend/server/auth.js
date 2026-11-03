// Device authentication and bot protection for /api/v1 (DATABASE_API_DESIGN.md §3–4).
import { ApiError, requireDb } from './http.js';
import { hmacSign, sha256Hex, safeEqual } from '../src/lib/store/signing.js';

export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Checks X-Device-Id / X-Timestamp / X-Device-Signature against the registered signing key.
 * `bodyText` must be the exact request body. Returns the device row.
 */
export async function verifyDevice(request, env, bodyText, now = Date.now()) {
  const id = request.headers.get('X-Device-Id');
  const ts = request.headers.get('X-Timestamp');
  const sig = request.headers.get('X-Device-Signature');
  if (!id || !ts || !sig) throw new ApiError(401, 'unauthenticated', 'Missing device headers');
  const t = Date.parse(ts);
  if (!Number.isFinite(t) || Math.abs(now - t) > MAX_CLOCK_SKEW_MS) throw new ApiError(401, 'stale_request', 'Timestamp outside ±5 minutes');
  const db = requireDb(env);
  const device = await db.prepare('SELECT id, signing_key, blocked FROM devices WHERE id = ?').bind(id).first();
  if (!device) throw new ApiError(401, 'unknown_device', 'Device is not registered');
  const path = new URL(request.url).pathname;
  const expected = await hmacSign(device.signing_key, request.method, path, await sha256Hex(bodyText || ''), ts);
  if (!safeEqual(expected, sig)) throw new ApiError(401, 'bad_signature', 'Signature does not match');
  if (device.blocked) throw new ApiError(403, 'blocked', 'Device is blocked');
  await db.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?').bind(new Date(now).toISOString(), id).run();
  return device;
}

/** Cloudflare Turnstile server-side check. Refuses (503) when the secret is not configured. */
export async function verifyTurnstile(token, env, remoteIp, fetchImpl = fetch) {
  if (!env?.TURNSTILE_SECRET) throw new ApiError(503, 'turnstile_not_configured', 'Bot protection is not set up yet');
  if (!token) throw new ApiError(400, 'turnstile_missing', 'Turnstile token required');
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);
  const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const out = await res.json().catch(() => ({}));
  if (!out.success) throw new ApiError(403, 'turnstile_failed', 'Bot check failed');
}

/** Number of rows a device created in `table` since an ISO time (simple per-day rate limits). */
export async function countSince(db, table, deviceId, sinceIso) {
  const allowed = new Set(['feedback', 'help_requests', 'images']);
  if (!allowed.has(table)) throw new Error(`countSince: table ${table} not allowed`);
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE device_id = ? AND created_at >= ?`).bind(deviceId, sinceIso).first();
  return row?.n ?? 0;
}
