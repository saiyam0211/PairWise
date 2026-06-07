import { Modal, View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  icon: Icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  const iconBg = destructive ? `${palette.budgetOver}22` : `${palette.sage}55`;
  const iconColor = destructive ? palette.budgetOver : palette.primary;
  const confirmBg = destructive ? palette.budgetOver : palette.accent;
  const confirmText = destructive ? '#FFFFFF' : palette.onAccent;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View
        entering={enterFade(reduced)}
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: 'rgba(61, 64, 57, 0.52)' }}
      >
        <MotionPressable
          onPress={onCancel}
          disabled={loading}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          scaleTo={1}
        />

        <Animated.View
          entering={enterFadeDown(reduced, 40)}
          className="w-full px-6 py-6"
          style={{
            backgroundColor: palette.surface,
            borderRadius: RADIUS.xxl,
            borderWidth: 1,
            borderColor: palette.border,
            maxWidth: 340,
            ...softShadow('lg', isDark),
          }}
        >
          {Icon ? (
            <View
              className="self-center w-14 h-14 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: iconBg }}
            >
              <Icon size={26} color={iconColor} strokeWidth={2.25} />
            </View>
          ) : null}

          <Text
            className="font-manrope-extrabold text-xl text-center mb-2"
            style={{ color: palette.onSurface, letterSpacing: -0.3 }}
          >
            {title}
          </Text>
          <Text
            className="font-manrope-medium text-sm text-center mb-6"
            style={{ color: palette.onSurfaceVariant, lineHeight: 21 }}
          >
            {message}
          </Text>

          <View className="gap-3">
            <MotionPressable
              onPress={onConfirm}
              disabled={loading}
              className="py-4 items-center"
              style={{
                backgroundColor: loading ? palette.keyBgDark : confirmBg,
                borderRadius: RADIUS.pill,
                ...(!loading ? softShadow('sm', isDark) : {}),
              }}
            >
              <Text className="font-manrope-bold text-base" style={{ color: loading ? palette.onSurfaceVariant : confirmText }}>
                {loading ? 'Signing out…' : confirmLabel}
              </Text>
            </MotionPressable>

            <MotionPressable
              onPress={onCancel}
              disabled={loading}
              className="py-4 items-center"
              style={{
                backgroundColor: palette.cream,
                borderRadius: RADIUS.pill,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
                {cancelLabel}
              </Text>
            </MotionPressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
