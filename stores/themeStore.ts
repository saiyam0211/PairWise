import { create } from 'zustand';
import { ThemePreference } from '@/lib/theme';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'light',
  setPreference: (preference) => set({ preference }),
}));
