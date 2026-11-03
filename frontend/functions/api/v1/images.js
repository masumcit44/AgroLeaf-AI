import { ApiError, requireDb, UUID_RE } from '../../../../server/http.js';

export async function onRequestPost({ request, env }) {
  const data = await request.formData();
  const file = data.get('file');
  const phash = data.get('phash') || '';
  const turnstileToken = data.get('turnstile_token') || '';

  if (!file) throw new ApiError(400, 'missing_file', 'No file provided');

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new ApiError(413, 'image_too_large', 'Image exceeds 1 MB');
  const u8 = new Uint8Array(bytes);
  const magic = u8[0] << 16 | u8[1] << 8 | u8[2];
  if (magic !== 0xffd8ff) throw new ApiError(400, 'invalid_image', 'File is not a valid JPEG');

  if (!env.IMAGES) throw new ApiError(503, 'storage_not_configured', 'R2 images storage not configured');

  const deviceId = request.headers.get('X-Device-Id') || '';
  const timestamp = request.headers.get('X-Timestamp') || '';
  const signature = request.headers.get('X-Device-Signature') || '';

  if (!UUID_RE.test(deviceId)) throw new ApiError(400, 'invalid_device_id', 'Invalid device ID');

  const canonical = `${phash}\n${turnstileToken || ''}\n${bytes}`;
  const verified = await verifyDevice(request, env, canonical, now);
  if (verified instanceof ApiError) return verified;

  const db = requireDb(env);
  const existing = await db.prepare('SELECT id FROM images WHERE device_id = ? AND phash = ?').bind(deviceId, phash).first();
  if (existing) throw new ApiError(409, 'duplicate_image', 'This photo was already sent', { image_id: existing.id });

  const key = crypto.randomUUID() + '.jpg';
  const r2Path = `images/${key}`;
  try {
    await env.IMAGES.put(r2Path, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
    await db.prepare('INSERT INTO images (device_id, phash, image_id, path, delete_after) VALUES (?, ?, ?, ?, datetime("now", "+180 days"))')
      .bind(deviceId, phash, key, r2Path).run();
    return json({ image_id: key }, 201);
  } catch (e) {
    await env.IMAGES.delete(r2Path).catch(() => {});
    throw e;
  }
}

const MAX_IMAGE_BYTES = 1024 * 1024;