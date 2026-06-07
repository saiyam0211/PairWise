import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterScreen, exitScreen, type ScreenDirection } from '@/lib/motion';
import { BrandDecor } from '@/components/BrandDecor';
import { NumericKeypad } from '@/components/NumericKeypad';
import { InviteShare } from '@/components/InviteShare';
import { CycleDayPicker, CycleDayTrigger } from '@/components/CycleDayPicker';
import { OnboardScreen, OnboardTextInput, OnboardBackButton, PrimaryButton } from '@/components/OnboardScreen';
import { keypadDigit, keypadBackspace } from '@/lib/money';

type Stage = 'name' | 'partnerName' | 'invite' | 'budget';

function generateToken(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CreatePartnershipScreen() {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const router = useRouter();
  const { session, setProfile } = useAuthStore();
  const { loadPartnership, subscribeRealtime } = useBudgetStore();

  const [stage, setStage] = useState<Stage>('name');
  const [direction, setDirection] = useState<ScreenDirection>('forward');
  const [displayName, setDisplayName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [budgetRupees, setBudgetRupees] = useState(0);
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);

  function goForward(next: Stage) {
    setDirection('forward');
    if (next === 'invite') setInviteToken((prev) => prev || generateToken());
    setStage(next);
  }

  function goBack(next: Stage) {
    setDirection('back');
    setStage(next);
  }

  async function createPartnership() {
    if (!session?.user) return;
    setLoading(true);

    const token = inviteToken || generateToken();
    const { data: partnershipId, error: partnershipErr } = await supabase.rpc('create_partnership', {
      p_monthly_budget_cents: budgetRupees * 100,
      p_cycle_start_day: cycleStartDay,
      p_currency_code: 'INR',
      p_invite_token: token,
      p_display_name: displayName.trim(),
      p_partner_name: partnerName.trim(),
    });

    if (partnershipErr || !partnershipId) {
      Alert.alert('Error', partnershipErr?.message ?? 'Failed to create partnership');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileErr || !profile) {
      Alert.alert('Error', profileErr?.message ?? 'Failed to load profile');
      setLoading(false);
      return;
    }

    setProfile(profile);
    await loadPartnership(partnershipId);
    subscribeRealtime(partnershipId);
    setLoading(false);
    router.replace('/(app)');
  }

  if (stage === 'budget') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
        <Animated.View
          key="budget"
          entering={enterScreen(reduced, direction)}
          exiting={exitScreen(reduced, direction)}
          style={{ flex: 1 }}
        >
          <View className="flex-1">
            <View className="flex-1 px-6 pt-8 items-center justify-center">
              <BrandDecor size="sm" />
              <Text className="font-manrope-extrabold mb-2" style={{ fontSize: 28, color: palette.onSurface, letterSpacing: -0.5 }}>
                Setting up a budget
              </Text>
              <Text className="font-manrope-medium text-sm mb-6 text-center" style={{ color: palette.onSurfaceVariant }}>
                Monthly limit for you and {partnerName.trim()}
              </Text>
              <View
                className="w-full items-center py-8 px-4"
                style={{
                  backgroundColor: palette.cream,
                  borderRadius: RADIUS.xxl,
                  borderWidth: 1,
                  borderColor: palette.border,
                  ...softShadow('md', isDark),
                }}
              >
                <Text
                  className="font-manrope-semibold text-xs uppercase tracking-widest mb-2"
                  style={{ color: palette.onSurfaceVariant }}
                >
                  Monthly budget
                </Text>
                <Text
                  className="font-manrope-extrabold"
                  style={{
                    fontSize: 64,
                    color: budgetRupees === 0 ? palette.onSurfaceVariant : palette.onSurface,
                    letterSpacing: -1,
                  }}
                >
                  {`₹${budgetRupees.toLocaleString('en-IN')}`}
                </Text>
              </View>

              <View className="flex-row items-center gap-3 mt-6 flex-wrap justify-center">
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  Cycle resets on day
                </Text>
                <CycleDayTrigger day={cycleStartDay} onPress={() => setShowDayPicker(true)} />
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  of each month
                </Text>
              </View>

              <CycleDayPicker
                visible={showDayPicker}
                value={cycleStartDay}
                onChange={setCycleStartDay}
                onClose={() => setShowDayPicker(false)}
              />
            </View>

            <NumericKeypad
              hideDecimal
              onDigit={(d) => setBudgetRupees((r) => keypadDigit(r, d))}
              onBackspace={() => setBudgetRupees((r) => keypadBackspace(r))}
              onConfirm={createPartnership}
              confirmDisabled={budgetRupees === 0 || loading}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const titles: Record<Exclude<Stage, 'budget'>, { title: string; subtitle: string; card?: boolean; scroll?: boolean }> = {
    name: {
      title: "What's your name?",
      subtitle: 'Your partner will see this.',
      card: true,
    },
    partnerName: {
      title: "Your partner's name",
      subtitle: "What do you call them? We'll use this in invites.",
      card: true,
    },
    invite: {
      title: 'Invite your partner',
      subtitle: `Send ${partnerName.trim()} an invite so you can track together.`,
      scroll: true,
    },
  };

  const meta = titles[stage];

  return (
    <OnboardScreen
      screenKey={stage}
      direction={direction}
      title={meta.title}
      subtitle={meta.subtitle}
      card={meta.card}
      scroll={meta.scroll}
      footer={stage === 'invite' ? <PrimaryButton label="Continue to budget →" onPress={() => goForward('budget')} /> : undefined}
    >
      {stage === 'name' && (
        <>
          <OnboardTextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoFocus
            onSubmit={() => displayName.trim() && goForward('partnerName')}
          />
          <OnboardBackButton onPress={() => router.replace('/(auth)/sign-in')} />
        </>
      )}
      {stage === 'partnerName' && (
        <>
          <OnboardTextInput
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Partner's name"
            autoFocus
            onSubmit={() => partnerName.trim() && goForward('invite')}
          />
          <OnboardBackButton onPress={() => goBack('name')} />
        </>
      )}
      {stage === 'invite' && (
        <InviteShare inviteCode={inviteToken} partnerName={partnerName.trim()} />
      )}
    </OnboardScreen>
  );
}
