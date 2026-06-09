import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastHost } from '@/components/ToastHost';
import { AppAlertHost } from '@/components/AppAlertHost';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { toast } from '@/lib/feedback';
import { startAuthBootstrap } from '@/lib/authBootstrap';
import { hydrateAuthSession } from '@/lib/authSession';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
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

  await hydrateAuthSession(useAuthStore.getState().session, { background: true });
  useOnboardingStore.getState().reset();
  return true;
}

export default function RootLayout() {
  useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const navigationReady = Boolean(navigationState?.key);
  const { session, profile, authReady } = useAuthStore();
  const { path, pendingInviteToken } = useOnboardingStore();
  const joiningRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hydratingRef = useRef(false);
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let mounted = true;

    async function initAuth() {
      if (hydratingRef.current) return;
      hydratingRef.current = true;
      try {
        const [, sessionResult] = await Promise.all([
          startAuthBootstrap(),
          supabase.auth.getSession(),
        ]);
        if (!mounted) return;

        const initialSession = sessionResult.data.session;
        lastUserIdRef.current = initialSession?.user?.id ?? null;
        useAuthStore.getState().setSession(initialSession);

        const bootstrapped = Boolean(
          initialSession?.user?.id &&
            useAuthStore.getState().profile?.id === initialSession.user.id,
        );

        await hydrateAuthSession(initialSession, { background: bootstrapped });
      } catch (error) {
        console.warn('[auth] init failed', error);
        if (mounted) useAuthStore.getState().setAuthReady(true);
      } finally {
        initDoneRef.current = true;
        if (mounted) hydratingRef.current = false;
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'INITIAL_SESSION' && !initDoneRef.current) return;

      const nextUserId = newSession?.user?.id ?? null;
      const sameUser = nextUserId === lastUserIdRef.current;
      const { authReady: ready, profile: currentProfile } = useAuthStore.getState();

      if (event === 'INITIAL_SESSION') {
        useAuthStore.getState().setSession(newSession);
        const profileMatches = Boolean(
          newSession?.user?.id && currentProfile?.id === newSession.user.id,
        );
        if (ready && profileMatches) return;

        lastUserIdRef.current = nextUserId;
        await hydrateAuthSession(newSession, { background: ready || profileMatches });
        return;
      }

      if (sameUser && ready && event !== 'SIGNED_OUT') {
        useAuthStore.getState().setSession(newSession);
        return;
      }

      lastUserIdRef.current = nextUserId;
      const keepUi =
        Boolean(newSession?.user?.id) && currentProfile?.id === newSession.user.id;
      await hydrateAuthSession(newSession, { background: keepUi });
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
    if (!authReady || !navigationReady) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboard = segments[0] === '(onboard)';
    const inApp = segments[0] === '(app)';

    if (session?.user && profile?.partnership_id) {
      if (!inApp) router.replace('/(app)');
      return;
    }

    if (!session) {
      const onWelcome = segments[1] === 'welcome';
      const onInviteCode = segments[1] === 'invite-code';
      const onSignIn = segments[1] === 'sign-in';
      if (!inAuth || (!onWelcome && !onInviteCode && !onSignIn)) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (path === 'invite') {
      if (pendingInviteToken) return;
      if (!inAuth) router.replace('/(auth)/invite-code');
      return;
    }

    if (!inOnboard) router.replace('/(onboard)/create');
  }, [session, profile, authReady, navigationReady, segments, path, pendingInviteToken, router]);

  if (!isSupabaseConfigured) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ConfigErrorScreen />
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  const showBootLoader = !authReady;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        <ToastHost />
        <AppAlertHost />
        {showBootLoader ? (
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
            <AppLoadingScreen />
          </View>
        ) : null}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
