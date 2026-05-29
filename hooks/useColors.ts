import { useTheme } from '@/context/ThemeContext';

/**
 * Returns the design tokens for the user's chosen color scheme.
 *
 * Theme preference is persisted in AsyncStorage and set during onboarding
 * or from the profile settings. Falls back to 'classic' until loaded.
 */
export function useColors() {
  const { colors } = useTheme();
  return colors;
}
