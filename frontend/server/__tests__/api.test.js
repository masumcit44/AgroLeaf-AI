import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './d1Fake.js';
import { onRequest as middleware } from '../../functions/api/v1/_middleware.js';
import { onRequestGet as health } from '../../functions/api/v1/health.js';
import { onRequestPost as registerDevice } from '../../functions/api/v1/devices/index.js';
import { onRequestDelete as deleteMe } from '../../functions/api/v1/devices/me.js';
import { verifyDevice, verifyTurnstile, countSince } from '../auth.js';
import { hmacSign, sha256Hex } from '../../src/lib/store/signing.js';

const BASE = 'https://feat.agroleaf-ai.pages.dev';
const DEVICE = '2b7e8c1e-1d2a-4c3b-9a8f-0123456789ab';
const KEY = 'a'.repeat(64);

// Pages wraps handlers in the middleware; reproduce that so errors get the JSON format
const call = (handler, request, env) => middleware({ request, env, next: () => handler({ request, env }) });
const okTurnstile = () => vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: true })));

async function signed(method, path, body, ts = new Date().toISOString(), key = KEY) {
  const sig = await hmacSign(key, method, path, await sha256Hex(body), ts);
  return new Request(BASE + path, { method, body: body || undefined, headers: { 'X-Device-Id': DEVICE, 'X-Timestamp': ts, 'X-Device-Signature': sig } });
}

let env;
beforeEach(() => {
  env = { DB: createTestDb(), TURNSTILE_SECRET: 'test-secret' };
  vi.unstubAllGlobals();
});

describe('health and error format', () => {
  it('health answers without any binding', async () => {
    const res = await call(health, new Request(`${BASE}/api/v1/health`), {});
    expect(await res.json()).toEqual({ ok: true, api: 'v1' });
  });

  it('missing database gives a clear 503, not a crash', async () => {
    const req = new Request(`${BASE}/api/v1/devices`, { method: 'POST', body: JSON.stringify({ device_id: DEVICE, signing_key: KEY }) });
    const res = await call(registerDevice, req, {});
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe('storage_not_configured');
  });

  it('bad JSON and invalid ids are 4xx with a code', async () => {
    let res = await call(registerDevice, new Request(`${BASE}/api/v1/devices`, { method: 'POST', body: '{' }), env);
    expect([res.status, (await res.json()).error.code]).toEqual([400, 'bad_json']);
    res = await call(registerDevice, new Request(`${BASE}/api/v1/devices`, { method: 'POST', body: JSON.stringify({ device_id: 'x', signing_key: KEY }) }), env);
    expect([res.status, (await res.json()).error.code]).toEqual([422, 'invalid_device']);
  });
});

describe('device registration', () => {
  const body = (extra = {}) => JSON.stringify({ device_id: DEVICE, signing_key: KEY, turnstile_token: 'tok', ...extra });
  const post = (b) => new Request(`${BASE}/api/v1/devices`, { method: 'POST', body: b });

  it('registers once (201), a retry with the same key is a no-op (200), another key is refused (409)', async () => {
    okTurnstile();
    expect((await call(registerDevice, post(body()), env)).status).toBe(201);
    expect((await call(registerDevice, post(body()), env)).status).toBe(200);
    expect((await call(registerDevice, post(body({ signing_key: 'b'.repeat(64) })), env)).status).toBe(409);
  });

  it('needs a passing Turnstile check and a configured secret', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: false })));
    expect((await call(registerDevice, post(body()), env)).status).toBe(403);
    const res = await call(registerDevice, post(body()), { DB: env.DB });
    expect((await res.json()).error.code).toBe('turnstile_not_configured');
  });
});

describe('signed requests', () => {
  beforeEach(async () => {
    okTurnstile();
    await call(registerDevice, new Request(`${BASE}/api/v1/devices`, { method: 'POST', body: JSON.stringify({ device_id: DEVICE, signing_key: KEY, turnstile_token: 't' }) }), env);
  });

  it('accepts a correct signature and rejects tampering, staleness and unknown devices', async () => {
    expect((await verifyDevice(await signed('POST', '/api/v1/feedback', '{"a":1}'), env, '{"a":1}')).id).toBe(DEVICE);
    await expect(verifyDevice(await signed('POST', '/api/v1/feedback', '{"a":1}'), env, '{"a":2}')).rejects.toMatchObject({ code: 'bad_signature' });
    const old = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    await expect(verifyDevice(await signed('POST', '/api/v1/feedback', '', old), env, '')).rejects.toMatchObject({ code: 'stale_request' });
    await expect(verifyDevice(await signed('POST', '/api/v1/feedback', '', undefined, 'c'.repeat(64)), env, '')).rejects.toMatchObject({ code: 'bad_signature' });
    await expect(verifyDevice(new Request(`${BASE}/x`), env, '')).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('a blocked device is refused', async () => {
    await env.DB.prepare('UPDATE devices SET blocked = 1 WHERE id = ?').bind(DEVICE).run();
    await expect(verifyDevice(await signed('GET', '/api/v1/feedback/mine', ''), env, '')).rejects.toMatchObject({ code: 'blocked' });
  });

  it('"delete my data" removes the device, its rows (cascade) and its photos', async () => {
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO images VALUES ('img1', ?, 'r2/img1.jpg', 'ffff', 10, ?, ?)").bind(DEVICE, now, now).run();
    await env.DB.prepare("INSERT INTO feedback (id, device_id, model_version, predicted_class, band, probs_json, reported_class, image_id, created_at) VALUES ('f1', ?, 'v10', 'blast', 'high', '[]', 'brown_spot', 'img1', ?)").bind(DEVICE, now).run();
    const deleted = [];
    env.IMAGES = { delete: async (keys) => deleted.push(...keys) };
    const res = await call(deleteMe, await signed('DELETE', '/api/v1/devices/me', ''), env);
    expect(res.status).toBe(204);
    expect(deleted).toEqual(['r2/img1.jpg']);
    for (const t of ['devices', 'images', 'feedback']) {
      expect((await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first()).n, t).toBe(0);
    }
  });

  it('countSince counts per device and refuses unknown tables', async () => {
    expect(await countSince(env.DB, 'feedback', DEVICE, '2000-01-01')).toBe(0);
    await expect(countSince(env.DB, 'devices', DEVICE, '2000-01-01')).rejects.toThrow();
  });
});

describe('Turnstile helper', () => {
  it('sends the secret and token to Cloudflare and needs success', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ success: true }));
    await verifyTurnstile('tok', { TURNSTILE_SECRET: 's' }, '1.2.3.4', fetchImpl);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.body.get('secret')).toBe('s');
    expect(init.body.get('response')).toBe('tok');
    await expect(verifyTurnstile('', { TURNSTILE_SECRET: 's' }, null, fetchImpl)).rejects.toMatchObject({ code: 'turnstile_missing' });
  });
});
