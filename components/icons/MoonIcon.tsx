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

export interface MoonIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MoonIconProps {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
}

function easeInOut(ms: number) {
  return { duration: ms, easing: MOTION.easing.inOut };
}

export const MoonIcon = forwardRef<MoonIconHandle, MoonIconProps>(
  ({ size = 24, duration = 1, color = 'currentColor', isAnimated = true }, ref) => {
    const reduced = useReducedMotion();
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const pathOpacity = useSharedValue(0.85);

    const reset = useCallback(() => {
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(pathOpacity);
      translateY.value = 0;
      scale.value = 1;
      pathOpacity.value = 0.85;
    }, [pathOpacity, scale, translateY]);

    const startAnimation = useCallback(() => {
      if (!isAnimated || reduced) return;
      reset();
      const ms = 800 * duration;
      translateY.value = withSequence(withTiming(-2, easeInOut(ms * 0.5)), withTiming(0, easeInOut(ms * 0.5)));
      scale.value = withSequence(withTiming(1.04, easeInOut(ms * 0.5)), withTiming(1, easeInOut(ms * 0.5)));
      pathOpacity.value = withSequence(
        withTiming(1, easeInOut(ms * 0.5)),
        withTiming(0.9, easeInOut(ms * 0.5)),
      );
    }, [duration, isAnimated, pathOpacity, reduced, reset, scale, translateY]);

    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation: reset }));

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    const pathProps = useAnimatedProps(() => ({ opacity: pathOpacity.value }));

    return (
      <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <AnimatedPath
            d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    );
  },
);

MoonIcon.displayName = 'MoonIcon';
