import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

export type AlertButton = {
  label: string;
  destructive?: boolean;
  onPress?: () => void | Promise<void>;
};

export type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  loading: boolean;
};

let toastCounter = 0;

interface FeedbackState {
  toasts: ToastItem[];
  alert: AlertState;
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  showAlert: (title: string, message: string, buttons: AlertButton[]) => void;
  setAlertLoading: (loading: boolean) => void;
  hideAlert: () => void;
}

const emptyAlert: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
  loading: false,
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toasts: [],
  alert: emptyAlert,

  pushToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  showAlert: (title, message, buttons) =>
    set({ alert: { visible: true, title, message, buttons, loading: false } }),

  setAlertLoading: (loading) => set((s) => ({ alert: { ...s.alert, loading } })),

  hideAlert: () => set({ alert: emptyAlert }),
}));
