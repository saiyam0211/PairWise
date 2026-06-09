import { readAuthFromDisk, readBootstrap } from '@/lib/appCache';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';

let bootstrapPromise: Promise<boolean> | null = null;

function applyDiskSnapshot(snapshot: NonNullable<Awaited<ReturnType<typeof readAuthFromDisk>>>) {
  useAuthStore.getState().setProfile(snapshot.profile);
  if (snapshot.budget) {
    useBudgetStore.getState().applyCache(snapshot.budget);
  }
}

/** Restore profile + budget from disk (call after React/native modules are ready). */
export function startAuthBootstrap(): Promise<boolean> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async (): Promise<boolean> => {
    try {
      const meta = await readBootstrap();
      if (!meta?.userId) return false;

      const snapshot = await readAuthFromDisk(meta.userId);
      if (!snapshot) return false;

      applyDiskSnapshot(snapshot);
      return true;
    } catch (error) {
      console.warn('[auth] bootstrap failed', error);
      return false;
    }
  })();

  return bootstrapPromise;
}
