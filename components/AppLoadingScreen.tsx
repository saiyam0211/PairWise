import { View } from 'react-native';
import { PairWiseLoader } from '@/components/PairWiseLoader';
import { useTheme } from '@/lib/theme';

export function AppLoadingScreen() {
  const { palette } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.background,
      }}
    >
      <PairWiseLoader size="lg" />
    </View>
  );
}
