import React from 'react';
import useT from '../i18n/useT.js';
import AudioExplain from './AudioExplain.jsx';

export default function NotSureCard({
  top2 = [],
  diseaseInfo = {},
  className = '',
}) {
  const { lang, t } = useT();
  const notSureData = diseaseInfo?.not_sure || {};

  const nameBn = notSureData.name_bn || t('notSureTitle');
  const nameEn = notSureData.name_en || 'Not sure';

  const title = lang === 'en' ? nameEn : nameBn;
  const secondaryTitle = lang === 'en' ? nameBn : nameEn;

  const meaning = lang === 'en'
    ? (notSureData.meaning_en || 'The model is not confident enough. Saying "not sure" is safer than a wrong guess.')
    : (notSureData.meaning_bn || 'ছবিটি দেখে আমি নিশ্চিত হতে পারছি না। ভুল পরামর্শ দেওয়ার চেয়ে না বলাই ভালো।');

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md mx-auto rounded-3xl p-4 sm:p-5 border border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-white text-left shadow-xs min-w-0 break-words ${className}`}
    >
      {/* Top Header Status Chip */}
      <div className="flex items-center justify-between mb-3 min-w-0">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-300">
          🤔 {t('notSureTitle')}
        </span>
      </div>

      {/* Main Title & Secondary Title */}
      <div className="mb-2 min-w-0">
        <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight text-gray-900 break-words">
          {title}
        </h2>
        {secondaryTitle && (
          <p className="text-xs sm:text-sm text-gray-500 italic mt-0.5 break-words">
            {secondaryTitle}
          </p>
        )}
      </div>
      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4 break-words">
        {meaning}
      </p>

      {/* Bangla Audio Explanation */}
      <AudioExplain
        classKey="not_sure"
        voiceScriptBn={notSureData?.voice_script_bn}
      />

      {/* Top-2 Possible Conditions (No Percentages) */}
      {top2 && top2.length > 0 && (
        <div className="mb-5 p-3.5 bg-amber-100/40 border border-amber-200/70 rounded-2xl">
          <span className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
            🌱 {t('notSurePossibly')}:
          </span>
          <div className="flex flex-wrap gap-2">
            {top2.map((item) => {
              const meta = diseaseInfo[item.key] || {};
              const name = lang === 'en' ? (meta.name_en || item.key) : (meta.name_bn || item.key);
              return (
                <span
                  key={item.key}
                  className="px-3 py-1 bg-white border border-amber-300/80 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 3 Pictogram Retake Tips */}
      <div className="mb-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {t('previewTitle')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-amber-200 rounded-xl p-2 flex flex-col items-center text-center shadow-2xs">
            <span className="text-xl mb-1" aria-hidden="true">🍃</span>
            <span className="text-[11px] font-bold text-gray-700 leading-tight">
              {t('tipOneLeaf')}
            </span>
          </div>
          <div className="bg-white border border-amber-200 rounded-xl p-2 flex flex-col items-center text-center shadow-2xs">
            <span className="text-xl mb-1" aria-hidden="true">☀️</span>
            <span className="text-[11px] font-bold text-gray-700 leading-tight">
              {t('tipDaylight')}
            </span>
          </div>
          <div className="bg-white border border-amber-200 rounded-xl p-2 flex flex-col items-center text-center shadow-2xs">
            <span className="text-xl mb-1" aria-hidden="true">🔍</span>
            <span className="text-[11px] font-bold text-gray-700 leading-tight">
              {t('tipCloseUp')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
