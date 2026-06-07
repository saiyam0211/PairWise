import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

let hydrateToken = 0;

async function fetchProfile(userId: string) {
  let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (!data) {
    await supabase.rpc('ensure_profile');
    const refetch = await supabase.from('profiles').select('*').eq('id', userId).single();
    data = refetch.data ?? null;
  }

  return data;
}

/** Load session, profile, and partnership before routing or showing the home screen. */
export async function hydrateAuthSession(
  session: Session | null,
  options?: { background?: boolean },
): Promise<void> {
  const runId = ++hydrateToken;
  const { setSession, setProfile, setAuthReady, authReady } = useAuthStore.getState();
  const { reset: resetBudget, loadPartnership, syncCycleState, subscribeRealtime } =
    useBudgetStore.getState();

  const background = options?.background ?? false;
  if (!background || !authReady) {
    setAuthReady(false);
  }
  setSession(session);

  if (!session?.user) {
    setProfile(null);
    resetBudget();
    useOnboardingStore.getState().reset();
    if (runId === hydrateToken) setAuthReady(true);
    return;
  }

  const profile = await fetchProfile(session.user.id);
  if (runId !== hydrateToken) return;

  setProfile(profile);

  if (profile?.partnership_id) {
    if (!background) resetBudget();
    await loadPartnership(profile.partnership_id);
    if (runId !== hydrateToken) return;
    await syncCycleState();
    if (runId !== hydrateToken) return;
    subscribeRealtime(profile.partnership_id);
  } else if (!background) {
    resetBudget();
  }

  if (runId === hydrateToken) setAuthReady(true);
}

/** Re-run hydration after profile changes in-place (e.g. invite join or create partnership). */
export async function refreshAuthPartnership(): Promise<void> {
  const session = useAuthStore.getState().session;
  await hydrateAuthSession(session, { background: true });
}
