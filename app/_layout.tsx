import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastHost } from '@/components/ToastHost';
import { AppAlertHost } from '@/components/AppAlertHost';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { toast } from '@/lib/feedback';
import { hydrateAuthSession } from '@/lib/authSession';
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
    toast.error('Could not join', error.message);
    useOnboardingStore.getState().setPendingInviteToken(null);
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile?.partnership_id) return false;

  await hydrateAuthSession(useAuthStore.getState().session);
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
  const { session, profile, authReady } = useAuthStore();
  const { path, pendingInviteToken } = useOnboardingStore();
  const joiningRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hydratingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (hydratingRef.current) return;
      hydratingRef.current = true;
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      lastUserIdRef.current = initialSession?.user?.id ?? null;
      await hydrateAuthSession(initialSession);
      if (mounted) hydratingRef.current = false;
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      const nextUserId = newSession?.user?.id ?? null;
      const sameUser = nextUserId === lastUserIdRef.current;
      const ready = useAuthStore.getState().authReady;

      if (event === 'INITIAL_SESSION' && ready) {
        useAuthStore.getState().setSession(newSession);
        return;
      }

      if (sameUser && ready && event !== 'SIGNED_OUT') {
        useAuthStore.getState().setSession(newSession);
        return;
      }

      lastUserIdRef.current = nextUserId;
      await hydrateAuthSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user || profile?.partnership_id || !pendingInviteToken || joiningRef.current) return;
    if (path !== 'invite') return;
    if (!authReady) return;

    joiningRef.current = true;
    tryJoinWithPendingInvite(session.user.id, pendingInviteToken).finally(() => {
      joiningRef.current = false;
    });
  }, [session, profile, pendingInviteToken, path, authReady]);

  useEffect(() => {
    if (!fontsLoaded || !authReady) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboard = segments[0] === '(onboard)';
    const inApp = segments[0] === '(app)';

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

    if (!inApp) router.replace('/(app)');
  }, [session, profile, fontsLoaded, authReady, segments, path, pendingInviteToken]);

  if (!fontsLoaded || !authReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AppLoadingScreen />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        <ToastHost />
        <AppAlertHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
