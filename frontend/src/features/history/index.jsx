// F14 Photo History & Before/After Symptom Tracking
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
import { buildTimeline } from './progression.js';
import { BeforeAfterViewer } from './BeforeAfterViewer.jsx';

export * from './historyStore.js';
export * from './diseaseNames.js';
export * from './progression.js';
export * from './BeforeAfterViewer.jsx';

function Thumb({ blob, className }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) return undefined;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return <div className={`${className} bg-gray-100 animate-pulse`} aria-hidden="true" />;
  return <img src={url} alt="" className={className} />;
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function toBnDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

function formatDate(iso, lang) {
  const d = new Date(iso);
  if (lang === 'bn') {
    return `${toBnDigits(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
  }
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function resultName(entry, lang, t) {
  if (entry.status !== 'confident' || !entry.top_class || entry.top_class === 'not_sure') {
    return t('history.notSure');
  }
  return diseaseDisplayName(entry.top_class, lang);
}

/** [result] Save this result on the phone with plant/plot label to track progression over time. */
export function SaveToHistory({ scan, context: _context }) {
  const { t } = useT();
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
    <div className="w-full max-w-sm space-y-2.5 rounded-2xl border border-leaf-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-leaf-800">
        <span className="w-2 h-2 rounded-full bg-leaf-600 inline-block" />
        {t('history.trackPrompt')}
      </div>
      {!saved ? (
        <>
          <label className="block text-xs font-semibold text-gray-700">{t('history.fieldLabel')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('history.fieldLabelPlaceholder')}
            list="history-last-used"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
          />
          <datalist id="history-last-used">
            {lastUsed.map((l) => <option key={l} value={l} />)}
          </datalist>
          {lastUsed.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500">{t('history.lastUsed')}:</span>
              {lastUsed.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLabel(l)}
                  className="text-xs rounded-full bg-gray-100 px-2.5 py-0.5 hover:bg-gray-200 text-gray-700"
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
            className="w-full rounded-xl bg-leaf-700 text-white py-2 text-sm font-semibold hover:bg-leaf-800 disabled:opacity-60 transition-colors"
          >
            {t('history.save')}
          </button>
        </>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-1.5">
          <span>✓</span>
          <span>
            {t('history.saved')}
            {pruned ? ' ' + t('history.pruneNotice') : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/** [home] Link to #/history when there are saved results. */
export function HistoryLink({ scan: _scan, context: _context }) {
  const { t } = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    countHistory().then((n) => { if (active) setCount(n); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (count <= 0) return null;
  const label = t('history.link').replace('{n}', count);
  return (
    <a
      href="#/history"
      className="block w-full max-w-sm rounded-xl border border-leaf-700/30 bg-leaf-50 px-4 py-3 text-sm font-semibold text-leaf-700 hover:bg-leaf-100 transition-colors"
    >
      {label}
    </a>
  );
}

/** [route] Page at #/history: F14 Photo History & Before/After Symptom Tracking */
export function HistoryPage({ scan: _scan, context: _context }) {
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
        <div>
          <span className="inline-block text-[11px] font-bold text-leaf-800 bg-leaf-100 rounded-full px-2 py-0.5 mb-1">
            {t('history.badge')}
          </span>
          <h1 className="text-xl font-bold text-leaf-800">{t('history.title')}</h1>
        </div>
        {entries.length > 0 && (
          <button type="button" onClick={onDeleteAll} className="text-sm text-red-600 font-semibold hover:underline">
            {t('history.deleteAll')}
          </button>
        )}
      </div>

      {entries.length === 0 && <p className="text-sm text-gray-500">{t('history.empty')}</p>}

      {groups.map((g) => {
        const groupTimeline = buildTimeline(g.items);
        const hasMultiple = groupTimeline.length >= 2;
        const isComparing = compare === (g.label || '__default__');

        return (
          <section
            key={g.label || '__none__'}
            className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800 text-base">{g.label || '—'}</h2>
                <span className="text-xs text-gray-500">
                  {lang === 'bn' ? toBnDigits(g.items.length) : g.items.length}{' '}
                  {lang === 'bn' ? 'টি ছবি সংরক্ষিত' : 'photos recorded'}
                </span>
              </div>
              {hasMultiple && (
                <button
                  type="button"
                  onClick={() => setCompare(isComparing ? null : (g.label || '__default__'))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    isComparing
                      ? 'bg-gray-100 text-gray-700 border-gray-300'
                      : 'bg-leaf-50 text-leaf-700 border-leaf-300 hover:bg-leaf-100'
                  }`}
                >
                  {isComparing ? t('history.compareHide') : t('history.beforeAfterCompare')}
                </button>
              )}
            </div>

            {/* Before / After Viewer */}
            {hasMultiple && isComparing && (
              <BeforeAfterViewer
                items={g.items}
                lang={lang}
                t={t}
                onClose={() => setCompare(null)}
              />
            )}

            {/* Single entry hint */}
            {!hasMultiple && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
                {t('history.singleEntryHint')}
              </div>
            )}

            {/* Chronological symptom list */}
            <ul className="space-y-2.5 divide-y divide-gray-100">
              {g.items.map((e) => {
                const timelineItem = groupTimeline.find((tItem) => tItem.id === e.id);
                const dayOffset = timelineItem ? timelineItem.dayOffset : 0;
                const isBaseline = timelineItem ? timelineItem.isBaseline : false;

                return (
                  <li key={e.id} className="pt-2.5 first:pt-0 flex gap-3 items-center">
                    <Thumb blob={e.thumb_jpeg} className="h-14 w-14 object-cover rounded-xl border border-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {resultName(e, lang, t)}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isBaseline
                            ? 'bg-leaf-100 text-leaf-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isBaseline
                            ? t('history.dayBaseline')
                            : t('history.daysLater').replace('{d}', lang === 'bn' ? toBnDigits(dayOffset) : dayOffset)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatDate(e.created_at, lang)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteOne(e.id)}
                      className="text-xs text-red-600 font-semibold shrink-0 hover:underline px-2 py-1"
                    >
                      {t('history.deleteOne')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
