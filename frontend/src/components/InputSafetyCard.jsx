import React, { useState } from 'react';
import useT from '../i18n/useT.js';
import { INPUT_SAFETY_TIP_KEYS } from '../lib/inputSafety.js';

// F7 anti-counterfeit input awareness (documentation/features/F7_ANTI_COUNTERFEIT_CARD.md).
// Farmers cannot reliably spot a fake pesticide by looking at it, so the card teaches the
// checks that do work (registered brand, licensed dealer, label basics) and how to report
// a suspected fake. It names no product and no dose.

export default function InputSafetyCard({ className = '' }) {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`w-full mt-4 border border-orange-200 rounded-xl overflow-hidden bg-orange-50/40 text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-3.5 flex items-center justify-between text-left text-orange-900 font-bold text-sm hover:bg-orange-100/50 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true">🛡️</span>
          <span>{t('inputSafetyTitle')}</span>
        </span>
        <span className="text-xs transition-transform duration-200 text-orange-700" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-orange-200/60 text-xs sm:text-sm text-gray-800 space-y-3">
          <p className="leading-relaxed">{t('inputSafetyIntro')}</p>
          <ol className="list-decimal pl-5 space-y-1.5 leading-snug">
            {INPUT_SAFETY_TIP_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
          <div className="text-[11px] text-gray-500 pt-1 border-t border-orange-100">
            {t('inputSafetySource')}
          </div>
        </div>
      )}
    </div>
  );
}
