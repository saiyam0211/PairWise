import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { formatCents } from '@/lib/money';
import { RADIUS, softShadow } from '@/lib/brand';
import { MOTION, enterFade, enterFadeDown, enterFadeUp } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';
import { BrandDecor } from '@/components/BrandDecor';

interface SpendSuccessOverlayProps {
  visible: boolean;
  remainingCents: number;
  spentTodayCents: number;
  currency: string;
  onDismiss: () => void;
}

export function SpendSuccessOverlay({
  visible,
  remainingCents,
  spentTodayCents,
  currency,
  onDismiss,
}: SpendSuccessOverlayProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = reduced
        ? withTiming(1, { duration: MOTION.duration.fast, easing: MOTION.easing.out })
        : withDelay(80, withSpring(1, MOTION.spring.pop));
    } else {
      scale.value = 0;
    }
  }, [visible, reduced]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={enterFade(reduced)}
      className="absolute inset-0 justify-center items-center px-8"
      style={{ backgroundColor: palette.background }}
    >
      <BrandDecor size="sm" />

      <Animated.View
        style={[
          checkStyle,
          {
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: palette.budgetGood,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            ...softShadow('lg', isDark),
          },
        ]}
      >
        <Check size={44} color={palette.budgetGoodText} strokeWidth={3} />
      </Animated.View>

      <Animated.Text
        entering={enterFadeUp(reduced, 160)}
        className="font-manrope-extrabold text-2xl mb-2 text-center"
        style={{ color: palette.onSurface }}
      >
        Saved!
      </Animated.Text>

      <Animated.View entering={enterFadeDown(reduced, 220)} className="w-full gap-3 mt-4">
        <View
          className="p-5"
          style={{
            backgroundColor: isDark ? palette.primaryContainer : palette.cream,
            borderRadius: RADIUS.xxl,
            borderWidth: isDark ? 0 : 1,
            borderColor: palette.border,
            ...softShadow('md', isDark),
          }}
        >
          <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-1" style={{ color: palette.onSurface, opacity: 0.65 }}>
            Budget remaining
          </Text>
          <Text className="font-manrope-extrabold text-3xl" style={{ color: palette.budgetGood }}>
            {formatCents(Math.max(0, remainingCents), currency)}
          </Text>
        </View>

        <View
          className="p-5"
          style={{
            backgroundColor: palette.surface,
            borderRadius: RADIUS.xxl,
            borderWidth: 1,
            borderColor: palette.border,
            ...softShadow('sm', isDark),
          }}
        >
          <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-1" style={{ color: palette.onSurfaceVariant }}>
            Spent today
          </Text>
          <Text className="font-manrope-extrabold text-xl" style={{ color: palette.onSurface }}>
            {formatCents(spentTodayCents, currency)}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={enterFadeUp(reduced, 300)} className="mt-8 w-full">
        <MotionPressable
          onPress={onDismiss}
          className="py-4 items-center"
          style={{
            backgroundColor: palette.accent,
            borderRadius: RADIUS.pill,
            ...softShadow('md', isDark),
          }}
        >
          <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
            Continue
          </Text>
        </MotionPressable>
      </Animated.View>
    </Animated.View>
  );
}
