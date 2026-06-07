import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

/** Legacy route — redirects to the new welcome / invite-code flow. */
export default function JoinRedirect() {
  const router = useRouter();
  const { palette } = useTheme();
  const setPath = useOnboardingStore((s) => s.setPath);

  useEffect(() => {
    setPath('invite');
    router.replace('/(auth)/invite-code');
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
      <ActivityIndicator color={palette.primary} />
    </View>
  );
}
