import type { Session } from '@supabase/supabase-js';
import { clearAppCache, readAuthFromDisk, readBudgetCache, writeProfileCache } from '@/lib/appCache';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/withTimeout';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

let hydrateToken = 0;

const PROFILE_TIMEOUT_MS = 8_000;
const PARTNERSHIP_TIMEOUT_MS = 12_000;

async function fetchProfile(userId: string) {
  let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (!data) {
    await supabase.rpc('ensure_profile');
    const refetch = await supabase.from('profiles').select('*').eq('id', userId).single();
    data = refetch.data ?? null;
  }

  return data;
}

async function hydratePartnershipData(partnershipId: string, runId: number) {
  const { loadPartnership, syncCycleState, subscribeRealtime } = useBudgetStore.getState();

  subscribeRealtime(partnershipId);

  try {
    await withTimeout(
      loadPartnership(partnershipId, { silent: true }),
      PARTNERSHIP_TIMEOUT_MS,
      'loadPartnership',
    );
    if (runId !== hydrateToken) return;

    void syncCycleState();
  } catch (error) {
    console.warn('[auth] partnership hydrate failed', error);
  }
}

/** Prime stores from disk so routing can start before network. */
export async function primeAuthFromCache(session: Session | null): Promise<boolean> {
  if (!session?.user?.id) return false;
  const snapshot = await readAuthFromDisk(session.user.id);
  if (!snapshot) return false;

  useAuthStore.getState().setProfile(snapshot.profile);
  if (snapshot.budget) useBudgetStore.getState().applyCache(snapshot.budget);
  return true;
}

/** Load session + profile; partnership refresh continues in the background. */
export async function hydrateAuthSession(
  session: Session | null,
  options?: { background?: boolean },
): Promise<void> {
  const runId = ++hydrateToken;
  const { setSession, setProfile, setAuthReady, authReady, profile: existingProfile } = useAuthStore.getState();
  const { reset: resetBudget, partnership: existingPartnership } = useBudgetStore.getState();

  const background = options?.background ?? false;
  const sameUserProfile =
    Boolean(session?.user?.id) && existingProfile?.id === session?.user?.id;

  if (!background && !sameUserProfile) {
    setAuthReady(false);
  }
  setSession(session);

  if (!session?.user) {
    const prevUserId = existingProfile?.id;
    const prevPartnershipId = existingPartnership?.id ?? existingProfile?.partnership_id ?? undefined;
    setProfile(null);
    resetBudget();
    useOnboardingStore.getState().reset();
    if (prevUserId || prevPartnershipId) {
      void clearAppCache(prevUserId, prevPartnershipId ?? undefined);
    }
    if (runId === hydrateToken) setAuthReady(true);
    return;
  }

  let profile = sameUserProfile ? existingProfile : null;
  if (!profile) {
    try {
      profile = await withTimeout(fetchProfile(session.user.id), PROFILE_TIMEOUT_MS, 'fetchProfile');
    } catch (error) {
      console.warn('[auth] profile fetch failed', error);
      if (runId !== hydrateToken) return;
      if (!sameUserProfile) {
        setProfile(null);
        if (!background) resetBudget();
      }
      if (runId === hydrateToken) setAuthReady(true);
      return;
    }
  }

  if (runId !== hydrateToken) return;
  setProfile(profile);
  void writeProfileCache(profile);

  const partnershipChanged = profile?.partnership_id !== existingPartnership?.id;
  if (!background && partnershipChanged) {
    resetBudget();
    if (profile?.partnership_id) {
      const cachedBudget = await readBudgetCache(profile.partnership_id);
      if (cachedBudget) useBudgetStore.getState().applyCache(cachedBudget);
    }
  }

  if (runId === hydrateToken) setAuthReady(true);

  if (profile?.partnership_id) {
    void hydratePartnershipData(profile.partnership_id, runId);
  }
}

/** Re-run hydration after profile changes in-place (e.g. invite join or create partnership). */
export async function refreshAuthPartnership(): Promise<void> {
  const session = useAuthStore.getState().session;
  await hydrateAuthSession(session, { background: true });
}
