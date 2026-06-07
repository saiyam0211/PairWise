import { supabase } from '@/lib/supabase';

/** Fire-and-forget sync — never blocks the spend UI. */
export function syncTransactionToSheets(transactionId: string) {
  void supabase.functions
    .invoke('sheets-sync', { body: { action: 'sync_transaction', transaction_id: transactionId } })
    .then(({ error }) => {
      if (error) console.warn('[sheets-sync]', error.message);
    });
}

/** Create the cycle tab when a new budget cycle begins. */
export function ensureCycleSheetTab() {
  void supabase.functions
    .invoke('sheets-sync', { body: { action: 'ensure_cycle_sheet' } })
    .then(({ error }) => {
      if (error) console.warn('[sheets-sync]', error.message);
    });
}

export function maybeSyncTransaction(transaction: {
  id: string;
  google_sheets_synced_at?: string | null;
}) {
  if (transaction.google_sheets_synced_at) return;
  syncTransactionToSheets(transaction.id);
}
