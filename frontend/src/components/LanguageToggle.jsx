import React from 'react';
import useT from '../i18n/useT.js';

export default function LanguageToggle() {
  const { lang, toggleLang, t } = useT();

  const isBn = lang === 'bn';
  const labelPrefix = isBn ? 'EN English' : 'বাং বাংলা';
  const targetName = isBn ? 'English' : 'Bangla';

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex items-center justify-center min-w-[40px] sm:min-w-[48px] min-h-[44px] px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-700/10 active:bg-leaf-700/20 border border-leaf-700/30 rounded-lg transition-colors cursor-pointer"
      aria-label={`${labelPrefix} - Switch to ${targetName}`}
    >
      <span className="font-bold hidden sm:inline">{t('langSwitch')}</span>
      <span className="font-bold sm:hidden">{lang === 'bn' ? 'EN' : 'বাং'}</span>
    </button>
  );
}
