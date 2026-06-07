import { View } from 'react-native';
import { useTheme } from '@/lib/theme';

/** Icon-inspired overlapping circles — subtle brand motif. */
export function BrandDecor({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { palette, isDark } = useTheme();
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.3 : 1;
  const circle = 30 * scale;
  const overlap = 18 * scale;

  return (
    <View
      pointerEvents="none"
      style={{ width: circle + overlap, height: circle + 8, marginBottom: 16 * scale }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: palette.sage,
          opacity: isDark ? 0.55 : 0.9,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: overlap,
          top: 4,
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: palette.peach,
          opacity: isDark ? 0.55 : 0.9,
        }}
      />
    </View>
  );
}
