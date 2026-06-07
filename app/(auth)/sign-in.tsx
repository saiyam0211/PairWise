import { useState } from 'react';
import { TextInput } from 'react-native';
import { toast } from '@/lib/feedback';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { type ScreenDirection } from '@/lib/motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardScreen, OnboardTextInput, PrimaryButton, OnboardBackButton, M3InputStyle } from '@/components/OnboardScreen';

type Stage = 'email' | 'otp';

export default function SignInScreen() {
  const { palette, isDark } = useTheme();
  const router = useRouter();
  const path = useOnboardingStore((s) => s.path);
  const pendingInviteToken = useOnboardingStore((s) => s.pendingInviteToken);
  const [stage, setStage] = useState<Stage>('email');
  const [direction, setDirection] = useState<ScreenDirection>('forward');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const subtitle =
    stage === 'email'
      ? path === 'invite'
        ? `Sign in to join with code ${pendingInviteToken ?? ''}.`
        : "Sign in with your email — we'll send a code."
      : `Enter the code sent to ${email}`;

  async function sendOtp() {
    if (!email.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) toast.error('Error', error.message);
    else {
      setDirection('forward');
      setStage('otp');
    }
  }

  async function verifyOtp() {
    if (!otp.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) toast.error('Error', error.message);
  }

  return (
    <OnboardScreen title="PairWise" subtitle={subtitle} card screenKey={stage} direction={direction}>
      {stage === 'email' ? (
        <>
          <OnboardTextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            loading={loading}
            onSubmit={sendOtp}
          />
          <OnboardBackButton onPress={() => router.back()} />
        </>
      ) : (
        <>
          <TextInput
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
            placeholder="········"
            placeholderTextColor={palette.onSurfaceVariant}
            keyboardType="number-pad"
            maxLength={8}
            className="font-manrope px-5 py-4 mb-4 text-center tracking-widest"
            style={{ ...M3InputStyle(palette, isDark), fontSize: 28 }}
          />
          <PrimaryButton label="Sign in" onPress={verifyOtp} disabled={otp.length < 6} loading={loading} />
          <OnboardBackButton
            onPress={() => {
              setDirection('back');
              setStage('email');
            }}
          />
        </>
      )}
    </OnboardScreen>
  );
}
