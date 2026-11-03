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
 *   'retry'  – network or 5xx/429 → kept, attempts + 1
 *   'reject' – permanent 4xx (bad request) → removed, so it cannot block the queue
 * Items that failed MAX_ATTEMPTS times are kept but skipped, for the UI to show.
 */
export async function flushOutbox(send) {
  const db = await getDb();
  const result = { sent: 0, retry: 0, rejected: 0, skipped: 0 };
  for (const item of await listOutbox()) {
    if (item.attempts >= MAX_ATTEMPTS) { result.skipped++; continue; }
    let outcome;
    try {
      outcome = await send(item);
    } catch (err) {
      outcome = 'retry';
      item.last_error = String(err?.message || err);
    }
    if (outcome === 'sent' || outcome === 'reject') {
      await db.delete(STORES.OUTBOX, item.id);
      result[outcome === 'sent' ? 'sent' : 'rejected']++;
    } else {
      await db.put(STORES.OUTBOX, { ...item, attempts: item.attempts + 1 });
      result.retry++;
    }
  }
  return result;
}
