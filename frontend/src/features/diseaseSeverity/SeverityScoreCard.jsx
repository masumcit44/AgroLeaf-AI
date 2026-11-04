import React, { useMemo } from 'react';
import useT from '../../i18n/useT.js';
import { measureLeafAndLesion, assessDiseaseSeverity } from './severityEngine.js';

function toBnDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

export function SeverityScoreCard({ scan, context }) {
  const { t, lang } = useT();

  const assessment = useMemo(() => {
    if (!scan || context !== 'result') return null;

    const canvas = scan.canvas;
    const measurement = measureLeafAndLesion(canvas);

    if (!measurement.valid && measurement.reason === 'insufficient_leaf_area') {
      return {
        status: 'abstain',
        reason: 'insufficient_leaf_area',
        level: null,
        coveragePct: 0,
      };
    }

    return assessDiseaseSeverity(scan.classKey, measurement.coveragePct, scan.decision);
  }, [scan, context]);

  if (!assessment || assessment.status === 'not_applicable') {
    return null;
  }

  // Handle Abstention State (Honest Transparency)
  if (assessment.status === 'abstain') {
    let reasonText = t('diseaseSeverity.abstainInconclusive');
    if (assessment.reason === 'tungro_systemic_limitation') {
      reasonText = t('diseaseSeverity.abstainTungro');
    } else if (assessment.reason === 'sheath_blight_height_limitation') {
      reasonText = t('diseaseSeverity.abstainSheathBlight');
    } else if (assessment.reason === 'insufficient_leaf_area') {
      reasonText = t('diseaseSeverity.abstainInsufficientLeaf');
    }

    return (
      <div
        data-testid="severity-card-abstain"
        className="w-full max-w-sm rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5 shadow-xs"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <span className="text-sm">⚠️</span>
          <span>{t('diseaseSeverity.abstainTitle')}</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          {reasonText}
        </p>
        <div className="pt-1 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900 font-medium">
          <span>{t('diseaseSeverity.helplinePrompt')}</span>
          <a href="tel:16123" className="font-bold underline text-leaf-800">16123</a>
        </div>
      </div>
    );
  }

  // Assessed State
  const { level, irriScale, coveragePct, methodNameBn, methodNameEn } = assessment;

  const badgeConfig = {
    low: {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      label: t('diseaseSeverity.levelLow'),
      icon: '🟢',
    },
    medium: {
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      label: t('diseaseSeverity.levelMedium'),
      icon: '🟡',
    },
    high: {
      bg: 'bg-red-100 text-red-800 border-red-300',
      label: t('diseaseSeverity.levelHigh'),
      icon: '🔴',
    },
  }[level || 'medium'];

  const coverageFormatted = lang === 'bn' ? toBnDigits(coveragePct) : String(coveragePct);
  const irriFormatted = irriScale !== null && irriScale !== undefined
    ? (lang === 'bn' ? toBnDigits(irriScale) : String(irriScale))
    : null;

  // Disease specific BRRI/DAE recommendation actions
  const actions = [];
  const ck = (scan.classKey || '').toLowerCase();
  if (ck === 'blast') {
    if (level === 'low') actions.push(t('diseaseSeverity.actionBlastLow'));
    else if (level === 'medium') actions.push(t('diseaseSeverity.actionBlastMed'));
    else actions.push(t('diseaseSeverity.actionBlastHigh'));
  } else if (ck === 'brown_spot') {
    if (level === 'low') actions.push(t('diseaseSeverity.actionBrownSpotLow'));
    else if (level === 'medium') actions.push(t('diseaseSeverity.actionBrownSpotMed'));
    else actions.push(t('diseaseSeverity.actionBrownSpotHigh'));
  } else {
    actions.push(t('diseaseSeverity.actionDefault'));
  }

  return (
    <section
      data-testid="disease-severity-card"
      aria-label={t('diseaseSeverity.title')}
      className="w-full max-w-sm rounded-2xl border-2 border-leaf-600/30 bg-white p-4 space-y-3.5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-block text-[10px] font-bold tracking-wider text-leaf-800 uppercase bg-leaf-100 px-2 py-0.5 rounded-full mb-1">
            {t('diseaseSeverity.badge')}
          </span>
          <h2 className="text-base font-bold text-gray-900">{t('diseaseSeverity.title')}</h2>
        </div>
        <div
          data-testid="severity-level-badge"
          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${badgeConfig.bg}`}
        >
          <span>{badgeConfig.icon}</span>
          <span>{badgeConfig.label}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/80">
          <div className="text-[11px] text-gray-500 font-medium">{t('diseaseSeverity.metricAffectedArea')}</div>
          <div className="text-base font-extrabold text-gray-900 mt-0.5">
            ~{coverageFormatted}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/80">
          <div className="text-[11px] text-gray-500 font-medium">{t('diseaseSeverity.metricIrriScale')}</div>
          <div className="text-base font-extrabold text-gray-900 mt-0.5">
            {irriFormatted ? `${irriFormatted} / ${lang === 'bn' ? '৯' : '9'}` : '—'}
          </div>
        </div>
      </div>

      {/* Scientific Standard Tag */}
      <div className="text-[11px] text-gray-600 bg-leaf-50/60 rounded-lg px-2.5 py-1.5 border border-leaf-200/60 flex items-center justify-between">
        <span className="font-semibold text-leaf-900">{t('diseaseSeverity.scientificStandard')}:</span>
        <span className="font-medium text-gray-700">{lang === 'bn' ? methodNameBn : methodNameEn}</span>
      </div>

      {/* Recommended Next Actions */}
      <div className="space-y-1.5">
        <div className="text-xs font-bold text-gray-800">{t('diseaseSeverity.recommendedActions')}</div>
        <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
          {actions.map((act, i) => (
            <li key={i}>{act}</li>
          ))}
        </ul>
      </div>

      {/* Limitation Disclaimer */}
      <p className="text-[10px] text-gray-500 italic leading-snug border-t border-gray-100 pt-2">
        {t('diseaseSeverity.limitation')}
      </p>
    </section>
  );
}
