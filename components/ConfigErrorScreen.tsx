import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS } from '@/lib/brand';
import { PairWiseLoader } from '@/components/PairWiseLoader';

export function ConfigErrorScreen() {
  const { palette } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.background,
        paddingHorizontal: 32,
      }}
    >
      <PairWiseLoader size="lg" />
      <Text
        className="font-manrope-extrabold text-xl text-center mt-8 mb-3"
        style={{ color: palette.onSurface, letterSpacing: -0.3 }}
      >
        App not configured
      </Text>
      <Text
        className="font-manrope-medium text-sm text-center"
        style={{ color: palette.onSurfaceVariant, lineHeight: 21 }}
      >
        This install is missing server settings. Ask the developer to rebuild the release APK with EAS
        environment variables, then reinstall once.
      </Text>
    </View>
  );
}
