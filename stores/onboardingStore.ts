import { create } from 'zustand';

export type OnboardingPath = 'invite' | 'create';

interface OnboardingState {
  path: OnboardingPath | null;
  pendingInviteToken: string | null;
  setPath: (path: OnboardingPath) => void;
  setPendingInviteToken: (token: string | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  path: null,
  pendingInviteToken: null,
  setPath: (path) => set({ path }),
  setPendingInviteToken: (token) => set({ pendingInviteToken: token }),
  reset: () => set({ path: null, pendingInviteToken: null }),
}));
