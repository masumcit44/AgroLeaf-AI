import { createTestDb } from '../d1Fake.js';
import { api, okTurnstile } from './api.test.js';
import { afterEach, beforeEach, describe, it, expect, test } from 'vitest';

const BASE = '/api/v1';
const DEVICE_KEY = 'test-signing-key-64hex0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
const DEVICE_ID = 'test-device-' + crypto.randomUUID();

beforeEach(async () => {
  const db = await createTestDb();
  await api.post(`${BASE}/devices`, { device_id: DEVICE_ID, signing_key: DEVICE_KEY, turnstile_token: 'tok' }, { db });
  vi.stubGlobal('fetch', okTurnstile);
});

afterEach(async () => {
  vi.unstubAllGlobals();
});

test('happy path feedback submit and idempotent retry', async () => {
  const payload = {
    id: crypto.randomUUID(),
    device_id: DEVICE_ID,
    model_version: 'v10',
    predicted_class: 'healthy',
    reported_class: 'healthy',
    band: 'high',
    probs: [1,0,0,0,0,0,0,0],
    comment: 'test comment',
    image_id: null,
    upazila_code: null,
  };
  const res1 = await api.post(`${BASE}/feedback`, payload, { db });
  expect(res1.status).toBe(201);
  expect(res1.body.status).toBe('new');

  const res2 = await api.post(`${BASE}/feedback`, payload, { db });
  expect(res2.status).toBe(200);
  expect(res2.body.status).toBe('new');
});

test('21st feedback per day returns 429', async () => {
  const now = new Date();
  const since = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().replace(/T.*$/, 'T00:00:00.000Z');
  for (let i = 0; i < 21; i++) {
    await api.post(`${BASE}/feedback`, {
      id: crypto.randomUUID(),
      device_id: DEVICE_ID,
      model_version: 'v10',
      predicted_class: 'healthy',
      reported_class: 'healthy',
      band: 'high',
      probs: [1,0,0,0,0,0,0,0],
      comment: '',
    }, { db });
  }
  const res = await api.post(`${BASE}/feedback`, {
    id: crypto.randomUUID(),
    device_id: DEVICE_ID,
    model_version: 'v10',
    predicted_class: 'healthy',
    reported_class: 'healthy',
    band: 'high',
    probs: [1,0,0,0,0,0,0,0],
    comment: '',
  }, { db });
  expect(res.status).toBe(429);
});

test('another device cannot read mine', async () => {
  const otherId = 'other-device-' + crypto.randomUUID();
  await api.post(`${BASE}/devices`, { device_id: otherId, signing_key: DEVICE_KEY, turnstile_token: 'tok' }, { db });
  const res = await api.get(`${BASE}/feedback/mine`, { db });
  expect(res.body).toHaveLength(0);
});

test('image too big returns 413', async () => {
  const big = new Uint8Array(1_048_577);
  const form = new FormData();
  form.append('file', new Blob([big], { type: 'image/jpeg' }), 'big.jpg');
  form.append('phash', 'a'.repeat(16));
  form.append('turnstile_token', 'tok');
  const res = await api.postForm(`${BASE}/images`, form, { db });
  expect(res.status).toBe(413);
});

test('missing R2 returns 503', async () => {
  const db = await createTestDb({ hasImages: false });
  await api.post(`${BASE}/devices`, { device_id: DEVICE_ID, signing_key: DEVICE_KEY, turnstile_token: 'tok' }, { db });
  const form = new FormData();
  form.append('file', new File([new Uint8Array([0xff,0xd8,0xff])], 'a.jpg', { type: 'image/jpeg' }), 'a.jpg');
  form.append('phash', 'a'.repeat(16));
  form.append('turnstile_token', 'tok');
  const res = await api.postForm(`${BASE}/images`, form, { db });
  expect(res.status).toBe(503);
});

test('duplicate image returns 409 with image_id', async () => {
  await api.post(`${BASE}/images`, {
    file: new File([new Uint8Array([0xff,0xd8,0xff,0xe0])], 'a.jpg', { type: 'image/jpeg' }),
    phash: 'a'.repeat(16),
    turnstile_token: 'tok',
  }, { db });
  const res = await api.post(`${BASE}/images`, {
    file: new File([new Uint8Array([0xff,0xd8,0xff,0xe0])], 'a.jpg', { type: 'image/jpeg' }),
    phash: 'a'.repeat(16),
    turnstile_token: 'tok',
  }, { db });
  expect(res.status).toBe(409);
  expect(res.body).toHaveProperty('image_id');
});