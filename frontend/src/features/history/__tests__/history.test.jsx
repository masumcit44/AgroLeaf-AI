import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDb, STORES, resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import * as H from '../historyStore.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

function fakeCanvas() {
  return {
    width: 640,
    height: 480,
    toBlob(cb) {
      cb(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }));
    },
  };
}

function makeScan(key = 'blast') {
  return {
    canvas: fakeCanvas(),
    probs: [0.9, 0.1],
    decision: { status: 'confident', reason: null },
    classKey: key,
  };
}

describe('history store', () => {
  it('saves a record with the required shape', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { entry } = await H.saveHistoryEntry(makeScan(), 'Plot A');
    expect(entry.id).toBeTruthy();
    expect(entry.field_label).toBe('Plot A');
    expect(entry.top_class).toBe('blast');
    expect(entry.status).toBe('confident');
    expect(entry.reason).toBeNull();
    expect(Array.isArray(entry.probs)).toBe(true);
    expect(entry.model_version).toBe('v10');
    expect(entry.band).toBeNull();
    expect(entry.note).toBe('');
    expect(entry.thumb_jpeg).toBeInstanceOf(Blob);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('lists saved entries newest first', async () => {
    await H.saveHistoryEntry(makeScan('blast'), 'A');
    await new Promise((r) => setTimeout(r, 5));
    await H.saveHistoryEntry(makeScan('brown_spot'), 'B');
    const list = await H.listHistory();
    expect(list.length).toBe(2);
    expect(list[0].top_class).toBe('brown_spot');
  });

  it('groups by field label', () => {
    const entries = [
      { id: '1', field_label: 'Plot A', created_at: '2026-01-02T00:00:00.000Z', top_class: 'blast', status: 'confident' },
      { id: '2', field_label: 'Plot A', created_at: '2026-01-01T00:00:00.000Z', top_class: 'blast', status: 'confident' },
      { id: '3', field_label: 'Plot B', created_at: '2026-01-03T00:00:00.000Z', top_class: 'blast', status: 'confident' },
    ];
    const groups = H.groupHistoryByField(entries);
    expect(groups.length).toBe(2);
    expect(groups[0].label).toBe('Plot B');
    expect(groups[1].items.length).toBe(2);
    expect(groups[1].items[0].id).toBe('1');
  });

  it('deletes one entry', async () => {
    const { entry } = await H.saveHistoryEntry(makeScan(), 'A');
    await H.deleteHistory(entry.id);
    expect(await H.countHistory()).toBe(0);
  });

  it('deletes all entries', async () => {
    await H.saveHistoryEntry(makeScan(), 'A');
    await H.saveHistoryEntry(makeScan(), 'B');
    await H.deleteAllHistory();
    expect(await H.countHistory()).toBe(0);
  });

  it('prunes oldest when exceeding 200', async () => {
    const db = await getDb();
    const base = Date.now();
    for (let i = 0; i < 200; i++) {
      await db.put(STORES.HISTORY, {
        id: `old-${i}`,
        created_at: new Date(base + i).toISOString(),
        field_label: 'bulk',
        thumb_jpeg: new Blob([], { type: 'image/jpeg' }),
        top_class: 'blast',
        status: 'confident',
        reason: null,
        probs: [1],
        model_version: 'v10',
        band: null,
        note: '',
      });
    }
    expect(await H.countHistory()).toBe(200);
    const { pruned } = await H.saveHistoryEntry(makeScan(), 'new');
    expect(pruned).toBe(true);
    expect(await H.countHistory()).toBe(200);
    const all = await H.listHistory();
    expect(all.some((e) => e.id === 'old-0')).toBe(false);
  });

  it('never calls fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    await H.saveHistoryEntry(makeScan(), 'A');
    await H.listHistory();
    await H.countHistory();
    await H.lastUsedLabels();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
