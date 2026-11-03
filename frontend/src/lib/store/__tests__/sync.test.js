// Sync client tests - unit tests for core logic
import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetDbForTests, DB_NAME, STORES } from '../db.js';

// Mock fetch for Turnstile
const mockFetch = vi.fn();
const originalFetch = global.fetch;

function setupFetchMocks() {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
}

function restoreFetch() {
  global.fetch = originalFetch;
}

describe('Turnstile verification (unit)', () => {
  beforeEach(setupFetchMocks);
  afterEach(restoreFetch);

  it('succeeds with valid token', async () => {
    const { verifyTurnstile } = await import('../../../../server/auth.js');
    await verifyTurnstile('valid-token', { TURNSTILE_SECRET: 'secret' }, '1.2.3.4', mockFetch);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('fails when secret not configured', async () => {
    const { verifyTurnstile } = await import('../../../../server/auth.js');
    await expect(verifyTurnstile('token', {}, '1.2.3.4', mockFetch)).rejects.toMatchObject({
      status: 503,
      code: 'turnstile_not_configured',
    });
  });

  it('fails when token missing', async () => {
    const { verifyTurnstile } = await import('../../../../server/auth.js');
    await expect(verifyTurnstile('', { TURNSTILE_SECRET: 'secret' }, '1.2.3.4', mockFetch)).rejects.toMatchObject({
      status: 400,
      code: 'turnstile_missing',
    });
  });

  it('fails when Turnstile returns failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['timeout'] }),
    });
    const { verifyTurnstile } = await import('../../../../server/auth.js');
    await expect(verifyTurnstile('bad-token', { TURNSTILE_SECRET: 'secret' }, '1.2.3.4', mockFetch)).rejects.toMatchObject({
      status: 403,
      code: 'turnstile_failed',
    });
  });
});

describe('Device store (IndexedDB)', () => {
  beforeEach(async () => {
    await resetDbForTests();
    await new Promise((resolve) => {
      const r = indexedDB.deleteDatabase(DB_NAME);
      r.onsuccess = r.onerror = r.onblocked = resolve;
    });
  });

  it('creates and retrieves device', async () => {
    const { getOrCreateDevice, signingKey } = await import('../device.js');
    const device = await getOrCreateDevice();
    expect(device.device_id).toBeDefined();
    expect(device.device_secret).toBeDefined();
    const key = await signingKey(device);
    expect(key).toHaveLength(64);
  });

  it('returns same device on second call', async () => {
    const { getOrCreateDevice } = await import('../device.js');
    const d1 = await getOrCreateDevice();
    const d2 = await getOrCreateDevice();
    expect(d1.device_id).toBe(d2.device_id);
    expect(d1.device_secret).toBe(d2.device_secret);
  });
});

describe('Signing', () => {
  it('produces correct signature format', async () => {
    const { sha256Hex, hmacSign } = await import('../signing.js');
    const key = 'a'.repeat(64);
    const bodyHash = await sha256Hex('test body');
    const sig = await hmacSign(key, 'POST', '/api/v1/feedback', bodyHash, '2026-01-01T00:00:00.000Z');
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('safeEqual works', async () => {
    const { safeEqual } = await import('../signing.js');
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('Outbox', () => {
  beforeEach(async () => {
    await resetDbForTests();
    await new Promise((resolve) => {
      const r = indexedDB.deleteDatabase(DB_NAME);
      r.onsuccess = r.onerror = r.onblocked = resolve;
    });
  });

  it('enqueues and lists items in order', async () => {
    const { enqueue, listOutbox } = await import('../outbox.js');
    
    await enqueue('feedback', { reported_class: 'blast', comment: 'test' });
    await enqueue('area_report', { upazila_code: '123', class: 'blast' });
    
    const items = await listOutbox();
    expect(items.length).toBe(2);
    expect(items[0].kind).toBe('feedback');
    expect(items[1].kind).toBe('area_report');
    expect(items[0].seq).toBeLessThan(items[1].seq);
  });

  it('flushOutbox calls send in order', async () => {
    const { enqueue, flushOutbox } = await import('../outbox.js');
    
    await enqueue('feedback', { id: 'item-1', reported_class: 'blast' });
    await enqueue('feedback', { id: 'item-2', reported_class: 'brown_spot' });
    
    const send = vi.fn().mockResolvedValue('sent');
    const result = await flushOutbox(send);
    
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].id).toBe('item-1');
    expect(send.mock.calls[1][0].id).toBe('item-2');
    expect(result.sent).toBe(2);
  });

  it('retry on network error', async () => {
    const { enqueue, listOutbox, flushOutbox } = await import('../outbox.js');
    
    await enqueue('feedback', { id: 'item-retry', reported_class: 'blast' });
    
    const send = vi.fn().mockRejectedValue(new Error('network'));
    const result = await flushOutbox(send);
    
    expect(result.retry).toBe(1);
    expect(result.sent).toBe(0);
    const items = await listOutbox();
    expect(items[0].attempts).toBe(1);
  });

  it('reject on 422/400 removes item', async () => {
    const { enqueue, listOutbox, flushOutbox } = await import('../outbox.js');
    
    await enqueue('feedback', { id: 'item-reject', reported_class: 'blast' });
    
    const send = vi.fn().mockResolvedValue('reject');
    const result = await flushOutbox(send);
    
    expect(result.rejected).toBe(1);
    expect(result.sent).toBe(0);
    const items = await listOutbox();
    expect(items.length).toBe(0);
  });

  it('skips items at MAX_ATTEMPTS', async () => {
    const { enqueue, flushOutbox } = await import('../outbox.js');
    const { getDb } = await import('../db.js');
    
    await enqueue('feedback', { id: 'item-skip', reported_class: 'blast' });
    const db = await getDb();
    await db.put(STORES.OUTBOX, { id: 'item-skip', kind: 'feedback', payload: { reported_class: 'blast' }, seq: 1, created_at: new Date().toISOString(), attempts: 8, last_error: null });
    
    const send = vi.fn().mockResolvedValue('sent');
    const result = await flushOutbox(send);
    
    expect(result.skipped).toBe(1);
    expect(send).not.toHaveBeenCalled();
  });
});

// Mock the turnstile module
vi.mock('../turnstile.js', () => ({
  getTurnstileToken: vi.fn().mockResolvedValue('valid-token'),
  resetTurnstile: vi.fn(),
}));

// Sync client integration tests (require browser environment for Web Crypto API)
// These tests are run in the browser via the preview deployment
// describe('Sync client (with mocked network)', () => { ... });