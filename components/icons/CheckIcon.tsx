import { forwardRef, useCallback, useImperativeHandle } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M5 13l4 4L19 7';
const CHECK_LENGTH = 20;

export interface CheckIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CheckIconProps {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
}

function easeInOut(ms: number) {
  return { duration: ms, easing: MOTION.easing.inOut };
}

export const CheckIcon = forwardRef<CheckIconHandle, CheckIconProps>(
  ({ size = 24, duration = 1, color = 'currentColor', isAnimated = true }, ref) => {
    const reduced = useReducedMotion();
    const draw = useSharedValue(1);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const reset = useCallback(() => {
      cancelAnimation(draw);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      draw.value = 1;
      scale.value = 1;
      opacity.value = 1;
    }, [draw, opacity, scale]);

    const startAnimation = useCallback(() => {
      if (!isAnimated || reduced) return;
      reset();

      const ms = 600 * duration;
      draw.value = 0;
      draw.value = withTiming(1, easeInOut(ms));
      scale.value = withSequence(withTiming(1.2, easeInOut(ms * 0.5)), withTiming(1, easeInOut(ms * 0.5)));
      opacity.value = withSequence(withTiming(0.5, { duration: 0 }), withTiming(1, easeInOut(ms)));
    }, [draw, duration, isAnimated, opacity, reduced, reset, scale]);

    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation: reset }));

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const pathProps = useAnimatedProps(() => ({
      strokeDashoffset: CHECK_LENGTH * (1 - draw.value),
    }));

    return (
      <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d={CHECK_PATH}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.25}
          />
          <AnimatedPath
            d={CHECK_PATH}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    );
  },
);

CheckIcon.displayName = 'CheckIcon';
