import { useI18n } from './I18nContext.js';

export default function useT() {
  const { t, lang, toggleLang, setLang } = useI18n();
  return { t, lang, toggleLang, setLang };
}
