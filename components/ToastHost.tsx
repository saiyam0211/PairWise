import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { Check, Info, XCircle } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { useFeedbackStore, type ToastItem, type ToastVariant } from '@/stores/feedbackStore';
import { MotionPressable } from '@/components/MotionPressable';

function ToastIcon({ variant, color }: { variant: ToastVariant; color: string }) {
  const size = 20;
  if (variant === 'success') return <Check size={size} color={color} strokeWidth={2.5} />;
  if (variant === 'error') return <XCircle size={size} color={color} strokeWidth={2.25} />;
  return <Info size={size} color={color} strokeWidth={2.25} />;
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const dismissToast = useFeedbackStore((s) => s.dismissToast);

  const accent =
    toast.variant === 'success'
      ? palette.sage
      : toast.variant === 'error'
        ? palette.budgetOver
        : palette.peach;
  const iconColor =
    toast.variant === 'success'
      ? palette.primary
      : toast.variant === 'error'
        ? palette.budgetOver
        : palette.onSurface;

  return (
    <Animated.View
      entering={reduced ? undefined : FadeInUp.duration(260)}
      exiting={reduced ? undefined : FadeOutUp.duration(200)}
    >
      <MotionPressable
        onPress={() => dismissToast(toast.id)}
        className="flex-row items-start gap-3 px-4 py-3.5"
        style={{
          backgroundColor: palette.surface,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: palette.border,
          ...softShadow('md', isDark),
        }}
        scaleTo={0.99}
      >
        <View
          className="w-9 h-9 rounded-full items-center justify-center mt-0.5"
          style={{ backgroundColor: accent + '44' }}
        >
          <ToastIcon variant={toast.variant} color={iconColor} />
        </View>
        <View className="flex-1 pr-1">
          <Text className="font-manrope-bold text-sm" style={{ color: palette.onSurface }}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text className="font-manrope-medium text-xs mt-1" style={{ color: palette.onSurfaceVariant, lineHeight: 18 }}>
              {toast.message}
            </Text>
          ) : null}
        </View>
      </MotionPressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const toasts = useFeedbackStore((s) => s.toasts);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        gap: 10,
      }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </View>
  );
}
