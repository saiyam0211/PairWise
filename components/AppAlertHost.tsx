import { View, Text, Modal } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { useFeedbackStore } from '@/stores/feedbackStore';
import { MotionPressable } from '@/components/MotionPressable';

export function AppAlertHost() {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const alert = useFeedbackStore((s) => s.alert);
  const setAlertLoading = useFeedbackStore((s) => s.setAlertLoading);
  const hideAlert = useFeedbackStore((s) => s.hideAlert);

  if (!alert.visible) return null;

  const [primary, secondary] = alert.buttons;
  const singleButton = alert.buttons.length === 1;
  const destructive = primary?.destructive;

  const iconBg = destructive ? `${palette.budgetOver}22` : `${palette.sage}55`;
  const iconColor = destructive ? palette.budgetOver : palette.primary;
  const primaryBg = destructive ? palette.budgetOver : palette.accent;
  const primaryText = destructive ? '#FFFFFF' : palette.onAccent;

  async function onPrimaryPress() {
    if (alert.loading || !primary) return;
    setAlertLoading(true);
    try {
      await primary.onPress?.();
      hideAlert();
    } finally {
      setAlertLoading(false);
    }
  }

  function onSecondaryPress() {
    if (alert.loading || !secondary) return;
    void (async () => {
      await secondary.onPress?.();
      hideAlert();
    })();
  }

  function onBackdropPress() {
    if (alert.loading) return;
    if (secondary) onSecondaryPress();
    else if (primary) void onPrimaryPress();
    else hideAlert();
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onBackdropPress}>
      <Animated.View
        entering={enterFade(reduced)}
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: 'rgba(61, 64, 57, 0.52)' }}
      >
        <MotionPressable
          onPress={onBackdropPress}
          disabled={alert.loading}
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
          <View
            className="self-center w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: iconBg }}
          >
            <AlertCircle size={26} color={iconColor} strokeWidth={2.25} />
          </View>

          <Text
            className="font-manrope-extrabold text-xl text-center mb-2"
            style={{ color: palette.onSurface, letterSpacing: -0.3 }}
          >
            {alert.title}
          </Text>
          {alert.message ? (
            <Text
              className="font-manrope-medium text-sm text-center mb-6"
              style={{ color: palette.onSurfaceVariant, lineHeight: 21 }}
            >
              {alert.message}
            </Text>
          ) : (
            <View className="mb-6" />
          )}

          <View className="gap-3">
            {primary ? (
              <MotionPressable
                onPress={onPrimaryPress}
                disabled={alert.loading}
                className="py-4 items-center"
                style={{
                  backgroundColor: alert.loading ? palette.keyBgDark : primaryBg,
                  borderRadius: RADIUS.pill,
                  ...(!alert.loading ? softShadow('sm', isDark) : {}),
                }}
              >
                <Text
                  className="font-manrope-bold text-base"
                  style={{ color: alert.loading ? palette.onSurfaceVariant : primaryText }}
                >
                  {alert.loading ? 'Please wait…' : primary.label}
                </Text>
              </MotionPressable>
            ) : null}

            {!singleButton && secondary ? (
              <MotionPressable
                onPress={onSecondaryPress}
                disabled={alert.loading}
                className="py-4 items-center"
                style={{
                  backgroundColor: palette.cream,
                  borderRadius: RADIUS.pill,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
                  {secondary.label}
                </Text>
              </MotionPressable>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
