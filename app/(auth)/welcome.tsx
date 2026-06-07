import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { OnboardScreen, PrimaryButton, SecondaryButton } from '@/components/OnboardScreen';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { enterStagger } from '@/lib/motion';

export default function WelcomeScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const setPath = useOnboardingStore((s) => s.setPath);

  function choose(hasInvite: boolean) {
    setPath(hasInvite ? 'invite' : 'create');
    router.push(hasInvite ? '/(auth)/invite-code' : '/(auth)/sign-in');
  }

  return (
    <OnboardScreen
      screenKey="welcome"
      center
      title="Welcome to PairWise"
      subtitle="Track shared spending with your partner — simple and in sync."
    >
      <View className="gap-4 w-full">
        <Animated.View entering={enterStagger(reduced, 1)}>
          <PrimaryButton label="Yes, I have an invite code" onPress={() => choose(true)} />
        </Animated.View>
        <Animated.View entering={enterStagger(reduced, 2)}>
          <PrimaryButton label="No, start fresh" onPress={() => choose(false)} variant="peach" />
        </Animated.View>
        <SecondaryButton label="Already signed in? Continue →" onPress={() => router.push('/(auth)/sign-in')} />
      </View>
    </OnboardScreen>
  );
}
