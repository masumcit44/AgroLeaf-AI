import React, { useEffect, useState } from 'react';
import bn from './bn.js';
import en from './en.js';
import { I18nContext } from './I18nContext.js';
import { mergeFeatureTexts } from './mergeFeatureTexts.js';

const STORAGE_KEY = 'agroleaf_lang';

// Each feature keeps its own texts in features/<name>/i18n.js (owned by that feature's agent);
// they are merged here so no two agents edit bn.js / en.js at the same time.
const FEATURE_TEXTS = import.meta.glob('../features/*/i18n.js', { eager: true, import: 'default' });
const DICTIONARIES = { bn: mergeFeatureTexts(bn, FEATURE_TEXTS, 'bn'), en: mergeFeatureTexts(en, FEATURE_TEXTS, 'en') };

export function I18nProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => {
    if (initialLang === 'en' || initialLang === 'bn') return initialLang;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') {
        return saved;
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
    return 'bn';
  });

  const setLang = (newLang) => {
    if (newLang !== 'bn' && newLang !== 'en') return;
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore storage write errors
    }
  };

  const toggleLang = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const dict = DICTIONARIES[lang] || DICTIONARIES.bn;

  const t = (key) => {
    if (dict[key] !== undefined) {
      return dict[key];
    }
    return DICTIONARIES.bn[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
