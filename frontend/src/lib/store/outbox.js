// Offline outbox: things the farmer chose to send (feedback, help request, area report) wait here
// until the phone is online. Each item's id is also its Idempotency-Key, so a retry after a lost
// response can never create a duplicate on the server. Items are append-only: no sync conflicts.
import { getDb, STORES, newId } from './db.js';

export const OUTBOX_KINDS = ['feedback', 'help', 'area_report'];
export const MAX_ATTEMPTS = 8;

// Strictly increasing order key: two items queued in the same millisecond keep their order
let lastSeq = 0;
function nextSeq() {
  lastSeq = Math.max(lastSeq + 1, Date.now() * 1000);
  return lastSeq;
}

export async function enqueue(kind, payload) {
  if (!OUTBOX_KINDS.includes(kind)) throw new Error(`unknown outbox kind: ${kind}`);
  const id = payload?.id || newId();
  const item = { id, kind, payload: { ...payload, id }, seq: nextSeq(), created_at: new Date().toISOString(), attempts: 0, last_error: null };
  const db = await getDb();
  await db.put(STORES.OUTBOX, item);
  return item;
}

/** Queued items, oldest first. */
export async function listOutbox() {
  const db = await getDb();
  return (await db.getAll(STORES.OUTBOX)).sort((a, b) => a.seq - b.seq);
}

/**
 * Try to send every queued item, oldest first. `send(item)` resolves to:
 *   'sent'   – accepted (or already accepted: the server answered 2xx or 409 duplicate) → removed
 *   'retry'  – network or 5xx/429 → kept, attempts + 1, next_attempt_at set to 1 min from now
 *   'reject' – permanent 4xx (bad request) → kept but marked failed (attempts = MAX_ATTEMPTS), so it can be inspected
 * Items that failed MAX_ATTEMPTS times are kept but skipped, for the UI to show.
 */
export async function flushOutbox(send) {
  const db = await getDb();
  const result = { sent: 0, retry: 0, rejected: 0, skipped: 0 };
  const now = Date.now();

  for (const item of await listOutbox()) {
    if (item.attempts >= MAX_ATTEMPTS) { result.skipped++; continue; }
    // Backoff: skip if next_attempt_at is in the future
    if (item.next_attempt_at && item.next_attempt_at > now) { result.skipped++; continue; }

    let outcome;
    try {
      outcome = await send(item);
    } catch (err) {
      // Network errors (TypeError, AbortError, offline) should retry, not reject
      if (err instanceof TypeError && err.message.includes('fetch')) {
        outcome = 'retry';
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        outcome = 'retry';
      } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        outcome = 'retry';
      } else {
        outcome = 'retry';
      }
      item.last_error = String(err?.message || err);
    }

    if (outcome === 'sent') {
      await db.delete(STORES.OUTBOX, item.id);
      result.sent++;
    } else if (outcome === 'reject') {
      // Keep the item but mark as failed (attempts = MAX_ATTEMPTS) for inspection
      await db.put(STORES.OUTBOX, { ...item, attempts: MAX_ATTEMPTS });
      result.rejected++;
    } else {
      // retry: increment attempts, set next_attempt_at to 1 minute from now
      const nextAttemptAt = Date.now() + 60 * 1000;
      await db.put(STORES.OUTBOX, { ...item, attempts: item.attempts + 1, last_error: item.last_error, next_attempt_at: nextAttemptAt });
      result.retry++;
    }
  }
  return result;
}