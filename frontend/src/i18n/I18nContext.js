import { createContext, useContext } from 'react';

export const I18nContext = createContext({
  lang: 'bn',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}
