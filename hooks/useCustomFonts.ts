import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { ExportFont } from '@/constants/fonts';

export interface CustomFont {
  id: string;
  label: string;
  family: string;
  fontUrl: string;
  cssStack: string;
}

const STORAGE_KEY = '@CAS:custom_fonts';
const GITHUB_RAW = 'https://raw.githubusercontent.com/google/fonts/main';
const LICENSES = ['ofl', 'apache', 'ufl'] as const;

/** Convert "Imperial Script" → "imperialscript" (GitHub folder convention) */
function fontNameToFolder(fontName: string): string {
  return fontName.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Returns an ordered list of candidate TTF filenames for a given font family.
 * Google Fonts almost always follows "FamilyName-Regular.ttf" convention,
 * with a few variants for fonts that use different separators or variable axes.
 */
function candidateFilenames(name: string): string[] {
  const noSpaces = name.replace(/\s+/g, '');
  return [
    `${noSpaces}-Regular.ttf`,
    `${noSpaces}Regular.ttf`,
    `${noSpaces}.ttf`,
    `${noSpaces}[wght].ttf`,
  ];
}

/**
 * Looks up a Google Font and returns a URL suitable for expo-font loading.
 *
 * Strategy:
 *  1. Validate via the Google Fonts CSS2 API (CDN, very high rate limits — no auth needed).
 *     If the font name is wrong/nonexistent, Google returns 400 and we surface a clear error.
 *  2. Web: extract the font URL directly from Google's CSS response (woff2/woff from Google CDN).
 *  3. Native: derive likely TTF filenames and HEAD-check against GitHub Raw.
 *     Raw file access uses GitHub's CDN and is not subject to the 60/hr Contents API rate limit.
 */
export async function fetchGoogleFontUrl(fontName: string): Promise<string> {
  const name = fontName.trim();

  // Step 1 — validate font exists via Google Fonts CSS API
  const encoded = name.replace(/\s+/g, '+');
  const cssRes = await fetch(
    `https://fonts.googleapis.com/css2?family=${encoded}:wght@400&display=swap`,
  );
  if (!cssRes.ok) {
    throw new Error(
      `"${name}" was not found on Google Fonts — check the spelling and try again`,
    );
  }

  // Step 2 — web: use the font URL directly from Google's CSS (woff2 works fine on web)
  if (Platform.OS === 'web') {
    const css = await cssRes.text();
    const match = css.match(/url\(([^)]+)\)/);
    const url = match?.[1]?.replace(/['"]/g, '');
    if (url) return url;
    // fall through to GitHub raw if CSS parsing failed for some reason
  }

  // Step 3 — native: HEAD-check likely TTF paths on GitHub Raw (no rate limit)
  const folder = fontNameToFolder(name);
  const candidates = candidateFilenames(name);

  for (const license of LICENSES) {
    for (const filename of candidates) {
      const url = `${GITHUB_RAW}/${license}/${folder}/${filename}`;
      try {
        const r = await fetch(url, { method: 'HEAD' });
        if (r.ok) return url;
      } catch {
        // network error on this candidate — try the next one
      }
    }
  }

  throw new Error(
    `"${name}" was not found on Google Fonts — check the spelling and try again`,
  );
}

export function customFontFamilyKey(label: string) {
  return `CustomFont_${label.trim().replace(/\s+/g, '_')}`;
}

export function useCustomFonts() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored: CustomFont[] = JSON.parse(raw);
        Promise.all(
          stored.map((f) =>
            Font.loadAsync({ [f.family]: { uri: f.fontUrl } }).catch(() => {}),
          ),
        ).then(() => setCustomFonts(stored));
      })
      .catch(() => {});
  }, []);

  const addCustomFont = useCallback(
    async (label: string, family: string, fontUrl: string) => {
      const id = `custom-${label.toLowerCase().replace(/\s+/g, '-')}`;
      const newFont: CustomFont = {
        id,
        label,
        family,
        fontUrl,
        cssStack: `'${label}', Georgia, serif`,
      };
      setCustomFonts((prev) => {
        const updated = [...prev.filter((f) => f.id !== id), newFont];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [],
  );

  const removeCustomFont = useCallback((id: string) => {
    setCustomFonts((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const asExportFonts = useCallback(
    (): ExportFont[] =>
      customFonts.map((f) => ({
        id: f.id,
        label: f.label,
        family: f.family,
        cssStack: f.cssStack,
        category: 'sans' as const,
      })),
    [customFonts],
  );

  return { customFonts, addCustomFont, removeCustomFont, asExportFonts };
}
