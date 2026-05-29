import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_LANGUAGE, initI18n, LanguageCode, SUPPORTED_LANGUAGES } from '@/lib/i18n';

const LANGUAGE_KEY = '@bloomscript:language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => {},
  isLoading: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        const code = (stored ?? DEFAULT_LANGUAGE) as LanguageCode;
        const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === code);
        const resolved = isValid ? code : DEFAULT_LANGUAGE;
        initI18n(resolved);
        setLanguageState(resolved);
      } catch {
        initI18n(DEFAULT_LANGUAGE);
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
      const i18n = initI18n(code);
      await i18n.changeLanguage(code);
      setLanguageState(code);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {isLoading ? null : children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
