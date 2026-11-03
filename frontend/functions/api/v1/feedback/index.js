import { ApiError, json, readJson, requireDb, UUID_RE } from '../../../../server/http.js';
import { verifyDevice } from '../../../../server/auth.js';

const VALID_CLASSES = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
  'other_rice',
  'not_rice',
];

export async function onRequestPost({ request, env }) {
  // Verify device signature first
  const device = await verifyDevice(request, env, await request.text());
  const db = requireDb(env);

  const body = await readJson(request);
  const {
    id,
    device_id,
    model_version,
    predicted_class,
    reported_class,
    band,
    probs,
    comment,
    image_id,
    upazila_code,
  } = body;

  // --- UUID validation -------------------------------------------------
  if (!UUID_RE.test(id || ''))
    throw new ApiError(422, 'invalid_id', 'Feedback id must be a UUID');
  if (!UUID_RE.test(device_id || ''))
    throw new ApiError(422, 'invalid_device_id', 'Device id must be a UUID');

  // --- model_version ---------------------------------------------------
  if (!model_version) throw new ApiError(422, 'missing_model_version', 'model_version is required');
  if (model_version !== 'v10') throw new ApiError(422, 'invalid_model_version', 'Unsupported model version');

  // --- predicted_class (NOT NULL, valid class) -----------------------
  if (!predicted_class) throw new ApiError(422, 'missing_predicted_class', 'predicted_class is required');
  if (!VALID_CLASSES.includes(predicted_class))
    throw new ApiError(422, 'invalid_predicted_class', 'Invalid predicted class');

  // --- reported_class (valid class) ----------------------------------
  if (!['healthy','blast','brown_spot','leaf_smut','tungro','sheath_blight','other_rice','not_rice','unknown'].includes(reported_class))
    throw new ApiError(422, 'invalid_reported_class', 'Invalid reported class');

  // --- band (NOT NULL, one of high|medium|not_sure) -----------------
  if (!band) throw new ApiError(422, 'missing_band', 'band is required');
  if (!['high','medium','not_sure'].includes(band))
    throw new ApiError(422, 'invalid_band', 'band must be high|medium|not_sure');

  // --- probs (Array, length 8, each 0..1) ---------------------------
  if (!Array.isArray(probs) || probs.length !== 8 || !probs.every(p => typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 1))
    throw new ApiError(422, 'invalid_probs', 'probs must be an array of 8 numbers between 0 and 1');

  // --- comment (max 500 chars) --------------------------------------
  const trimmedComment = (comment || '').trim();
  if (trimmedComment.length > 500) throw new ApiError(422, 'comment_too_long', 'Comment must be at most 500 characters');

  // --- Idempotency: same id + same device -> 200 with stored row -----
  const existing = await db.prepare('SELECT id, status, reviewed_class FROM feedback WHERE id = ?').bind(id).first();
  if (existing) {
    if (existing.device_id !== device_id)
      throw new ApiError(409, 'id_conflict', 'Same feedback id registered by a different device');
    return json({ id, status: existing.status, reviewed_class: existing.reviewed_class }, 200);
  }

  // --- Rate limit: 20 per device per UTC day -------------------------
  const utcStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
  const count = await db.prepare('SELECT COUNT(*) AS c FROM feedback WHERE device_id = ? AND created_at >= ?').bind(device_id, utcStart).first();
  if ((count?.c || 0) >= 20) throw new ApiError(429, 'rate_limit', 'Maximum 20 feedback per device per day');

  // --- Insert new row ------------------------------------------------
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO feedback (id, device_id, probs_json, predicted_class, band, comment, image_id, upazila_code, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, device_id, JSON.stringify(probs), predicted_class, band, trimmedComment || null, image_id || null, upazila_code || null, now, 'new');

  return json({ id, status: 'new' }, 201);
}