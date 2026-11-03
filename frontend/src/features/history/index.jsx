// F16 Disease progress history.
import React, { useEffect, useState } from 'react';
import useT from '../../i18n/useT.js';
import {
  listHistory,
  countHistory,
  lastUsedLabels,
  saveHistoryEntry,
  deleteHistory,
  deleteAllHistory,
  groupHistoryByField,
} from './historyStore.js';
import { diseaseDisplayName } from './diseaseNames.js';

export * from './historyStore.js';
export * from './diseaseNames.js';

function Thumb({ blob, className }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) return undefined;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return <div className={className} aria-hidden="true" />;
  return <img src={url} alt="" className={className} />;
}

function formatDate(iso, lang) {
  const d = new Date(iso);
  const s = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  if (lang !== 'bn') return s;
  return s.replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

function resultName(entry, lang, t) {
  if (entry.status !== 'confident' || !entry.top_class || entry.top_class === 'not_sure') {
    return t('history.notSure');
  }
  return diseaseDisplayName(entry.top_class, lang);
}
/** [result] Save this result on the phone (thumbnail, result, band, field label). */
export function SaveToHistory({ scan, context }) {
  const { t, lang } = useT();
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pruned, setPruned] = useState(false);
  const [lastUsed, setLastUsed] = useState([]);

  useEffect(() => {
    let active = true;
    lastUsedLabels().then((v) => { if (active) setLastUsed(v); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!scan) return null;

  const onSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const res = await saveHistoryEntry(scan, label);
      setSaved(true);
      if (res && res.pruned) setPruned(true);
      const v = await lastUsedLabels();
      setLastUsed(v);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      {!saved ? (
        <>
          <label className="block text-xs font-semibold text-gray-700">{t('history.fieldLabel')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('history.fieldLabelPlaceholder')}
            list="history-last-used"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <datalist id="history-last-used">
            {lastUsed.map((l) => <option key={l} value={l} />)}
          </datalist>
          {lastUsed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-500">{t('history.lastUsed')}:</span>
              {lastUsed.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLabel(l)}
                  className="text-xs rounded-full bg-gray-100 px-2 py-0.5 hover:bg-gray-200"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full rounded-xl bg-leaf-700 text-white py-2 text-sm font-semibold disabled:opacity-60"
          >
            {t('history.save')}
          </button>
        </>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          {t('history.saved')}
          {pruned ? ' ' + t('history.pruneNotice') : ''}
        </div>
      )}
    </div>
  );
}
/** [home] Link to #/history when there are saved results. */
export function HistoryLink({ scan, context }) {
  const { t, lang } = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    countHistory().then((n) => { if (active) setCount(n); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (count <= 0) return null;
  const label = t('history.link').replace('{n}', count);
  return (
    <a href="#/history" className="block w-full max-w-sm rounded-xl border border-leaf-700/30 bg-leaf-50 px-4 py-3 text-sm font-semibold text-leaf-700">
      {label}
    </a>
  );
}
/** [route] Page at #/history. */
export function HistoryPage({ scan, context }) {
  const { t, lang } = useT();
  const [entries, setEntries] = useState([]);
  const [compare, setCompare] = useState(null);

  const load = async () => {
    try {
      setEntries(await listHistory());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const groups = groupHistoryByField(entries);

  const onDeleteOne = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm(t('history.confirmDeleteOne'))) return;
    await deleteHistory(id);
    await load();
  };

  const onDeleteAll = async () => {
    if (typeof window !== 'undefined' && !window.confirm(t('history.confirmDeleteAll'))) return;
    await deleteAllHistory();
    await load();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-leaf-700">{t('history.title')}</h1>
        {entries.length > 0 && (
          <button type="button" onClick={onDeleteAll} className="text-sm text-red-600 font-semibold">
            {t('history.deleteAll')}
          </button>
        )}
      </div>

      {entries.length === 0 && <p className="text-sm text-gray-500">{t('history.empty')}</p>}

      {groups.map((g) => (
        <section key={g.label || '__none__'} className="space-y-3 rounded-2xl border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{g.label || '—'}</h2>
            <button
              type="button"
              onClick={() => setCompare(compare === g.label ? null : g.label)}
              className="text-xs text-leaf-700 font-semibold"
            >
              {compare === g.label ? t('history.compareHide') : t('history.compare')}
            </button>
          </div>

          {compare === g.label && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {g.items.map((e) => (
                <div key={e.id} className="shrink-0 text-center">
                  <Thumb blob={e.thumb_jpeg} className="h-20 w-auto rounded-lg border border-gray-200" />
                  <div className="text-[10px] text-gray-500 mt-1">{formatDate(e.created_at, lang)}</div>
                </div>
              ))}
            </div>
          )}

          <ul className="space-y-2">
            {g.items.map((e) => (
              <li key={e.id} className="flex gap-3 items-center">
                <Thumb blob={e.thumb_jpeg} className="h-14 w-14 object-cover rounded-lg border border-gray-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{resultName(e, lang, t)}</div>
                  <div className="text-xs text-gray-500">{formatDate(e.created_at, lang)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteOne(e.id)}
                  className="text-xs text-red-600 font-semibold shrink-0"
                >
                  {t('history.deleteOne')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
