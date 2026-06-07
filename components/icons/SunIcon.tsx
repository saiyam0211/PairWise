import { forwardRef, useCallback, useImperativeHandle } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const RAYS = [
  'M12 2v2',
  'M12 20v2',
  'm4.93 4.93 1.41 1.41',
  'm17.66 17.66 1.41 1.41',
  'M2 12h2',
  'M20 12h2',
  'm6.34 17.66-1.41 1.41',
  'm19.07 4.93-1.41 1.41',
] as const;

export interface SunIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SunIconProps {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
}

function easeInOut(ms: number) {
  return { duration: ms, easing: MOTION.easing.inOut };
}

export const SunIcon = forwardRef<SunIconHandle, SunIconProps>(
  ({ size = 24, duration = 1, color = 'currentColor', isAnimated = true }, ref) => {
    const reduced = useReducedMotion();
    const rotate = useSharedValue(0);
    const centerScale = useSharedValue(1);
    const ray0 = useSharedValue(1);
    const ray1 = useSharedValue(1);
    const ray2 = useSharedValue(1);
    const ray3 = useSharedValue(1);
    const ray4 = useSharedValue(1);
    const ray5 = useSharedValue(1);
    const ray6 = useSharedValue(1);
    const ray7 = useSharedValue(1);
    const rays = [ray0, ray1, ray2, ray3, ray4, ray5, ray6, ray7];

    const reset = useCallback(() => {
      cancelAnimation(rotate);
      cancelAnimation(centerScale);
      rays.forEach((r) => cancelAnimation(r));
      rotate.value = 0;
      centerScale.value = 1;
      rays.forEach((r) => {
        r.value = 1;
      });
    }, [centerScale, ray0, ray1, ray2, ray3, ray4, ray5, ray6, ray7, rays, rotate]);

    const startAnimation = useCallback(() => {
      if (!isAnimated || reduced) return;
      reset();
      const ms = 1000 * duration;
      rotate.value = withTiming(12, { duration: ms, easing: MOTION.easing.out });
      centerScale.value = withSequence(withTiming(1.18, easeInOut(ms * 0.5)), withTiming(1, easeInOut(ms * 0.5)));
      rays.forEach((r) => {
        r.value = withSequence(withTiming(0.7, easeInOut(ms * 0.5)), withTiming(1, easeInOut(ms * 0.5)));
      });
    }, [centerScale, duration, isAnimated, reduced, reset, rotate, rays]);

    useImperativeHandle(ref, () => ({ startAnimation, stopAnimation: reset }));

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotate.value}deg` }],
    }));

    const centerProps = useAnimatedProps(() => ({
      transform: [{ scale: centerScale.value }],
    }));

    const ray0Props = useAnimatedProps(() => ({ opacity: ray0.value }));
    const ray1Props = useAnimatedProps(() => ({ opacity: ray1.value }));
    const ray2Props = useAnimatedProps(() => ({ opacity: ray2.value }));
    const ray3Props = useAnimatedProps(() => ({ opacity: ray3.value }));
    const ray4Props = useAnimatedProps(() => ({ opacity: ray4.value }));
    const ray5Props = useAnimatedProps(() => ({ opacity: ray5.value }));
    const ray6Props = useAnimatedProps(() => ({ opacity: ray6.value }));
    const ray7Props = useAnimatedProps(() => ({ opacity: ray7.value }));
    const rayPropsList = [ray0Props, ray1Props, ray2Props, ray3Props, ray4Props, ray5Props, ray6Props, ray7Props];

    return (
      <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <AnimatedCircle
            cx={12}
            cy={12}
            r={4}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            animatedProps={centerProps}
          />
          {RAYS.map((d, index) => (
            <AnimatedPath
              key={d}
              d={d}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={rayPropsList[index]}
            />
          ))}
        </Svg>
      </Animated.View>
    );
  },
);

SunIcon.displayName = 'SunIcon';
