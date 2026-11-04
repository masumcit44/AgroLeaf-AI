import React, { useState } from 'react';
import { buildTimeline, evaluateProgression } from './progression.js';
import { diseaseDisplayName } from './diseaseNames.js';

function Thumb({ blob, className }) {
  const [url, setUrl] = React.useState(null);
  React.useEffect(() => {
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
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  if (lang === 'bn') {
    return `${toBnDigits(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
  }
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getEntryDiagnosis(entry, lang, t) {
  if (!entry) return '';
  if (entry.status !== 'confident' || !entry.top_class || entry.top_class === 'not_sure') {
    return t('history.notSure');
  }
  return diseaseDisplayName(entry.top_class, lang);
}

export function BeforeAfterViewer({ items = [], lang = 'bn', t, onClose }) {
  const timeline = buildTimeline(items);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(Math.max(0, timeline.length - 1));

  if (timeline.length < 2) return null;

  const beforeEntry = timeline[beforeIdx] || timeline[0];
  const afterEntry = timeline[afterIdx] || timeline[timeline.length - 1];

  const evalResult = evaluateProgression(beforeEntry, afterEntry);
  const daysApartFormatted = lang === 'bn' ? toBnDigits(evalResult.daysApart) : String(evalResult.daysApart);

  return (
    <div
      data-testid="before-after-viewer"
      className="rounded-2xl border-2 border-leaf-600 bg-leaf-50/50 p-4 space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-leaf-200/60 pb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-leaf-600 inline-block" />
            {t('history.beforeAfterCompare')}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('history.daysApart').replace('{d}', daysApartFormatted)}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg px-2.5 py-1 hover:bg-gray-50"
          >
            {t('history.closeCompare')}
          </button>
        )}
      </div>

      {/* Multi-scan selectors if > 2 entries */}
      {timeline.length > 2 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-gray-600 font-medium mb-1">{t('history.before')}:</label>
            <select
              value={beforeIdx}
              onChange={(e) => setBeforeIdx(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              {timeline.map((entry, idx) => (
                <option key={entry.id} value={idx} disabled={idx >= afterIdx}>
                  {entry.isBaseline
                    ? t('history.dayBaseline')
                    : t('history.daysLater').replace('{d}', lang === 'bn' ? toBnDigits(entry.dayOffset) : entry.dayOffset)}
                  {' — '}
                  {formatDate(entry.created_at, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-600 font-medium mb-1">{t('history.after')}:</label>
            <select
              value={afterIdx}
              onChange={(e) => setAfterIdx(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              {timeline.map((entry, idx) => (
                <option key={entry.id} value={idx} disabled={idx <= beforeIdx}>
                  {t('history.daysLater').replace('{d}', lang === 'bn' ? toBnDigits(entry.dayOffset) : entry.dayOffset)}
                  {' — '}
                  {formatDate(entry.created_at, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col items-center text-center space-y-1.5 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            {t('history.before')}
          </span>
          <Thumb
            blob={beforeEntry.thumb_jpeg}
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="text-xs font-bold text-gray-800 line-clamp-1">
            {getEntryDiagnosis(beforeEntry, lang, t)}
          </div>
          <div className="text-[10px] text-gray-500">
            {formatDate(beforeEntry.created_at, lang)}
          </div>
        </div>

        {/* After Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col items-center text-center space-y-1.5 shadow-xs">
          <span className="text-[11px] font-semibold text-leaf-700 uppercase tracking-wider">
            {t('history.after')}
          </span>
          <Thumb
            blob={afterEntry.thumb_jpeg}
            className="w-full h-32 object-cover rounded-lg border border-leaf-300"
          />
          <div className="text-xs font-bold text-gray-800 line-clamp-1">
            {getEntryDiagnosis(afterEntry, lang, t)}
          </div>
          <div className="text-[10px] text-gray-500">
            {formatDate(afterEntry.created_at, lang)}
          </div>
        </div>
      </div>

      {/* Progression Evaluation Banner */}
      <div
        data-testid="progression-banner"
        className={`rounded-xl p-3 border text-xs space-y-1 ${
          evalResult.improved
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : evalResult.persistent
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5">
          <span>{evalResult.improved ? '✓' : evalResult.persistent ? '⚠️' : 'ℹ️'}</span>
          <span>
            {evalResult.status === 'improved' && t('history.statusImproved')}
            {evalResult.status === 'unchanged' && t('history.statusUnchanged')}
            {evalResult.status === 'worsened' && t('history.statusWorsened')}
            {evalResult.status === 'different_disease' && t('history.statusDifferent')}
            {evalResult.status === 'healthy_maintained' && t('history.statusHealthy')}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed opacity-90">
          {evalResult.improved && t('history.advisoryImprovement')}
          {evalResult.persistent && t('history.advisoryPersistent')}
          {!evalResult.improved && !evalResult.persistent && (
            lang === 'bn'
              ? 'নিয়মিত পরিচর্যা করুন এবং রোগ উপশম না হলে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।'
              : 'Continue regular care. If symptoms do not subside, consult your local agriculture officer.'
          )}
        </p>
      </div>
    </div>
  );
}

