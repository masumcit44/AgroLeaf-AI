import React from 'react';
import useT from '../../i18n/useT.js';
import { reliabilityBand } from './bands.js';

function formatNumber(num, lang) {
  const str = String(num);
  if (lang !== 'bn') return str;
  return str.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
}

/** [result] Reliability band + what it measured on independent tests. */
export function ReliabilityNote({ scan }) {
  const { t, lang } = useT();

  if (!scan?.decision) return null;

  const band = reliabilityBand(scan.decision, scan.probs);
  const { band: bandKey, percentage, ciLow, ciHigh, n } = band;

  const badgeColor = {
    high: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    not_sure: 'bg-slate-100 text-slate-800 border-slate-300',
  }[bandKey] || 'bg-slate-100 text-slate-800 border-slate-300';

  const badgeText = t(`reliability.badge_${bandKey}`);

  const accuracyText = (bandKey === 'high' || bandKey === 'medium')
    ? t('reliability.tested_accuracy').replace('{n}', formatNumber(percentage, lang))
    : t('reliability.not_sure_hint');

  const ciText = (bandKey === 'high' || bandKey === 'medium')
    ? t('reliability.ci_range')
        .replace('{low}', formatNumber(Math.round(ciLow * 100), lang))
        .replace('{high}', formatNumber(Math.round(ciHigh * 100), lang))
    : null;

  const samplesText = t('reliability.tested_samples').replace('{n}', formatNumber(n, lang));

  return (
    <div
      data-testid="reliability-note"
      className="mt-3 p-3.5 rounded-xl border bg-white shadow-xs space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span
          data-testid="reliability-badge"
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
        >
          {badgeText}
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {samplesText}
        </span>
      </div>

      <p
        data-testid="reliability-accuracy-text"
        className="text-sm font-medium text-slate-800"
      >
        {accuracyText}
      </p>

      {ciText && (
        <p className="text-xs text-slate-500">
          {ciText}
        </p>
      )}
    </div>
  );
}
