import React from 'react';
import useT from '../i18n/useT.js';

export default function LanguageToggle() {
  const { lang, toggleLang, t } = useT();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] px-3 py-1.5 text-sm font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-700/10 active:bg-leaf-700/20 border border-leaf-700/30 rounded-lg transition-colors cursor-pointer"
      aria-label={`Switch to ${lang === 'bn' ? 'English' : 'Bangla'}`}
    >
      <span className="font-bold">{t('langSwitch')}</span>
    </button>
  );
}
