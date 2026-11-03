import { json, requireDb, UUID_RE } from '../../../../server/http.js';

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  const deviceId = request.headers.get('X-Device-Id') || '';
  if (!UUID_RE.test(deviceId)) throw new ApiError(400, 'invalid_device_id', 'Invalid device ID');

  const rows = await db.prepare('SELECT id, status, reviewed_class FROM feedback WHERE device_id = ? ORDER BY created_at DESC').bind(deviceId).all();
  return json(rows.results || []);
}