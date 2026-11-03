// POST /api/v1/area-reports
// Body: { id: uuid, district_code, iso_week, class, band, model_version }
// Signed by verifyDevice.
// Idempotent: same report → 200; new → 201; max 10 per device per day → 429.
// Missing HASH_SALT → 503 hash_salt_not_configured.
// Band must be 'high' → 422 invalid_band.
// Bad district/week/class → 422.

import { verifyDevice } from '../../../../server/auth.js';
import { ApiError, requireDb, readJson, json, UUID_RE } from '../../../../server/http.js';

export const ALLOWED_CLASSES = ['blast', 'brown_spot', 'sheath_blight', 'tungro', 'healthy'];
export const VALID_DISTRICT_CODES = new Set(Array.from({ length: 64 }, (_, i) => String(i + 1)));
export const ISO_WEEK_RE = /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/;

export function getIsoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function computeDeviceHash(saltHex, deviceId) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(saltHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(deviceId));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = requireDb(env);

  // 1. Read body text & verify signature
  const { text, body } = await readJson(request);
  const device = await verifyDevice(request, env, text);

  // 2. Validate HASH_SALT configured
  if (!env?.HASH_SALT) {
    throw new ApiError(503, 'hash_salt_not_configured', 'Area reporting salt is not configured');
  }

  // 3. Validate fields
  const { id, district_code, iso_week, class: classKey, band, model_version } = body;

  if (!id || (typeof id === 'string' && !UUID_RE.test(id) && id.length < 8)) {
    throw new ApiError(422, 'invalid_id', 'Valid report ID required');
  }

  const dcStr = String(district_code ?? '');
  if (!VALID_DISTRICT_CODES.has(dcStr)) {
    throw new ApiError(422, 'invalid_district', 'Invalid district code (1-64)');
  }

  if (!classKey || !ALLOWED_CLASSES.includes(classKey)) {
    throw new ApiError(422, 'invalid_class', `Class must be one of: ${ALLOWED_CLASSES.join(', ')}`);
  }

  if (band !== 'high') {
    throw new ApiError(422, 'invalid_band', 'Only high reliability band reports are accepted');
  }

  if (!iso_week || !ISO_WEEK_RE.test(iso_week)) {
    throw new ApiError(422, 'invalid_iso_week', 'ISO week format must be YYYY-Www');
  }

  // Week cannot be in the future
  const now = new Date();
  const currentWeek = getIsoWeek(now);
  if (iso_week > currentWeek) {
    throw new ApiError(422, 'future_week', 'Report week cannot be in the future');
  }

  // 4. Compute device_hash = HMAC-SHA256(device_id, env.HASH_SALT)
  const deviceHash = await computeDeviceHash(env.HASH_SALT, device.id);

  // 5. Check idempotency: same report ID or duplicate submission for same device/district/week/class
  const existing = await db.prepare(
    'SELECT id FROM area_reports WHERE id = ? OR (device_hash = ? AND district_code = ? AND iso_week = ? AND class = ?) LIMIT 1'
  ).bind(id, deviceHash, dcStr, iso_week, classKey).first();

  if (existing) {
    return json({ status: 'accepted', duplicate: true }, 200);
  }

  // 6. Check rate limit: max 10 reports per device per day
  const todayUtc = now.toISOString().slice(0, 10) + 'T00:00:00.000Z';
  const countRow = await db.prepare(
    'SELECT COUNT(*) AS n FROM area_reports WHERE device_hash = ? AND created_at >= ?'
  ).bind(deviceHash, todayUtc).first();

  if ((countRow?.n ?? 0) >= 10) {
    throw new ApiError(429, 'rate_limited', 'Maximum 10 area reports per device per day');
  }

  // 7. Insert report
  const createdAt = now.toISOString();
  await db.prepare(
    `INSERT INTO area_reports (id, device_hash, district_code, iso_week, class, band, model_version, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(id, deviceHash, dcStr, iso_week, classKey, band, String(model_version || 'v10'), createdAt).run();

  return json({ status: 'accepted', duplicate: false }, 201);
}
