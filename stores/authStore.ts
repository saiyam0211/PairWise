import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  authReady: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthReady: (ready: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  authReady: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: (authReady) => set({ authReady }),
  clear: () => set({ session: null, profile: null, authReady: false }),
}));
