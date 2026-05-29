/**
 * useCinematicDevice.ts — CAS Mobile Cinematic Device Detection
 *
 * Provides phone/tablet detection and cinematic spacing constants.
 * Every CAS mobile screen should use these to avoid shrinking desktop UI.
 */

import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Device form factor: phone = cinematic companion, tablet = directing workstation */
export type DeviceForm = 'phone' | 'tablet';

/** Screen density tier for responsive typography */
export type DensityTier = 'compact' | 'regular' | 'spacious';

export interface CinematicDevice {
  /** 'phone' = single column cinematic, 'tablet' = immersive multi-column */
  form: DeviceForm;
  /** How dense the UI should feel */
  density: DensityTier;
  /** True for compact phones (iPhone SE, mini, small Android) */
  isCompactPhone: boolean;
  /** Screen width */
  width: number;
  /** Screen height */
  height: number;
  /** Whether this is a portrait orientation */
  isPortrait: boolean;
}

/** Cinematic spacing tokens — phone vs tablet distinction is critical */
export const CINEMATIC = {
  /** Phone: single-column cinematic cards. Tablet: multi-column layout. */
  phone: {
    cardPadding: 20,
    cardMarginVertical: 14,
    cardBorderRadius: 18,
    cardMinHeight: 120,
    titleSize: 18,
    subtitleSize: 14,
    eyebrowSize: 10,
    bodySize: 13,
    sectionGap: 20,
    horizontalPadding: 16,
    chipPadding: { h: 14, v: 7 },
    chipBorderRadius: 18,
    touchTargetMin: 44,
    headerHeight: 56,
    bottomSafeBuffer: 20,
    cardElevation: 8,
    gradientIntensity: 0.25,
  },
  tablet: {
    cardPadding: 24,
    cardMarginVertical: 16,
    cardBorderRadius: 20,
    cardMinHeight: 140,
    titleSize: 22,
    subtitleSize: 16,
    eyebrowSize: 11,
    bodySize: 14,
    sectionGap: 28,
    horizontalPadding: 28,
    chipPadding: { h: 16, v: 8 },
    chipBorderRadius: 20,
    touchTargetMin: 48,
    headerHeight: 64,
    bottomSafeBuffer: 24,
    cardElevation: 12,
    gradientIntensity: 0.2,
  },
} as const;

/** Typography scaling for cinematic emotional readability */
export const TYPOGRAPHY = {
  phone: {
    hero: 28,
    h1: 22,
    h2: 18,
    h3: 16,
    body: 14,
    caption: 12,
    micro: 10,
    lineHeightMultiplier: 1.5,
    letterSpacingWide: 2,
    letterSpacingNormal: 0.5,
  },
  tablet: {
    hero: 36,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 15,
    caption: 13,
    micro: 11,
    lineHeightMultiplier: 1.6,
    letterSpacingWide: 2.5,
    letterSpacingNormal: 0.5,
  },
} as const;

export function useCinematicDevice(): CinematicDevice {
  const { width, height } = useWindowDimensions();
  const form: DeviceForm = width >= 768 ? 'tablet' : 'phone';
  const isPortrait = height > width;

  const density: DensityTier = useMemo(() => {
    if (width < 360) return 'compact';
    if (width < 414) return 'regular';
    return 'spacious';
  }, [width]);

  return {
    form,
    density,
    isCompactPhone: form === 'phone' && density === 'compact',
    width,
    height,
    isPortrait,
  };
}

/** Get the right spacing token set for the current device */
export function useCinematicSpacing() {
  const { form } = useCinematicDevice();
  return CINEMATIC[form];
}

/** Get typography tokens for the current device */
export function useCinematicType() {
  const { form } = useCinematicDevice();
  return TYPOGRAPHY[form];
}

/**
 * Safe area helpers for iPhone notch / Dynamic Island and Android gesture bar.
 * Use this instead of raw insets.top/insets.bottom for cinematic spacing.
 */
export function useCinematicInsets() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // iPhone 14 Pro / 15 / 16 Dynamic Island detection (top inset > 50)
  const hasDynamicIsland = Platform.OS === 'ios' && insets.top > 50;
  // Standard notch (top inset between 44-50)
  const hasNotch = Platform.OS === 'ios' && insets.top > 40 && insets.top <= 50;
  // Android gesture navigation (bottom inset typically 0 or small)
  const isAndroidGesture = Platform.OS === 'android' && insets.bottom < 12;

  // Add breathing room for the dynamic island
  const top = Platform.OS === 'web' ? 20 : insets.top + (hasDynamicIsland ? 4 : 0);
  // Android: add gesture bar padding; iOS: use safe area
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom + (isAndroidGesture ? 16 : 8);
  // Extra horizontal padding on phones with curved edges (Samsung, newer iPhones)
  const horizontal = Math.max(16, insets.left + insets.right > 0 ? 20 : 16);

  return {
    top,
    bottom,
    horizontal,
    hasDynamicIsland,
    hasNotch,
    isAndroidGesture,
    screenArea: width * height,
    /** True if this is a very small screen (iPhone SE gen 1-3, small Android) */
    isCompact: width < 375,
  };
}
