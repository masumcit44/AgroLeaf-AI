// POST /api/v1/devices: register an anonymous device { device_id, signing_key, turnstile_token }.
// Registering the same id with the same key again is a no-op (safe retry from the outbox).
import { ApiError, json, readJson, requireDb, UUID_RE } from '../../../../server/http.js';
import { verifyTurnstile } from '../../../../server/auth.js';

export async function onRequestPost({ request, env }) {
  const { body } = await readJson(request);
  const { device_id: id, signing_key: key, turnstile_token: token } = body;
  if (!UUID_RE.test(id || '') || !/^[0-9a-f]{64}$/.test(key || '')) throw new ApiError(422, 'invalid_device', 'device_id must be a UUID and signing_key 64 hex');
  const db = requireDb(env);
  const existing = await db.prepare('SELECT signing_key FROM devices WHERE id = ?').bind(id).first();
  if (existing) {
    if (existing.signing_key !== key) throw new ApiError(409, 'device_exists', 'Device id already registered with another key');
    return json({ device_id: id }, 200);
  }
  await verifyTurnstile(token, env, request.headers.get('CF-Connecting-IP'));
  const now = new Date().toISOString();
  await db.prepare('INSERT INTO devices (id, signing_key, created_at, last_seen_at) VALUES (?, ?, ?, ?)').bind(id, key, now, now).run();
  return json({ device_id: id }, 201);
}
