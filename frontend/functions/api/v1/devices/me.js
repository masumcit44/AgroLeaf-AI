// DELETE /api/v1/devices/me: "delete my data" on the server. Rows go by ON DELETE CASCADE;
// photos in R2 are removed first. Anonymous area reports carry no device id and are kept.
import { json, requireDb } from '../../../../server/http.js';
import { verifyDevice } from '../../../../server/auth.js';

export async function onRequestDelete({ request, env }) {
  const device = await verifyDevice(request, env, await request.text());
  const db = requireDb(env);
  const { results = [] } = await db.prepare('SELECT r2_key FROM images WHERE device_id = ?').bind(device.id).all();
  if (env.IMAGES && results.length) await env.IMAGES.delete(results.map((r) => r.r2_key));
  await db.prepare('DELETE FROM devices WHERE id = ?').bind(device.id).run();
  return new Response(null, { status: 204 });
}
