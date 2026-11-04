// Feature confidenceScore (ConfidenceScoreCard)
// Surfaces the calibrated prediction confidence (scan.decision.top.prob) as a
// user-facing badge on the result screen.
//
// Badge thresholds (calibrated probability):
//   >= 0.90  → High   (green)
//   0.70–0.89 → Medium (amber)
//   < 0.70   → Low    (red)
//
// Supplementary prompts:
//   < 0.60 → retake photo
//   < 0.50 → also call helpline 16123
//
// Never shown for not_sure / not_rice / inconclusive decisions.

import React from 'react';
import useT from '../../i18n/useT.js';

/** Returns badge config for a given 0–100 pct value */
function getBadgeConfig(pct) {
  if (pct >= 90) {
    return {
      key: 'high',
      barColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      textClass: 'text-emerald-700',
    };
  }
  if (pct >= 70) {
    return {
      key: 'medium',
      barColor: 'bg-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      textClass: 'text-amber-700',
    };
  }
  return {
    key: 'low',
    barColor: 'bg-red-500',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    textClass: 'text-red-700',
  };
}

export function ConfidenceScoreCard({ scan, context }) {
  const { t } = useT();

  // Only render in result context with a valid scan
  if (context !== 'result' || !scan) return null;

  const decision = scan.decision;
  if (!decision) return null;

  // Hide for not_sure, inconclusive, or missing decisions
  const status = decision.status;
  if (status !== 'confident') return null;

  const top = decision.top;
  if (!top || top.key === 'not_rice' || top.key === 'not_sure') return null;

  const prob = typeof top.prob === 'number' ? top.prob : null;
  if (prob === null || prob < 0 || prob > 1) return null;

  const pct = Math.round(prob * 100);
  const badge = getBadgeConfig(pct);
  const showRetake = pct < 60;
  const showHelpline = pct < 50;

  return (
    <div
      data-testid="confidence-score-card"
      className="mt-3 p-3.5 rounded-xl border bg-white shadow-xs space-y-3"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          {t('confidenceScore.cardTitle')}
        </span>
        <span
          data-testid="confidence-badge"
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.badgeClass}`}
        >
          {t(`confidenceScore.badge_${badge.key}`)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t('confidenceScore.confidenceLabel')}</span>
          <span
            data-testid="confidence-pct"
            className={`font-mono font-bold text-sm ${badge.textClass}`}
          >
            {pct}%
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${t('confidenceScore.confidenceLabel')} ${pct}%`}
        >
          <div
            className={`h-full rounded-full transition-all ${badge.barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Retake photo prompt (<60%) */}
      {showRetake && (
        <div
          data-testid="confidence-retake-prompt"
          className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
        >
          <span className="text-lg shrink-0" aria-hidden="true">📷</span>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-900">
              {t('confidenceScore.retakePhoto')}
            </p>
            <p className="text-xs text-amber-700">
              {t('confidenceScore.retakePhotoSub')}
            </p>
          </div>
        </div>
      )}

      {/* Helpline prompt (<50%) */}
      {showHelpline && (
        <a
          href="tel:16123"
          data-testid="confidence-helpline-prompt"
          className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 no-underline min-h-[44px]"
        >
          <span className="text-lg shrink-0" aria-hidden="true">📞</span>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-red-900">
              {t('confidenceScore.callHelpline')}
            </p>
            <p className="text-xs text-red-700">
              {t('confidenceScore.callHelplineSub')}
            </p>
          </div>
        </a>
      )}
    </div>
  );
}

export default ConfidenceScoreCard;
