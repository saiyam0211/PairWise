import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { MOTION } from '@/lib/motion';
import { centsToDisplay } from '@/lib/money';

interface AmountDisplayProps {
  whole?: number;
  cents?: number;
  currencySymbol?: string;
}

function useRollingNumber(target: number, duration = MOTION.duration.normal) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const liveRef = useRef(target);

  useEffect(() => {
    if (reduced) {
      liveRef.current = target;
      setDisplay(target);
      return;
    }

    const from = liveRef.current;
    if (from === target) return;

    const startTime = Date.now();
    let raf = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (target - from) * eased);
      liveRef.current = next;
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        liveRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return display;
}

function AnimatedCounter({
  value,
  color,
  fontSize,
  lineHeight,
  reduced,
}: {
  value: number;
  color: string;
  fontSize: number;
  lineHeight: number;
  reduced: boolean;
}) {
  const display = useRollingNumber(value);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    scale.value = withSpring(1.06, MOTION.spring.snappy, (done) => {
      if (done) scale.value = withSpring(1, MOTION.spring.gentle);
    });
    lift.value = 0;
    lift.value = withTiming(-8, { duration: MOTION.duration.fast }, () => {
      lift.value = withSpring(0, MOTION.spring.gentle);
    });
  }, [value, reduced, scale, lift]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Text
        className="font-manrope-extrabold"
        style={{ fontSize, lineHeight, color, letterSpacing: -2 }}
      >
        {display.toLocaleString('en-IN')}
      </Text>
    </Animated.View>
  );
}

export function AmountDisplay({ whole, cents, currencySymbol = '$' }: AmountDisplayProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion() ?? false;
  const isWhole = whole !== undefined;
  const amount = isWhole ? whole : (cents ?? 0);
  const isEmpty = amount === 0;
  const color = isEmpty ? palette.onSurfaceVariant : palette.onSurface;
  const fontSize = isEmpty ? 72 : 84;
  const lineHeight = isEmpty ? 80 : 92;

  const digits = isWhole ? (
    <View className="flex-row items-end">
      <Text
        className="font-manrope-bold"
        style={{ fontSize: 26, color: palette.sage, marginBottom: 16, opacity: 0.9 }}
      >
        {currencySymbol}
      </Text>
      <AnimatedCounter
        value={whole}
        color={color}
        fontSize={fontSize}
        lineHeight={lineHeight}
        reduced={reduced}
      />
    </View>
  ) : (
    (() => {
      const [wholePart, fraction] = centsToDisplay(cents ?? 0).split('.');
      return (
        <View className="flex-row items-end">
          <Text
            className="font-manrope-bold"
            style={{ fontSize: 26, color: palette.sage, marginBottom: 16, opacity: 0.9 }}
          >
            {currencySymbol}
          </Text>
          <Text className="font-manrope-extrabold" style={{ fontSize: 84, lineHeight: 92, color, letterSpacing: -2 }}>
            {wholePart}
          </Text>
          <Text
            className="font-manrope-bold"
            style={{ fontSize: 36, color: palette.onSurfaceVariant, marginBottom: 12 }}
          >
            .{fraction}
          </Text>
        </View>
      );
    })()
  );

  return (
    <View className="items-center justify-center flex-1 px-4 pb-2">
      <View
        className="items-center justify-center w-full px-4 py-7"
        style={{
          // backgroundColor: palette.surface,
          // borderRadius: RADIUS.xxl,
          // borderWidth: 1,
          // borderColor: palette.border,
          // ...softShadow('md', isDark),
        }}
      >
        <Text
          className="font-manrope-semibold text-xs uppercase tracking-widest mb-4"
          style={{ color: palette.onSurfaceVariant }}
        >
          {isEmpty ? 'Enter amount' : 'Amount'}
        </Text>

        {digits}

        <Text
          className="font-manrope-medium text-sm mt-3 text-center"
          style={{ color: palette.onSurfaceVariant, opacity: isEmpty ? 1 : 0.7 }}
        >
          {isEmpty ? 'Use the keypad below' : 'Tap ✓ when ready'}
        </Text>
      </View>
    </View>
  );
}
