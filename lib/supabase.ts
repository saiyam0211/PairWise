import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const secureStoreAdapter = Platform.OS !== 'web'
  ? {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    }
  : undefined;

let client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (client) return client;
  if (!isSupabaseConfigured) {
    throw new Error(
      'PairWise is missing server configuration. Reinstall a build that includes EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.',
    );
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
  return client;
}

/** Lazy client — avoids crashing at import when env vars were not baked into the release build. */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const value = Reflect.get(getClient(), prop, getClient());
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(getClient()) : value;
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          partnership_id: string | null;
          theme_pref: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      partnerships: {
        Row: {
          id: string;
          creator_id: string;
          monthly_budget_cents: number;
          cycle_start_day: number;
          currency_code: string;
          invite_token: string;
          partner_name: string | null;
          cycle_active: boolean;
          current_cycle_start_at: string | null;
          google_spreadsheet_id: string | null;
          google_spreadsheet_name: string | null;
          google_sheets_enabled: boolean;
          google_sheets_cycle_tab: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['partnerships']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['partnerships']['Insert']>;
      };
      cycle_snapshots: {
        Row: {
          id: string;
          partnership_id: string;
          cycle_start_at: string;
          cycle_end_at: string;
          budget_cents: number;
          total_spent_cents: number;
          saved_cents: number;
          member_spends: { user_id: string; display_name: string; spent_cents: number }[];
          close_reason: 'manual' | 'natural';
          closed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cycle_snapshots']['Row'], 'id' | 'closed_at'>;
        Update: Partial<Database['public']['Tables']['cycle_snapshots']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          partnership_id: string;
          user_id: string;
          amount_cents: number;
          description: string | null;
          category: string | null;
          quantity: number | null;
          unit: string | null;
          occurred_at: string;
          google_sheets_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
    Functions: {
      current_partnership_id: { Args: Record<never, never>; Returns: string | null };
      join_partnership: { Args: { token: string }; Returns: void };
      validate_invite_token: { Args: { token: string }; Returns: boolean };
      ensure_profile: { Args: { p_display_name?: string | null }; Returns: void };
      create_partnership: {
        Args: {
          p_monthly_budget_cents: number;
          p_cycle_start_day: number;
          p_currency_code: string;
          p_invite_token: string;
          p_display_name: string;
          p_partner_name: string;
        };
        Returns: string;
      };
      close_cycle: { Args: { p_reason?: string }; Returns: string };
      maybe_close_natural_cycle: { Args: Record<never, never>; Returns: string | null };
      start_new_cycle: {
        Args: { p_monthly_budget_cents: number; p_cycle_start_day: number };
        Returns: void;
      };
      google_sheets_status: {
        Args: Record<never, never>;
        Returns: {
          connected: boolean;
          oauth_ready: boolean;
          enabled: boolean;
          spreadsheet_id: string | null;
          spreadsheet_name: string | null;
          cycle_tab: string | null;
        }[];
      };
      save_google_oauth_token: { Args: { p_refresh_token: string }; Returns: void };
      set_google_spreadsheet: {
        Args: { p_spreadsheet_id: string; p_spreadsheet_name: string };
        Returns: void;
      };
      save_google_sheets_connection: {
        Args: { p_spreadsheet_id: string; p_refresh_token: string };
        Returns: void;
      };
      set_google_sheets_enabled: { Args: { p_enabled: boolean }; Returns: void };
      disconnect_google_sheets: { Args: Record<never, never>; Returns: void };
    };
  };
};