// F26 Yield Impact & Dynamic Risk Intelligence Card
// Farmer-centric decision support answering the 5 essential farmer questions:
// 1. What could happen to my crop? (Untreated vs managed loss)
// 2. How concerning is this? (Multi-cue risk badge)
// 3. Why is this assessment shown? (Disease mechanism + local weather trigger)
// 4. What should I do now? (Non-chemical immediate actions + 16123 helpline)
// 5. Where did this come from? (Collapsible sources & BAMIS/BRRI citations)

import React, { useEffect, useState } from 'react';
import useT from '../../i18n/useT.js';
import { getRiskEnvironmentalContext, extractRiskMetrics } from './yieldRiskStore.js';
import { evaluateRiskContext } from './riskEngine.js';

export function YieldRiskCard({ scan, context }) {
  const { lang, t } = useT();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [envContext, setEnvContext] = useState(null);

  useEffect(() => {
    let active = true;
    getRiskEnvironmentalContext().then((ctx) => {
      if (active) setEnvContext(ctx);
    }).catch(() => {
      if (active) setEnvContext({ status: 'unavailable', weather: null, location: null });
    });
    return () => {
      active = false;
    };
  }, []);

  if (context !== 'result' || !scan) {
    return null;
  }

  // Determine disease class key from scan
  let classKey = scan.classKey || scan.decision?.top?.key;
  if (!classKey && scan.decision?.status === 'inconclusive') {
    classKey = 'not_sure';
  }
  if (!classKey) classKey = 'not_sure';

  // Evaluate risk using pure engine
  const weatherMetrics = extractRiskMetrics(envContext?.weather);
  const evaluation = evaluateRiskContext({
    diseaseClass: classKey,
    weather: weatherMetrics,
  });

  const riskLevel = evaluation.riskLevel; // 'high' | 'medium' | 'low' | 'uncertain'

  const riskBadgeConfig = {
    high: {
      icon: '🔴',
      badgeClass: 'bg-red-50 text-red-900 border-red-300 ring-1 ring-red-200',
      title: t('yieldRisk.levelHigh'),
      headline: t('yieldRisk.headlineHigh'),
    },
    medium: {
      icon: '🟡',
      badgeClass: 'bg-amber-50 text-amber-950 border-amber-300 ring-1 ring-amber-200',
      title: t('yieldRisk.levelModerate'),
      headline: t('yieldRisk.headlineModerate'),
    },
    low: {
      icon: '🟢',
      badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-200',
      title: t('yieldRisk.levelLow'),
      headline: t('yieldRisk.headlineLow'),
    },
    uncertain: {
      icon: '⚪',
      badgeClass: 'bg-gray-100 text-gray-900 border-gray-300 ring-1 ring-gray-200',
      title: t('yieldRisk.levelUncertain'),
      headline: t('yieldRisk.headlineUncertain'),
    },
  }[riskLevel] || {
    icon: '⚪',
    badgeClass: 'bg-gray-100 text-gray-900 border-gray-300 ring-1 ring-gray-200',
    title: t('yieldRisk.levelUncertain'),
    headline: t('yieldRisk.headlineUncertain'),
  };

  const isOffline = envContext?.status === 'offline' || envContext?.status === 'unavailable';

  // Safe fallback for loss ranges if classKey is unrecognized
  const untreatedLoss = t(`yieldRisk.lossRange.${classKey}.untreated`) || t('yieldRisk.lossRange.not_sure.untreated');
  const managedLoss = t(`yieldRisk.lossRange.${classKey}.managed`) || t('yieldRisk.lossRange.not_sure.managed');
  const diseaseReason = t(`yieldRisk.reasons.${classKey}.diseaseReason`) || t('yieldRisk.reasons.other_rice.diseaseReason');
  const weatherReason = t(`yieldRisk.reasons.${classKey}.weatherReason`) || t('yieldRisk.reasons.other_rice.weatherReason');
  const immediateAction = t(`yieldRisk.immediateAction.${classKey}`) || t('yieldRisk.immediateAction.other_rice');

  return (
    <section
      role="region"
      aria-labelledby="yield-risk-title"
      data-testid="yield-risk-card"
      className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-left transition-all"
    >
      {/* 1. Header: Risk Badge & Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🌾</span>
          <h3 id="yield-risk-title" className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
            {t('yieldRisk.cardTitle')}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border yield-risk-band-badge ${riskBadgeConfig.badgeClass}`}
        >
          <span aria-hidden="true">{riskBadgeConfig.icon}</span>
          <span>{riskBadgeConfig.title}</span>
        </span>
      </div>

      {/* Offline Notice if applicable */}
      {isOffline && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5">
          <span aria-hidden="true">📡</span>
          <span>{t('yieldRisk.offlineNotice')}</span>
        </div>
      )}

      {/* 2. Primary Yield Impact Metric (Q1) */}
      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/80 space-y-2">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
          {t('yieldRisk.potentialLossTitle')}
        </span>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-red-50/80 border border-red-200">
            <span className="text-[11px] font-semibold text-red-800 block">
              {t('yieldRisk.lossUntreated')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-red-900 yield-impact-value">
              {untreatedLoss}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 block">
              {t('yieldRisk.lossManaged')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-900">
              {managedLoss}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-700 leading-snug pt-1">
          {riskBadgeConfig.headline}
        </p>
      </div>

      {/* 3. Why this assessment? (Q3) */}
      <div className="space-y-1.5 text-xs sm:text-sm text-gray-700">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
          {t('yieldRisk.whyTitle')}
        </span>
        <ul className="space-y-1 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold shrink-0 mt-0.5" aria-hidden="true">•</span>
            <span>{diseaseReason}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold shrink-0 mt-0.5" aria-hidden="true">•</span>
            <span>{weatherReason}</span>
          </li>
        </ul>
      </div>

      {/* 4. What should I do now? (Q4) */}
      <div className="p-3 bg-leaf-50 border border-leaf-300 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-leaf-900 font-bold text-xs uppercase tracking-wide">
          <span aria-hidden="true">⚡</span>
          <span>{t('yieldRisk.immediateActionTitle')}</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
          {immediateAction}
        </p>
        <div className="pt-1">
          <a
            href="tel:16123"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs sm:text-sm py-2 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span aria-hidden="true">📞</span>
            <span>{lang === 'bn' ? '১৬১২৩ নম্বরে পরামর্শ নিন' : 'Call 16123 Krishi Helpline'}</span>
          </a>
        </div>
      </div>

      {/* 5. Collapsible Accordion: Sources & Methodology (Q5) */}
      <div className="pt-1">
        <button
          type="button"
          id="yield-risk-toggle"
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="w-full min-h-[44px] flex items-center justify-between text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          aria-expanded={detailsOpen}
          aria-controls="yield-risk-sources"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">📖</span>
            <span>{t('yieldRisk.sourcesToggle')}</span>
          </span>
          <span className="text-xs transition-transform duration-200" aria-hidden="true">
            {detailsOpen ? '▲' : '▼'}
          </span>
        </button>

        {detailsOpen && (
          <div
            id="yield-risk-sources"
            className="p-3 mt-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-2 leading-relaxed"
          >
            <div>
              <strong className="text-gray-800">{t('yieldRisk.sourceBrriTitle')}:</strong>{' '}
              {t('yieldRisk.sourceBrriDesc')}
            </div>
            <div>
              <strong className="text-gray-800">{t('yieldRisk.sourceBamisTitle')}:</strong>{' '}
              {t('yieldRisk.sourceBamisDesc')}
            </div>
            <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-200 flex justify-between">
              <span>{t('yieldRisk.lastUpdated')}: {t('yieldRisk.updatedToday')}</span>
              <a
                href="https://www.bamis.gov.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-leaf-700 underline font-semibold"
              >
                BAMIS DAE ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default YieldRiskCard;
