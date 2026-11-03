import { ApiError, json, requireDb, UUID_RE, verifyTurnstile } from '../../../../server/http.js';

const MAX_IMAGE_BYTES = 1024 * 1024;

export async function onRequestPost({ request, env }) {
  const data = await request.formData();
  const file = data.get('file');
  const phash = data.get('phash') || '';
  const turnstileToken = data.get('turnstile_token') || '';

  if (!file) throw new ApiError(400, 'missing_file', 'No file provided');

  // Validate phash length (16 hex chars)
  if (!/^[0-9a-f]{16}$/.test(phash))
    throw new ApiError(422, 'invalid_phash', 'phash must be 16 hex characters');

  // Verify Turnstile
  const turnstileOk = await verifyTurnstile(turnstileToken, request.headers.get('CF-Connecting-IP'), env);
  if (turnstileOk === false) throw new ApiError(503, 'turnstile_not_configured', 'Turnstile not configured');
  if (turnstileOk === 'missing') throw new ApiError(400, 'turnstile_missing', 'Turnstile token missing');
  if (turnstileOk === 'failed') throw new ApiError(403, 'turnstile_failed', 'Turnstile verification failed');

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new ApiError(413, 'image_too_large', 'Image exceeds 1 MB');

  // Verify JPEG magic
  const u8 = new Uint8Array(bytes);
  const magic = u8[0] << 16 | u8[1] << 8 | u8[2];
  if (magic !== 0xffd8ff) throw new ApiError(400, 'invalid_image', 'File is not a valid JPEG');

  // Verify device signature using canonical bytes: sha256 hex of image bytes
  const deviceId = request.headers.get('X-Device-Id') || '';
  if (!UUID_RE.test(deviceId)) throw new ApiError(400, 'invalid_device_id', 'Invalid device ID');

  // Build canonical string: phash + newline + token + newline + hex of bytes
  const bytesHex = Buffer.from(bytes).toString('hex');
  const canonical = `${phash}\n${turnstileToken || ''}\n${bytesHex}`;

  const verified = await verifyDevice(request, env, canonical);
  if (verified instanceof ApiError) return verified;

  const db = requireDb(env);

  // Check duplicate phash
  const existing = await db.prepare('SELECT id FROM images WHERE device_id = ? AND phash = ?').bind(deviceId, phash).first();
  if (existing) throw new ApiError(409, 'duplicate_image', 'This photo was already sent', { image_id: existing.id });

  // R2 key
  const r2Key = 'images/' + crypto.randomUUID() + '.jpg';

  // Insert image row
  const now = new Date().toISOString();
  const deleteAfter = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // +180 days
  await db.prepare(
    'INSERT INTO images (id, device_id, r2_key, phash, bytes, created_at, delete_after) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(crypto.randomUUID(), deviceId, r2Key, phash, bytes, now, deleteAfter);

  await env.IMAGES.put(r2Key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });

  return json({ image_id: r2Key }, 201);
}