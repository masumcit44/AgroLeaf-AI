// sync.js end to end: browser-side store (fake IndexedDB) talking to the REAL Pages handlers
// (device registration, Turnstile check, signature verification) over a routed fetch.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDb } from '../../../../server/__tests__/d1Fake.js';
import { onRequest as middleware } from '../../../../functions/api/v1/_middleware.js';
import { onRequestPost as registerHandler } from '../../../../functions/api/v1/devices/index.js';
import { verifyDevice } from '../../../../server/auth.js';
import { json } from '../../../../server/http.js';
import { resetDbForTests, getDb, STORES } from '../db.js';
import { enqueue, listOutbox, MAX_ATTEMPTS } from '../outbox.js';

const token = vi.hoisted(() => ({ value: 'turnstile-ok' }));
vi.mock('../turnstile.js', () => ({ getTurnstileToken: vi.fn(async () => token.value) }));

import { flushOutbox, ensureRegisteredAndFlush } from '../sync.js';
import { getTurnstileToken } from '../turnstile.js';

const BASE = 'https://preview.agroleaf-ai.pages.dev';
let env;
let calls;
let mode; // per-test override for the signed endpoints: 'ok' | 'network' | 503 | 422

// Stand-in for a signed endpoint (feedback / area-reports): the real verifyDevice + echo
async function signedEcho({ request, env: e }) {
  const body = await request.text();
  await verifyDevice(request, e, body);
  if (mode === 503) return json({ error: { code: 'storage_not_configured' } }, 503);
  if (mode === 422) return json({ error: { code: 'invalid' } }, 422);
  return json({ received: JSON.parse(body) }, 201);
}

async function router(input, init) {
  const request = new Request(new URL(typeof input === 'string' ? input : input.url, BASE), init);
  const { pathname, hostname } = new URL(request.url);
  calls.push(pathname);
  if (hostname === 'challenges.cloudflare.com') return Response.json({ success: true });
  if (pathname === '/api/v1/devices') {
    return middleware({ request, env, next: () => registerHandler({ request, env }) });
  }
  if (pathname === '/api/v1/feedback' || pathname === '/api/v1/area-reports') {
    if (mode === 'network') throw new TypeError('Failed to fetch');
    return middleware({ request, env, next: () => signedEcho({ request, env }) });
  }
  return new Response('not found', { status: 404 });
}

const apiCalls = (path) => calls.filter((c) => c === path).length;

beforeEach(async () => {
  await resetDbForTests();
  const db = await getDb();
  await db.clear(STORES.OUTBOX);
  await db.clear(STORES.DEVICE);
  env = { DB: createTestDb(), TURNSTILE_SECRET: 'test-secret' };
  calls = [];
  mode = 'ok';
  token.value = 'turnstile-ok';
  getTurnstileToken.mockClear();
  vi.stubGlobal('fetch', vi.fn(router));
});

afterEach(() => vi.unstubAllGlobals());

describe('sync client against the real API handlers', () => {
  it('does nothing (no Turnstile prompt, no request) when the outbox is empty', async () => {
    await flushOutbox();
    expect(getTurnstileToken).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('registers once, keeps the device secret, and the real verifyDevice accepts the signatures', async () => {
    await enqueue('feedback', { n: 1 });
    const r1 = await flushOutbox();
    expect(r1.sent).toBe(1);
    const device = await (await getDb()).get(STORES.DEVICE, 'self');
    expect(device.registered).toBe(true);
    expect(device.device_secret).toBeTruthy();

    await enqueue('feedback', { n: 2 });
    const r2 = await flushOutbox();
    expect(r2.sent).toBe(1);
    expect(apiCalls('/api/v1/devices')).toBe(1);
    expect(getTurnstileToken).toHaveBeenCalledTimes(1);
    expect(await listOutbox()).toEqual([]);
  });

  it('sends items oldest first', async () => {
    const sent = [];
    const original = signedEcho;
    await enqueue('feedback', { n: 1 });
    await enqueue('area_report', { n: 2 });
    await enqueue('feedback', { n: 3 });
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      if (/\/api\/v1\/(feedback|area-reports)$/.test(String(input))) sent.push(JSON.parse(init.body).n);
      return router(input, init);
    }));
    await flushOutbox();
    expect(sent).toEqual([1, 2, 3]);
    expect(original).toBe(signedEcho);
  });

  it('a network failure ("Failed to fetch") keeps the item queued', async () => {
    await enqueue('feedback', { n: 1 });
    mode = 'network';
    const r = await flushOutbox();
    expect(r.retry).toBe(1);
    const [item] = await listOutbox();
    expect(item.payload).toMatchObject({ n: 1 });
    expect(item.attempts).toBe(1);
  });

  it('503 keeps the item; 422 keeps it marked failed and it is not resent', async () => {
    await enqueue('feedback', { n: 1 });
    mode = 503;
    await flushOutbox();
    expect((await listOutbox())[0].attempts).toBe(1);

    const db = await getDb();
    await db.clear(STORES.OUTBOX);
    await enqueue('feedback', { n: 2 });
    mode = 422;
    await flushOutbox();
    const [failed] = await listOutbox();
    expect(failed.attempts).toBe(MAX_ATTEMPTS);
    const before = apiCalls('/api/v1/feedback');
    await flushOutbox();
    expect(apiCalls('/api/v1/feedback')).toBe(before);
  });

  it('two parallel flushes send each item once', async () => {
    await enqueue('feedback', { n: 1 });
    await Promise.all([flushOutbox(), flushOutbox()]);
    expect(apiCalls('/api/v1/feedback')).toBe(1);
  });

  it('no Turnstile site key: nothing is sent, items stay queued, and the caller never throws', async () => {
    token.value = null;
    await enqueue('feedback', { n: 1 });
    const r = await ensureRegisteredAndFlush();
    expect(r.error).toBe('turnstile_cancelled');
    expect(apiCalls('/api/v1/feedback')).toBe(0);
    expect(await listOutbox()).toHaveLength(1);
  });

  it('Turnstile not configured on the server: registration fails cleanly, items stay queued', async () => {
    delete env.TURNSTILE_SECRET;
    await enqueue('feedback', { n: 1 });
    const r = await ensureRegisteredAndFlush();
    expect(r.error).toBe('turnstile_not_configured');
    expect(await listOutbox()).toHaveLength(1);
  });
});
