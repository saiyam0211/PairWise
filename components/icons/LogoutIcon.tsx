import { forwardRef, useCallback, useImperativeHandle } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const DOOR_PATH = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4';
const DOOR_LENGTH = 28;

export interface LogoutIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LogoutIconProps {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
}

function easeInOut(ms: number) {
  return { duration: ms, easing: MOTION.easing.inOut };
}

export const LogoutIcon = forwardRef<LogoutIconHandle, LogoutIconProps>(
  ({ size = 24, duration = 1, color = 'currentColor', isAnimated = true }, ref) => {
    const reduced = useReducedMotion();
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);
    const arrowX = useSharedValue(0);
    const arrowOpacity = useSharedValue(1);
    const doorDraw = useSharedValue(1);

    const reset = useCallback(() => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
      cancelAnimation(arrowX);
      cancelAnimation(arrowOpacity);
      cancelAnimation(doorDraw);
      scale.value = 1;
      rotate.value = 0;
      arrowX.value = 0;
      arrowOpacity.value = 1;
      doorDraw.value = 1;
    }, [arrowOpacity, arrowX, doorDraw, rotate, scale]);

    const startAnimation = useCallback(() => {
      if (!isAnimated || reduced) return;
      reset();

      const ms = 900 * duration;
      scale.value = withSequence(
        withTiming(1.1, easeInOut(ms * 0.33)),
        withTiming(0.95, easeInOut(ms * 0.33)),
        withTiming(1, easeInOut(ms * 0.34)),
      );
      rotate.value = withSequence(
        withTiming(3, easeInOut(ms * 0.33)),
        withTiming(-2, easeInOut(ms * 0.33)),
        withTiming(0, easeInOut(ms * 0.34)),
      );

      arrowX.value = withSequence(
        withTiming(8, { duration: 0, easing: MOTION.easing.out }),
        withTiming(-2, { duration: 360 * duration, easing: MOTION.easing.out }),
        withTiming(0, { duration: 240 * duration, easing: MOTION.easing.out }),
      );
      arrowOpacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 360 * duration, easing: MOTION.easing.out }),
      );

      doorDraw.value = 0;
      doorDraw.value = withDelay(100 * duration, withTiming(1, easeInOut(700 * duration)));
    }, [arrowOpacity, arrowX, doorDraw, duration, isAnimated, reduced, reset, rotate, scale]);

    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation: reset }));

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    }));

    const arrowProps = useAnimatedProps(() => ({
      translateX: arrowX.value,
      opacity: arrowOpacity.value,
    }));

    const doorProps = useAnimatedProps(() => ({
      strokeDashoffset: DOOR_LENGTH * (1 - doorDraw.value),
    }));

    return (
      <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <AnimatedG animatedProps={arrowProps}>
            <Path
              d="m16 17 5-5-5-5"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 12H9"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </AnimatedG>
          <AnimatedPath
            d={DOOR_PATH}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${DOOR_LENGTH} ${DOOR_LENGTH}`}
            animatedProps={doorProps}
          />
        </Svg>
      </Animated.View>
    );
  },
);

LogoutIcon.displayName = 'LogoutIcon';
