import React from 'react';
import useT from '../i18n/useT.js';

export default function CallHelpButton({ className = '' }) {
  const { t } = useT();

  return (
    <div className={`w-full max-w-sm flex flex-col items-center ${className}`}>
      <a
        href="tel:16123"
        className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm text-center flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-label={t('callKrishiHelp')}
      >
        <span>{t('callKrishiHelp')}</span>
      </a>
      <span className="text-[11px] text-gray-500 mt-1.5 text-center">
        {t('callChargeNote')}
      </span>
    </div>
  );
}
