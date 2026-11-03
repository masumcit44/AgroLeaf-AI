import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, STORES, clearAllLocalData, resetDbForTests, DB_NAME } from '../db.js';
import { getOrCreateDevice, signRequest, signingKey, hmacSign, sha256Hex } from '../device.js';
import { enqueue, listOutbox, flushOutbox, MAX_ATTEMPTS } from '../outbox.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => { const r = indexedDB.deleteDatabase(DB_NAME); r.onsuccess = r.onerror = r.onblocked = resolve; });
});

describe('local database', () => {
  it('creates every store of schema v1', async () => {
    const db = await getDb();
    expect([...db.objectStoreNames].sort()).toEqual(Object.values(STORES).sort());
  });

  it('"delete my data" empties every store', async () => {
    const db = await getDb();
    await db.put(STORES.PROFILE, { upazila_code: 'x' }, 'self');
    await enqueue('feedback', { reported_class: 'blast' });
    await clearAllLocalData();
    expect(await db.get(STORES.PROFILE, 'self')).toBeUndefined();
    expect(await listOutbox()).toEqual([]);
  });
});

describe('anonymous device', () => {
  it('is created once and reused; holds no personal data', async () => {
    const a = await getOrCreateDevice();
    const b = await getOrCreateDevice();
    expect(b).toEqual(a);
    expect(Object.keys(a).sort()).toEqual(['created_at', 'device_id', 'device_secret']);
  });

  it('signs requests so the server can verify with the registered key only', async () => {
    const device = await getOrCreateDevice();
    const ts = '2026-11-04T09:00:00.000Z';
    const headers = await signRequest(device, 'post', '/api/v1/feedback', '{"a":1}', ts);
    const server = await hmacSign(await signingKey(device), 'POST', '/api/v1/feedback', await sha256Hex('{"a":1}'), ts);
    expect(headers['X-Device-Signature']).toBe(server);
    expect(headers['X-Device-Id']).toBe(device.device_id);
    const tampered = await hmacSign(await signingKey(device), 'POST', '/api/v1/feedback', await sha256Hex('{"a":2}'), ts);
    expect(tampered).not.toBe(server);
  });
});

describe('offline outbox', () => {
  it('keeps the id as idempotency key and in the payload', async () => {
    const item = await enqueue('feedback', { reported_class: 'blast' });
    expect(item.payload.id).toBe(item.id);
    await expect(enqueue('nonsense', {})).rejects.toThrow();
  });

  it('removes sent and rejected items, keeps retries, oldest first', async () => {
    const a = await enqueue('feedback', { n: 1 });
    const b = await enqueue('help', { n: 2 });
    const c = await enqueue('area_report', { n: 3 });
    const order = [];
    const res = await flushOutbox(async (item) => {
      order.push(item.id);
      return item.id === a.id ? 'sent' : item.id === b.id ? 'retry' : 'reject';
    });
    expect(order).toEqual([a.id, b.id, c.id]);
    expect(res).toEqual({ sent: 1, retry: 1, rejected: 1, skipped: 0 });
    const left = await listOutbox();
    expect(left.map((i) => [i.id, i.attempts])).toEqual([[b.id, 1]]);
  });

  it('a thrown network error counts as retry; after MAX_ATTEMPTS the item is skipped', async () => {
    await enqueue('feedback', { n: 1 });
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await flushOutbox(async () => { throw new Error('offline'); });
    }
    const res = await flushOutbox(async () => 'sent');
    expect(res.skipped).toBe(1);
    expect((await listOutbox())[0].last_error).toBe('offline'); // the UI can show why it is stuck
  });
});
