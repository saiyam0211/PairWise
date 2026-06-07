import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { softShadow } from '@/lib/brand';

interface PairWiseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

const PULSE_MS = 1100;

export function PairWiseLoader({ size = 'md' }: PairWiseLoaderProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.35 : 1;
  const circle = 32 * scale;
  const baseOverlap = 20 * scale;
  const sageOpacity = isDark ? 0.72 : 0.92;
  const peachOpacity = isDark ? 0.72 : 0.92;

  const sageScale = useSharedValue(1);
  const peachScale = useSharedValue(1);
  const sageY = useSharedValue(0);
  const peachY = useSharedValue(0);
  const overlap = useSharedValue(baseOverlap);
  const containerScale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;

    const ease = Easing.inOut(Easing.sin);

    sageScale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: PULSE_MS, easing: ease }),
        withTiming(1, { duration: PULSE_MS, easing: ease }),
      ),
      -1,
      false,
    );

    peachScale.value = withDelay(
      PULSE_MS,
      withRepeat(
        withSequence(
          withTiming(1.14, { duration: PULSE_MS, easing: ease }),
          withTiming(1, { duration: PULSE_MS, easing: ease }),
        ),
        -1,
        false,
      ),
    );

    sageY.value = withRepeat(
      withSequence(
        withTiming(-5 * scale, { duration: PULSE_MS, easing: ease }),
        withTiming(2 * scale, { duration: PULSE_MS, easing: ease }),
      ),
      -1,
      false,
    );

    peachY.value = withDelay(
      PULSE_MS,
      withRepeat(
        withSequence(
          withTiming(5 * scale, { duration: PULSE_MS, easing: ease }),
          withTiming(-2 * scale, { duration: PULSE_MS, easing: ease }),
        ),
        -1,
        false,
      ),
    );

    overlap.value = withRepeat(
      withSequence(
        withTiming(baseOverlap + 5 * scale, { duration: PULSE_MS, easing: ease }),
        withTiming(baseOverlap - 3 * scale, { duration: PULSE_MS, easing: ease }),
      ),
      -1,
      true,
    );

    containerScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: PULSE_MS * 2, easing: ease }),
        withTiming(0.98, { duration: PULSE_MS * 2, easing: ease }),
      ),
      -1,
      true,
    );
  }, [baseOverlap, containerScale, overlap, peachScale, peachY, reduced, sageScale, sageY, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    width: circle + overlap.value,
  }));

  const sageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sageY.value }, { scale: sageScale.value }],
  }));

  const peachStyle = useAnimatedStyle(() => ({
    left: overlap.value,
    transform: [{ translateY: peachY.value }, { scale: peachScale.value }],
  }));

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          height: circle + 10 * scale,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
      ]}
    >
      <Animated.View
        style={[
          sageStyle,
          {
            position: 'absolute',
            left: 0,
            top: 5 * scale,
            width: circle,
            height: circle,
            borderRadius: circle / 2,
            backgroundColor: palette.sage,
            opacity: sageOpacity,
            ...softShadow('sm', isDark),
          },
        ]}
      />
      <Animated.View
        style={[
          peachStyle,
          {
            position: 'absolute',
            top: 5 * scale,
            width: circle,
            height: circle,
            borderRadius: circle / 2,
            backgroundColor: palette.peach,
            opacity: peachOpacity,
            ...softShadow('sm', isDark),
          },
        ]}
      />
    </Animated.View>
  );
}
