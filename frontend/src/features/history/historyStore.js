import { getDb, STORES, newId, resetDbForTests } from '../../lib/store/db.js';

export const HISTORY_LIMIT = 200;

export async function makeThumbnailBlob(canvas) {
  if (!canvas) throw new Error('canvas required');
  const maxSide = 320;
  const w0 = Number(canvas.width) || 0;
  const h0 = Number(canvas.height) || 0;
  const scale = w0 && h0 ? Math.min(1, maxSide / Math.max(w0, h0)) : 1;
  const w = Math.max(1, Math.round((w0 || maxSide) * scale));
  const h = Math.max(1, Math.round((h0 || maxSide) * scale));

  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (ctx) ctx.drawImage(canvas, 0, 0, w, h);
    return await new Promise((resolve, reject) => {
      if (typeof c.toBlob === 'function') {
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
      } else {
        reject(new Error('toBlob unavailable'));
      }
    });
  }

  if (typeof canvas.toBlob === 'function') {
    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
    });
  }
  return new Blob([], { type: 'image/jpeg' });
}

export async function listHistory() {
  const db = await getDb();
  const all = await db.getAll(STORES.HISTORY);
  return all.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export async function countHistory() {
  const db = await getDb();
  return (await db.getAll(STORES.HISTORY)).length;
}

export async function lastUsedLabels() {
  const all = await listHistory();
  const seen = new Set();
  const out = [];
  for (const e of all) {
    const label = (e.field_label || '').trim();
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

export async function saveHistoryEntry(scan, fieldLabel = '') {
  if (!scan) throw new Error('scan required');
  const db = await getDb();
  const all = await db.getAll(STORES.HISTORY);
  let pruned = false;
  let prunedEntry = null;
  // keep at most HISTORY_LIMIT: remove oldest until room for one more
  const sorted = [...all].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  while (sorted.length >= HISTORY_LIMIT) {
    const oldest = sorted.shift();
    await db.delete(STORES.HISTORY, oldest.id);
    pruned = true;
    prunedEntry = oldest;
  }
  const thumb = await makeThumbnailBlob(scan.canvas);
  const entry = {
    id: newId(),
    created_at: new Date().toISOString(),
    field_label: String(fieldLabel || '').trim(),
    thumb_jpeg: thumb,
    top_class: scan.classKey,
    status: scan?.decision?.status,
    reason: scan?.decision?.reason ?? null,
    probs: Array.from(scan.probs || []),
    model_version: 'v10',
    band: null,
    note: '',
  };
  await db.put(STORES.HISTORY, entry);
  return { entry, pruned, prunedEntry };
}

export async function deleteHistory(id) {
  const db = await getDb();
  await db.delete(STORES.HISTORY, id);
}

export async function deleteAllHistory() {
  const db = await getDb();
  const tx = db.transaction(STORES.HISTORY, 'readwrite');
  await tx.objectStore(STORES.HISTORY).clear();
  await tx.done;
}

export function groupHistoryByField(entries) {
  const groups = new Map();
  for (const e of entries) {
    const key = e.field_label || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  // newest first within group
  for (const arr of groups.values()) {
    arr.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }
  // groups ordered by most recent entry desc
  const ordered = [...groups.entries()].sort((a, b) => {
    const aMax = a[1][0]?.created_at || '';
    const bMax = b[1][0]?.created_at || '';
    return String(bMax).localeCompare(String(aMax));
  });
  return ordered.map(([label, items]) => ({ label, items }));
}

// aliases for compatibility
export const saveHistory = saveHistoryEntry;
export const saveToHistory = saveHistoryEntry;
export const SaveHistory = saveHistoryEntry;
export const getHistory = listHistory;
export const loadHistory = listHistory;
export const fetchHistory = listHistory;
export const removeHistory = deleteHistory;
export const deleteOne = deleteHistory;
export const deleteAll = deleteAllHistory;
export const clearHistory = deleteAllHistory;
export const clearAllHistory = deleteAllHistory;

export { resetDbForTests };
