import { useState } from 'react';
import { TextInput } from 'react-native';
import { toast } from '@/lib/feedback';
import { useRouter } from 'expo-router';
import { OnboardScreen, PrimaryButton, OnboardBackButton, M3InputStyle } from '@/components/OnboardScreen';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function InviteCodeScreen() {
  const { palette, isDark } = useTheme();
  const router = useRouter();
  const { setPath, setPendingInviteToken } = useOnboardingStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function continueWithCode() {
    const token = code.trim().toUpperCase();
    if (token.length < 4) return;

    setLoading(true);
    const { data, error } = await supabase.rpc('validate_invite_token', { token });
    setLoading(false);

    if (error || !data) {
      toast.error('Invalid code', 'That invite code is invalid or the partnership is full.');
      return;
    }

    setPath('invite');
    setPendingInviteToken(token);
    router.push('/(auth)/sign-in');
  }

  return (
    <OnboardScreen
      screenKey="invite-code"
      title="Enter invite code"
      subtitle="Your partner shared a 6-character code with you."
      card
    >
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        placeholder="ABC123"
        placeholderTextColor={palette.onSurfaceVariant}
        autoCapitalize="characters"
        maxLength={6}
        className="font-manrope-bold px-5 py-5 mb-4 text-center tracking-widest"
        style={{ ...M3InputStyle(palette, isDark), fontSize: 32, backgroundColor: palette.cream }}
      />
      <PrimaryButton
        label="Continue"
        trailingArrow
        onPress={continueWithCode}
        disabled={code.trim().length < 4}
        loading={loading}
      />
      <OnboardBackButton onPress={() => router.back()} />
    </OnboardScreen>
  );
}
