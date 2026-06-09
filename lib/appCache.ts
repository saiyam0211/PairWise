import * as FileSystem from 'expo-file-system';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Partnership = Database['public']['Tables']['partnerships']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type CycleSnapshot = Database['public']['Tables']['cycle_snapshots']['Row'];

export type BudgetCache = {
  partnership: Partnership;
  members: Profile[];
  transactions: Transaction[];
  cycleSnapshots: CycleSnapshot[];
  savedAt: number;
};

type BootstrapMeta = {
  userId: string;
  partnershipId: string | null;
};

const CACHE_DIR = `${FileSystem.documentDirectory ?? ''}pairwise-cache/`;
const BOOTSTRAP_PATH = `${CACHE_DIR}bootstrap.json`;

async function ensureDir() {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(path: string, data: unknown) {
  await ensureDir();
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
}

function profilePath(userId: string) {
  return `${CACHE_DIR}profile-${userId}.json`;
}

function budgetPath(partnershipId: string) {
  return `${CACHE_DIR}budget-${partnershipId}.json`;
}

export async function readBootstrap(): Promise<BootstrapMeta | null> {
  if (!FileSystem.documentDirectory) return null;
  const data = await readJson<BootstrapMeta>(BOOTSTRAP_PATH);
  if (data?.userId) return data;

  try {
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const legacyProfile = files.find((name) => name.startsWith('profile-') && name.endsWith('.json'));
    if (!legacyProfile) return null;

    const userId = legacyProfile.slice('profile-'.length, -'.json'.length);
    const profile = await readProfileCache(userId);
    if (!profile) return null;

    const meta = { userId, partnershipId: profile.partnership_id };
    await writeJson(BOOTSTRAP_PATH, meta);
    return meta;
  } catch {
    return null;
  }
}

export async function writeBootstrap(userId: string, partnershipId: string | null): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await writeJson(BOOTSTRAP_PATH, { userId, partnershipId } satisfies BootstrapMeta);
}

export async function clearBootstrap(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  try {
    const info = await FileSystem.getInfoAsync(BOOTSTRAP_PATH);
    if (info.exists) await FileSystem.deleteAsync(BOOTSTRAP_PATH, { idempotent: true });
  } catch {
    /* ignore */
  }
}

export async function readProfileCache(userId: string): Promise<Profile | null> {
  if (!FileSystem.documentDirectory) return null;
  return readJson<Profile>(profilePath(userId));
}

export async function writeProfileCache(profile: Profile): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await writeJson(profilePath(profile.id), profile);
  await writeBootstrap(profile.id, profile.partnership_id);
}

export async function readBudgetCache(partnershipId: string): Promise<BudgetCache | null> {
  if (!FileSystem.documentDirectory) return null;
  const data = await readJson<BudgetCache>(budgetPath(partnershipId));
  if (!data?.partnership?.id) return null;
  return data;
}

export async function writeBudgetCache(cache: Omit<BudgetCache, 'savedAt'>): Promise<void> {
  if (!FileSystem.documentDirectory || !cache.partnership?.id) return;
  await writeJson(budgetPath(cache.partnership.id), { ...cache, savedAt: Date.now() });
}

export type AuthDiskSnapshot = {
  profile: Profile;
  budget: BudgetCache | null;
};

export async function readAuthFromDisk(userId: string): Promise<AuthDiskSnapshot | null> {
  const profile = await readProfileCache(userId);
  if (!profile) return null;

  const budget = profile.partnership_id
    ? await readBudgetCache(profile.partnership_id)
    : null;

  return { profile, budget };
}

export async function clearAppCache(userId?: string, partnershipId?: string): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  const paths: string[] = [BOOTSTRAP_PATH];
  if (userId) paths.push(profilePath(userId));
  if (partnershipId) paths.push(budgetPath(partnershipId));
  await Promise.all(
    paths.map(async (path) => {
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
      } catch {
        /* ignore */
      }
    }),
  );
}
