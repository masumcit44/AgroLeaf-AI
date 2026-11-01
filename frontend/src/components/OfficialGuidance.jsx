import React, { useState } from 'react';
import useT from '../i18n/useT.js';
import { shouldShowOfficialGuidance } from '../lib/resultRules.js';

export default function OfficialGuidance({ guidance, className = '' }) {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);

  if (!shouldShowOfficialGuidance(guidance)) {
    return null;
  }

  return (
    <div className={`w-full mt-4 border border-blue-200 rounded-xl overflow-hidden bg-blue-50/40 text-left ${className}`}>
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-3.5 flex items-center justify-between text-left text-blue-900 font-bold text-sm hover:bg-blue-100/50 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span>🏛️</span>
          <span>{isOpen ? t('hideOfficialAdvice') : t('seeOfficialAdvice')}</span>
        </span>
        <span className="text-xs transition-transform duration-200 text-blue-700" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Accordion Content Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-blue-200/60 text-xs sm:text-sm text-gray-800 space-y-3">
          {/* Verbatim Official Text */}
          <div className="p-3 bg-white rounded-lg border border-blue-100 text-gray-900 font-medium leading-relaxed">
            {guidance.text_bn_verbatim}
          </div>

          {/* Warning Banner */}
          <div className="p-2.5 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs font-semibold leading-snug">
            ⚠️ {t('officialWarning')}
          </div>

          {/* Source Attribution & Link */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 pt-1 border-t border-blue-100">
            <span>
              <strong>{t('officialSource')}:</strong> {guidance.source}
            </span>
            {guidance.url && (
              <a
                href={guidance.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-semibold underline hover:text-blue-800"
              >
                বামিস পোর্টাল লিংক ↗
              </a>
            )}
            {guidance.retrieved && (
              <span className="w-full text-right text-gray-400">
                {t('officialRetrieved')}: {guidance.retrieved}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
