import { ApiError, json, readJson, requireDb } from '../../../../server/http.js';
import { verifyDevice } from '../../../../server/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const { id, device_id, model_version, predicted_class, reported_class, band, probs, comment, image_id, upazila_code } = body;

  if (!UUID_RE.test(id || '')) throw new ApiError(422, 'invalid_id', 'Feedback id must be a UUID');
  if (!UUID_RE.test(device_id || '')) throw new ApiError(422, 'invalid_device_id', 'Device id must be a UUID');
  if (!model_version) throw new ApiError(422, 'missing_model_version', 'model_version is required');
  if (model_version !== 'v10') throw new ApiError(422, 'invalid_model_version', 'Unsupported model version');
  if (!['healthy','blast','brown_spot','leaf_smut','tungro','sheath_blight','other_rice','not_rice','unknown'].includes(reported_class)) {
    throw new ApiError(422, 'invalid_reported_class', 'Invalid reported class');
  }
  if (band && !['high','medium','not_sure'].includes(band)) {
    throw new ApiError(422, 'invalid_band', 'Invalid band value');
  }
  if (probs && (typeof probs !== 'object' || probs.length !== 8 || !probs.every(p => typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 1))) {
    throw new ApiError(422, 'invalid_probs', 'probs must be an array of 8 numbers between 0 and 1');
  }
  const trimmedComment = (comment || '').trim();
  if (trimmedComment.length > 500) throw new ApiError(422, 'comment_too_long', 'Comment must be at most 500 characters');

  // Idempotency: same device, same id -> 200
  const db = requireDb(env);
  const existing = await db.prepare('SELECT id, status, reviewed_class FROM feedback WHERE id = ?').bind(id).first();
  if (existing) {
    if (existing.device_id !== device_id) throw new ApiError(409, 'id_conflict', 'Same feedback id registered by a different device');
    return json({ id, status: existing.status, reviewed_class: existing.reviewed_class }, 200);
  }

  // Rate limit: 20 per device per UTC day
  const now = new Date().toISOString();
  const since = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().replace(/T.*$/, 'T00:00:00.000Z');
  const count = await db.prepare('SELECT COUNT(*) AS c FROM feedback WHERE device_id = ? AND created_at >= ?').bind(device_id, since).first();
  if ((count?.c || 0) >= 20) throw new ApiError(429, 'rate_limit', 'Maximum 20 feedback per device per day');

  const result = await db.prepare('INSERT INTO feedback (id, device_id, model_version, predicted_class, reported_class, band, probs, comment, image_id, upazila_code, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, device_id, model_version, predicted_class || null, reported_class, band || null, probs || [], trimmedComment || null, image_id || null, upazila_code || null, now, 'new');

  return json({ id, status: 'new' }, 201);
}