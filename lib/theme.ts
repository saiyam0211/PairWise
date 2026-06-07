import { useColorScheme } from 'nativewind';
import {
  BRAND_CREAM,
  BRAND_CREAM_BG,
  BRAND_INK,
  BRAND_INK_MUTED,
  BRAND_PEACH,
  BRAND_PEACH_POP,
  BRAND_SAGE,
  BRAND_SAGE_DEEP,
  BRAND_SAGE_POP,
} from '@/lib/brand';

export type ThemePreference = 'light' | 'dark';

/** PairWise expressive palette — warm, rounded, sage & peach. */
export interface ThemePalette {
  background: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  tertiary: string;
  sage: string;
  peach: string;
  cream: string;
  budgetGood: string;
  budgetGoodText: string;
  budgetCard: string;
  budgetCardText: string;
  budgetOver: string;
  accent: string;
  onAccent: string;
  dateHeader: string;
  keyBg: string;
  keyBgDark: string;
  border: string;
}

const light: ThemePalette = {
  background: BRAND_CREAM_BG,
  surface: '#FFFCF9',
  surfaceVariant: '#EDE8E1',
  onSurface: BRAND_INK,
  onSurfaceVariant: BRAND_INK_MUTED,
  primary: BRAND_SAGE_DEEP,
  onPrimary: '#FFFFFF',
  primaryContainer: '#E4EBE1',
  onPrimaryContainer: '#2A3328',
  secondary: BRAND_PEACH_POP,
  onSecondary: '#FFFFFF',
  tertiary: BRAND_PEACH,
  sage: BRAND_SAGE,
  peach: BRAND_PEACH,
  cream: BRAND_CREAM,
  budgetGood: BRAND_SAGE_POP,
  budgetGoodText: '#FFFFFF',
  budgetCard: BRAND_SAGE_DEEP,
  budgetCardText: '#FFFFFF',
  budgetOver: '#D64545',
  accent: BRAND_SAGE_DEEP,
  onAccent: '#FFFFFF',
  dateHeader: BRAND_SAGE_POP,
  keyBg: '#F0EBE4',
  keyBgDark: '#E2DDD5',
  border: '#E0DBD3',
};

const dark: ThemePalette = {
  background: '#1C1F1B',
  surface: '#262A25',
  surfaceVariant: '#353932',
  onSurface: '#EDE8E1',
  onSurfaceVariant: '#A8ACA4',
  primary: '#B5C4AE',
  onPrimary: '#1C2A18',
  primaryContainer: '#3D4A38',
  onPrimaryContainer: '#E4EBE1',
  secondary: BRAND_PEACH_POP,
  onSecondary: '#3D2A1E',
  tertiary: BRAND_PEACH,
  sage: '#8FA088',
  peach: '#D4A88A',
  cream: '#3D4A38',
  budgetGood: '#8FA088',
  budgetGoodText: '#1C2A18',
  budgetCard: '#3D4A38',
  budgetCardText: '#E4EBE1',
  budgetOver: '#FF8A80',
  accent: '#B5C4AE',
  onAccent: '#1C2A18',
  dateHeader: '#B5C4AE',
  keyBg: '#353932',
  keyBgDark: '#454943',
  border: '#454943',
};

export function getPalette(isDark: boolean): ThemePalette {
  return isDark ? dark : light;
}

export function useTheme(): { palette: ThemePalette; isDark: boolean } {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return { palette: getPalette(isDark), isDark };
}
