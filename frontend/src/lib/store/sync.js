// Sync client: device registration + outbox flush with signed requests.
// Uses the outbox.js flushOutbox(send) for the actual sending loop.
import { getOrCreateDevice, signingKey, signRequest } from './device.js';
import { listOutbox, enqueue, flushOutbox as outboxFlush } from './outbox.js';
import { getTurnstileToken } from './turnstile.js';
import { getDb, STORES } from './db.js';

const API_BASE = '/api/v1';
const ENDPOINTS = {
  feedback: '/api/v1/feedback',
  area_report: '/api/v1/area-reports',
};

let flushPromise = null;
let isOnline = typeof navigator !== 'undefined' && navigator.onLine;

/** Mark device as registered in IndexedDB. */
async function markRegistered(deviceId) {
  const db = await getDb();
  await db.put(STORES.DEVICE, { device_id: deviceId, registered: true }, 'self');
}

/** Check if device is already registered. */
async function isRegistered() {
  const db = await getDb();
  const device = await db.get(STORES.DEVICE, 'self');
  return device?.registered === true;
}

/** Clear registered mark (e.g., on 401 unknown_device). */
async function clearRegistered() {
  const db = await getDb();
  const device = await db.get(STORES.DEVICE, 'self');
  if (device) {
    await db.put(STORES.DEVICE, { ...device, registered: false }, 'self');
  }
}

/** Register the device with the server (once). */
async function registerDevice() {
  const device = await getOrCreateDevice();
  if (await isRegistered()) return device;

  const key = await signingKey(device);
  const token = await getTurnstileToken();
  if (!token) throw new Error('turnstile_cancelled');

  const body = JSON.stringify({ device_id: device.device_id, signing_key: key, turnstile_token: token });
  const res = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `register failed: ${res.status}`);
  }
  await markRegistered(device.device_id);
  return device;
}
  
/** Send a single outbox item with signed request. */
async function sendItem(item) {
  const device = await getOrCreateDevice();
  const endpoint = ENDPOINTS[item.kind];
  if (!endpoint) throw new Error(`unknown kind: ${item.kind}`);

  const body = JSON.stringify(item.payload);
  const headers = await signRequest(device, 'POST', endpoint, body);
  headers['Content-Type'] = 'application/json';
  headers['Idempotency-Key'] = item.id;

  const res = await fetch(endpoint, { method: 'POST', headers, body });

  // Check for 401 unknown_device - clear registered mark so we re-register
  if (res.status === 401) {
    await clearRegistered();
    throw new Error('unauthorized');
  }

  if (res.status >= 200 && res.status < 300) return 'sent';
  if (res.status === 409) return 'sent'; // duplicate, already accepted
  if (res.status === 422 || res.status === 400) return 'reject'; // bad request, don't retry
  if (res.status === 503) throw new Error('not_configured'); // will retry with backoff
  if (res.status >= 500) throw new Error('server_error'); // will retry
  throw new Error(`unexpected: ${res.status}`);
}

/** Flush the outbox using the shared outbox.js flushOutbox(send). Single-flight. */
export async function flushOutbox() {
  if (flushPromise) return flushPromise;
  if (!isOnline) return { sent: 0, retry: 0, rejected: 0, skipped: 0 };

  flushPromise = (async () => {
    const result = { sent: 0, retry: 0, rejected: 0, skipped: 0 };

    try {
      // Ensure registered before sending
      if (!(await isRegistered())) {
        await registerDevice();
      }

      // Use the shared outbox flush with our sendItem
      const outboxResult = await outboxFlush(sendItem);

      // Map outbox result to our result format
      result.sent = outboxResult.sent;
      result.retry = outboxResult.retry;
      result.rejected = outboxResult.rejected;
      result.skipped = outboxResult.skipped;
    } finally {
      flushPromise = null;
    }
    return result;
  })();

  return flushPromise;
}

/** Ensure registered and flush (called when user enqueues something). */
export async function ensureRegisteredAndFlush() {
  await getOrCreateDevice();
  if (!(await isRegistered())) {
    await registerDevice();
  }
  return flushOutbox();
}

/** Setup triggers: online event, app start (after 5s idle), after enqueue. */
export function setupSyncTriggers() {
  if (typeof window === 'undefined') return;

  // Online event
  window.addEventListener('online', () => {
    isOnline = true;
    // Debounce: wait for network to settle
    setTimeout(flushOutbox, 1000);
  });
  window.addEventListener('offline', () => { isOnline = false; });

  // App start: after 5s idle
  if (document.readyState === 'complete') {
    setTimeout(flushOutbox, 5000);
  } else {
    window.addEventListener('load', () => setTimeout(flushOutbox, 5000));
  }
}

/** Enqueue a feedback item (called from UI). */
export async function enqueueFeedback(payload) {
  const item = await enqueue('feedback', payload);
  await ensureRegisteredAndFlush();
  return item;
}

/** Enqueue an area report item. */
export async function enqueueAreaReport(payload) {
  const item = await enqueue('area_report', payload);
  await ensureRegisteredAndFlush();
  return item;
}

/** Get outbox status for UI. */
export async function getOutboxStatus() {
  const items = await listOutbox();
  return items.map(i => ({
    id: i.id,
    kind: i.kind,
    attempts: i.attempts,
    last_error: i.last_error,
    created_at: i.created_at,
    next_attempt_at: i.next_attempt_at,
  }));
}