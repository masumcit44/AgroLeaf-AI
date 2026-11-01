import React from 'react';
import useT from '../i18n/useT.js';
import { getConfidenceLabel } from '../lib/resultRules.js';
import OfficialGuidance from './OfficialGuidance.jsx';
import AudioExplain from './AudioExplain.jsx';

export default function ResultCard({
  classKey,
  prob,
  diseaseData,
  className = '',
}) {
  const { lang, t } = useT();
  const isHealthy = classKey === 'healthy';

  const nameBn = diseaseData?.name_bn || classKey;
  const nameEn = diseaseData?.name_en || classKey;
  const title = lang === 'en' ? nameEn : nameBn;
  const subtitle = lang === 'en' ? (diseaseData?.scientific_name || nameBn) : nameEn;

  const meaning = lang === 'en' ? (diseaseData?.meaning_en || diseaseData?.meaning_bn) : diseaseData?.meaning_bn;
  const symptoms = (lang === 'en' ? (diseaseData?.symptoms_en || diseaseData?.symptoms_bn) : diseaseData?.symptoms_bn) || [];
  const prevention = (lang === 'en' ? (diseaseData?.prevention_en || diseaseData?.prevention_bn) : diseaseData?.prevention_bn) || [];

  // What to do now (English fallback rule: askOfficer if no EN text)
  const whatToDo = lang === 'en'
    ? (diseaseData?.what_to_do_now_en || t('askOfficer'))
    : (diseaseData?.what_to_do_now_bn || t('askOfficer'));

  const confidenceLabel = getConfidenceLabel(prob, lang);

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md mx-auto rounded-3xl p-4 sm:p-5 border text-left shadow-xs transition-colors min-w-0 break-words ${
        isHealthy
          ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-300/80 text-emerald-950'
          : 'bg-white border-gray-200/90 text-gray-900'
      } ${className}`}
    >
      {/* Top Header: Status Chip + Confidence Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
            isHealthy
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {isHealthy ? `🌱 ${t('healthyLeaf')}` : `⚠️ ${t('possibleProblem')}`}
        </span>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
            prob >= 0.90
              ? 'bg-leaf-50 text-leaf-700 border-leaf-700/30'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {confidenceLabel}
        </span>
      </div>

      {/* Big Title & Subtitle */}
      <div className="mb-4 min-w-0">
        <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight text-gray-900 break-words">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 italic mt-0.5 break-words">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bangla Audio Explanation */}
      <AudioExplain
        classKey={classKey}
        voiceScriptBn={diseaseData?.voice_script_bn}
      />

      {/* Section: What is this? (Meaning) */}
      {meaning && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {t('sectionWhatIsThis')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {meaning}
          </p>
        </div>
      )}

      {/* Section: Symptoms (if present) */}
      {symptoms.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {t('sectionSymptoms')}
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 leading-snug">
            {symptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section: What to do now (Highlighted Action Box) */}
      {whatToDo && (
        <div
          className={`p-3.5 rounded-2xl border mb-4 text-xs sm:text-sm leading-relaxed ${
            isHealthy
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
              : 'bg-leaf-50 border-leaf-700/30 text-leaf-800 font-medium'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0" aria-hidden="true">
              {isHealthy ? '🌾' : '💡'}
            </span>
            <div>
              <span className="block font-bold text-xs uppercase tracking-wide mb-0.5">
                {t('sectionWhatToDo')}
              </span>
              <span>{whatToDo}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section: Prevention */}
      {prevention.length > 0 && (
        <div className="mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {t('sectionPrevention')}
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 leading-snug">
            {prevention.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Official Guidance Accordion */}
      <OfficialGuidance guidance={diseaseData?.official_guidance} />
    </div>
  );
}
