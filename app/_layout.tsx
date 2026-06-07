import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ThemeProvider } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import '../global.css';

async function tryJoinWithPendingInvite(
  userId: string,
  token: string,
): Promise<boolean> {
  const { error } = await supabase.rpc('join_partnership', { token });
  if (error) {
    Alert.alert('Could not join', error.message);
    useOnboardingStore.getState().setPendingInviteToken(null);
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile?.partnership_id) return false;

  useAuthStore.getState().setProfile(profile);
  await useBudgetStore.getState().loadPartnership(profile.partnership_id);
  useBudgetStore.getState().subscribeRealtime(profile.partnership_id);
  useOnboardingStore.getState().reset();
  return true;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const router = useRouter();
  const segments = useSegments();
  const { session, profile, setSession, setProfile } = useAuthStore();
  const { loadPartnership, subscribeRealtime, reset: resetBudget } = useBudgetStore();
  const { path, pendingInviteToken } = useOnboardingStore();
  const joiningRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          let { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (!data) {
            await supabase.rpc('ensure_profile');
            const refetch = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();
            data = refetch.data ?? null;
          }

          setProfile(data ?? null);
          if (data?.partnership_id) {
            await loadPartnership(data.partnership_id);
            subscribeRealtime(data.partnership_id);
          }
        } else {
          setProfile(null);
          resetBudget();
          useOnboardingStore.getState().reset();
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  // Auto-join when invite path completes auth
  useEffect(() => {
    if (!session?.user || profile?.partnership_id || !pendingInviteToken || joiningRef.current) return;
    if (path !== 'invite') return;

    joiningRef.current = true;
    tryJoinWithPendingInvite(session.user.id, pendingInviteToken).finally(() => {
      joiningRef.current = false;
    });
  }, [session, profile, pendingInviteToken, path]);

  useEffect(() => {
    if (!fontsLoaded) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboard = segments[0] === '(onboard)';

    if (!session) {
      const onWelcome = segments[1] === 'welcome';
      const onInviteCode = segments[1] === 'invite-code';
      const onSignIn = segments[1] === 'sign-in';
      if (!inAuth || (!onWelcome && !onInviteCode && !onSignIn)) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (!profile?.partnership_id) {
      if (path === 'invite') {
        if (pendingInviteToken) return;
        if (!inAuth) router.replace('/(auth)/invite-code');
        return;
      }
      if (!inOnboard) router.replace('/(onboard)/create');
      return;
    }

    if (inAuth || inOnboard) router.replace('/(app)');
  }, [session, profile, fontsLoaded, segments, path, pendingInviteToken]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
