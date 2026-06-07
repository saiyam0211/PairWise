import { useFeedbackStore } from '@/stores/feedbackStore';

type ToastVariant = 'success' | 'error' | 'info';

const AUTO_DISMISS_MS = 3800;

function show(title: string, message?: string, variant: ToastVariant = 'info') {
  const id = useFeedbackStore.getState().pushToast({
    title,
    message: message?.trim() || undefined,
    variant,
  });

  setTimeout(() => {
    useFeedbackStore.getState().dismissToast(id);
  }, AUTO_DISMISS_MS);

  return id;
}

export const toast = {
  show,
  success: (title: string, message?: string) => show(title, message, 'success'),
  error: (title: string, message?: string) => show(title, message, 'error'),
  info: (title: string, message?: string) => show(title, message, 'info'),
};

export const appAlert = {
  /** Single OK button — blocks until dismissed. */
  show(title: string, message?: string, confirmLabel = 'OK'): Promise<void> {
    return new Promise((resolve) => {
      useFeedbackStore.getState().showAlert(title, message ?? '', [
        { label: confirmLabel, onPress: () => resolve() },
      ]);
    });
  },

  /** Confirm / cancel — resolves true if confirmed. */
  confirm(
    title: string,
    message: string,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      destructive?: boolean;
    },
  ): Promise<boolean> {
    const confirmLabel = options?.confirmLabel ?? 'Confirm';
    const cancelLabel = options?.cancelLabel ?? 'Cancel';

    return new Promise((resolve) => {
      useFeedbackStore.getState().showAlert(title, message, [
        {
          label: confirmLabel,
          destructive: options?.destructive,
          onPress: () => resolve(true),
        },
        {
          label: cancelLabel,
          onPress: () => resolve(false),
        },
      ]);
    });
  },
};
