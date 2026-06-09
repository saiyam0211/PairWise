import { create } from 'zustand';
import { writeBudgetCache, type BudgetCache } from '@/lib/appCache';
import { ensureCycleSheetTab, maybeSyncTransaction } from '@/lib/sheetsSync';
import { supabase, Database } from '@/lib/supabase';
import { getAnchoredCycleWindow, getCycleWindow, inCycle, isAfterPreviousCycle } from '@/lib/cycle';
import { useAuthStore } from '@/stores/authStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Partnership = Database['public']['Tables']['partnerships']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type CycleSnapshot = Database['public']['Tables']['cycle_snapshots']['Row'];

function activeCycleWindow(partnership: Partnership) {
  if (partnership.current_cycle_start_at) {
    return getAnchoredCycleWindow(partnership.current_cycle_start_at, partnership.cycle_start_day);
  }
  return getCycleWindow(partnership.cycle_start_day);
}

function countsInActiveCycle(tx: Transaction, partnership: Partnership, previousCycleEndAt: string | null): boolean {
  if (!partnership.cycle_active) return false;
  const window = activeCycleWindow(partnership);
  return inCycle(tx.occurred_at, window) && isAfterPreviousCycle(tx.occurred_at, previousCycleEndAt);
}

interface BudgetState {
  partnership: Partnership | null;
  members: Profile[];
  transactions: Transaction[];
  cycleSnapshots: CycleSnapshot[];
  loading: boolean;
  channel: RealtimeChannel | null;

  cycleSpentCents: () => number;
  remainingCents: () => number;
  spentTodayCents: () => number;
  partnerJoined: () => boolean;
  partnerProfile: () => Profile | null;
  myProfile: () => Profile | null;
  memberSpentCents: (userId: string) => number;
  spenderLabel: (userId: string) => string;
  latestSnapshot: () => CycleSnapshot | null;
  isCycleActive: () => boolean;

  loadPartnership: (partnershipId: string, options?: { silent?: boolean }) => Promise<void>;
  refreshPartnership: (partnershipId?: string) => Promise<void>;
  applyCache: (cache: BudgetCache) => void;
  persistCache: () => void;
  loadCycleSnapshots: () => Promise<void>;
  syncCycleState: () => Promise<void>;
  closeCycle: () => Promise<{ error: string | null }>;
  startNewCycle: (budgetCents: number, cycleStartDay: number) => Promise<{ error: string | null }>;
  updatePartnership: (partnership: Partnership) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  removeTransaction: (id: string) => void;
  subscribeRealtime: (partnershipId: string) => void;
  unsubscribeRealtime: () => void;
  reset: () => void;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  partnership: null,
  members: [],
  transactions: [],
  cycleSnapshots: [],
  loading: false,
  channel: null,

  cycleSpentCents: () => {
    const { partnership, transactions, cycleSnapshots } = get();
    if (!partnership || !partnership.cycle_active) return 0;
    const previousCycleEndAt = cycleSnapshots[0]?.cycle_end_at ?? null;
    return transactions
      .filter((tx) => countsInActiveCycle(tx, partnership, previousCycleEndAt))
      .reduce((sum, tx) => sum + tx.amount_cents, 0);
  },

  remainingCents: () => {
    const { partnership } = get();
    if (!partnership) return 0;
    return partnership.monthly_budget_cents - get().cycleSpentCents();
  },

  spentTodayCents: () => {
    const { partnership, transactions, cycleSnapshots } = get();
    if (!partnership?.cycle_active) return 0;
    const previousCycleEndAt = cycleSnapshots[0]?.cycle_end_at ?? null;
    return transactions
      .filter((tx) => isToday(tx.occurred_at) && countsInActiveCycle(tx, partnership, previousCycleEndAt))
      .reduce((sum, tx) => sum + tx.amount_cents, 0);
  },

  partnerJoined: () => get().members.length >= 2,

  partnerProfile: () => {
    const userId = useAuthStore.getState().session?.user?.id;
    return get().members.find((m) => m.id !== userId) ?? null;
  },

  myProfile: () => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) return null;
    return get().members.find((m) => m.id === userId) ?? null;
  },

  memberSpentCents: (userId) => {
    const { partnership, transactions, cycleSnapshots } = get();
    if (!partnership?.cycle_active) return 0;
    const previousCycleEndAt = cycleSnapshots[0]?.cycle_end_at ?? null;
    return transactions
      .filter((tx) => tx.user_id === userId && countsInActiveCycle(tx, partnership, previousCycleEndAt))
      .reduce((sum, tx) => sum + tx.amount_cents, 0);
  },

  latestSnapshot: () => get().cycleSnapshots[0] ?? null,

  isCycleActive: () => get().partnership?.cycle_active ?? true,

  spenderLabel: (userId) => {
    const sessionUserId = useAuthStore.getState().session?.user?.id;
    if (userId === sessionUserId) return 'You';

    const partner = get().partnerProfile();
    if (userId === partner?.id) {
      return partner.display_name ?? get().partnership?.partner_name ?? 'Partner';
    }

    const member = get().members.find((m) => m.id === userId);
    return member?.display_name ?? 'Partner';
  },

  applyCache: (cache) => {
    if (!cache?.partnership?.id) return;
    set({
      partnership: cache.partnership,
      members: cache.members ?? [],
      transactions: cache.transactions ?? [],
      cycleSnapshots: cache.cycleSnapshots ?? [],
      loading: false,
    });
  },

  persistCache: () => {
    const { partnership, members, transactions, cycleSnapshots } = get();
    if (!partnership) return;
    void writeBudgetCache({ partnership, members, transactions, cycleSnapshots });
  },

  loadPartnership: async (partnershipId, options) => {
    const silent = options?.silent ?? false;
    const hasPartnership = get().partnership?.id === partnershipId;
    if (!silent && !hasPartnership) set({ loading: true });

    try {
      const [{ data: partnership }, { data: transactions }, { data: members }] = await Promise.all([
        hasPartnership
          ? Promise.resolve({ data: get().partnership })
          : supabase.from('partnerships').select('*').eq('id', partnershipId).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('partnership_id', partnershipId)
          .order('occurred_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('partnership_id', partnershipId),
      ]);

      set({
        partnership: partnership ?? get().partnership,
        transactions: transactions ?? [],
        members: members ?? [],
      });

      await get().loadCycleSnapshots();
      get().persistCache();
    } catch (error) {
      console.warn('[budget] loadPartnership failed', error);
    } finally {
      if (!silent && !hasPartnership) set({ loading: false });
    }
  },

  refreshPartnership: async (partnershipId) => {
    const id =
      partnershipId ??
      get().partnership?.id ??
      useAuthStore.getState().profile?.partnership_id ??
      undefined;
    if (!id) return;
    await get().loadPartnership(id, { silent: true });
  },

  loadCycleSnapshots: async () => {
    const partnershipId = get().partnership?.id;
    if (!partnershipId) return;

    const { data } = await supabase
      .from('cycle_snapshots')
      .select('*')
      .eq('partnership_id', partnershipId)
      .order('closed_at', { ascending: false });

    set({ cycleSnapshots: data ?? [] });
  },

  syncCycleState: async () => {
    const partnership = get().partnership;
    if (!partnership?.id || !partnership.cycle_active) return;

    try {
      await supabase.rpc('maybe_close_natural_cycle');
      const { data } = await supabase
        .from('partnerships')
        .select('*')
        .eq('id', partnership.id)
        .single();
      if (data) set({ partnership: data });
      await get().loadCycleSnapshots();
      get().persistCache();
    } catch (error) {
      console.warn('[budget] syncCycleState failed', error);
    }
  },

  closeCycle: async () => {
    const partnership = get().partnership;
    if (!partnership?.id) return { error: 'No partnership' };

    const { error } = await supabase.rpc('close_cycle', { p_reason: 'manual' });
    if (error) return { error: error.message };

    await get().loadPartnership(partnership.id);
    return { error: null };
  },

  startNewCycle: async (budgetCents, cycleStartDay) => {
    const partnership = get().partnership;
    if (!partnership?.id) return { error: 'No partnership' };

    const { error } = await supabase.rpc('start_new_cycle', {
      p_monthly_budget_cents: budgetCents,
      p_cycle_start_day: cycleStartDay,
    });
    if (error) return { error: error.message };

    await get().loadPartnership(partnership.id);
    get().subscribeRealtime(partnership.id);
    if (get().partnership?.google_sheets_enabled) {
      ensureCycleSheetTab();
    }
    return { error: null };
  },

  updatePartnership: (partnership) =>
    set((s) => (s.partnership?.id === partnership.id ? { partnership } : s)),

  addTransaction: (tx) => {
    set((s) => {
      if (s.transactions.some((t) => t.id === tx.id)) return s;
      return { transactions: [tx, ...s.transactions] };
    });
    get().persistCache();
  },

  updateTransaction: (tx) => {
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === tx.id ? tx : t)),
    }));
    get().persistCache();
  },

  removeTransaction: (id) => {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    get().persistCache();
  },

  subscribeRealtime: (partnershipId) => {
    const { unsubscribeRealtime, addTransaction, updateTransaction, removeTransaction } = get();
    unsubscribeRealtime();

    const channel = supabase
      .channel(`transactions:${partnershipId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `partnership_id=eq.${partnershipId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const tx = payload.new as Transaction;
            addTransaction(tx);
            const { partnership } = get();
            if (partnership?.google_sheets_enabled) {
              maybeSyncTransaction(tx);
            }
          } else if (payload.eventType === 'UPDATE') {
            updateTransaction(payload.new as Transaction);
          } else if (payload.eventType === 'DELETE') {
            removeTransaction((payload.old as { id: string }).id);
          }
        },
      )
      .subscribe();

    set({ channel });
  },

  unsubscribeRealtime: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },

  reset: () => {
    get().unsubscribeRealtime();
    set({ partnership: null, members: [], transactions: [], cycleSnapshots: [], loading: false });
  },
}));
