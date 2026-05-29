import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import pt from '../locales/pt.json';
import it from '../locales/it.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';
import ar from '../locales/ar.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '中文（简体）' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function initI18n(languageCode: string = DEFAULT_LANGUAGE) {
  if (i18n.isInitialized) {
    if (i18n.language !== languageCode) {
      i18n.changeLanguage(languageCode);
    }
    return i18n;
  }

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: languageCode,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
      ja: { translation: ja },
      zh: { translation: zh },
      ar: { translation: ar },
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18n;
}

export default i18n;
