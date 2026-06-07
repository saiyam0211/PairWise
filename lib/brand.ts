/** PairWise identity — sage + peach on warm cream. */
export const BRAND_SAGE = '#A9B3A3';
export const BRAND_SAGE_POP = '#7D9488';
export const BRAND_SAGE_DEEP = '#5C6B58';
export const BRAND_PEACH = '#F2C2A7';
export const BRAND_PEACH_POP = '#E8A882';
export const BRAND_CREAM = '#F5F2ED';
export const BRAND_CREAM_BG = '#FAF7F2';
export const BRAND_INK = '#3D4039';
export const BRAND_INK_MUTED = '#6B6E68';

/** Expressive shape language — bubbly, rounded, friendly. */
export const RADIUS = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export function softShadow(level: 'sm' | 'md' | 'lg' = 'md', isDark = false) {
  const color = isDark ? '#000000' : BRAND_INK;
  const configs = {
    sm: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.25 : 0.06, shadowRadius: 6, elevation: 2 },
    md: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.32 : 0.08, shadowRadius: 14, elevation: 4 },
    lg: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.1, shadowRadius: 22, elevation: 8 },
  } as const;
  return { shadowColor: color, ...configs[level] };
}
