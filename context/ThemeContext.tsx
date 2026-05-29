import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { ColorPalette, themes, ThemeName } from '@/constants/colors';

const THEME_KEY = '@bloomscript:theme_preference';

interface ThemeContextValue {
  themeName: ThemeName;
  colors: ColorPalette & { radius: number };
  setTheme: (name: ThemeName) => Promise<void>;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'classic',
  colors: { ...themes.classic, radius: 14 },
  setTheme: async () => {},
  isLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('classic');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored && stored in themes) {
          setThemeName(stored as ThemeName);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setTheme = useCallback(async (name: ThemeName) => {
    setThemeName(name);
    try {
      await AsyncStorage.setItem(THEME_KEY, name);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        colors: { ...themes[themeName], radius: 14 },
        setTheme,
        isLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
