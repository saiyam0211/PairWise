import { forwardRef, useCallback, useImperativeHandle } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, {
  Easing,
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
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Lucide settings gear path — matches @animateicons/react/lucide SettingsIcon. */
const GEAR_PATH =
  'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915';

const GEAR_LENGTH = 52;
const CORE_LENGTH = 2 * Math.PI * 3;

const SPARKS = [
  { cx: 12, cy: 4.6, r: 0.8, delay: 0.18 },
  { cx: 19, cy: 8, r: 0.7, delay: 0.26 },
  { cx: 18.5, cy: 16.5, r: 0.7, delay: 0.34 },
  { cx: 8, cy: 18, r: 0.7, delay: 0.42 },
  { cx: 5.5, cy: 9, r: 0.7, delay: 0.5 },
] as const;

export interface SettingsIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SettingsIconProps {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
}

function easeInOut(ms: number) {
  return { duration: ms, easing: MOTION.easing.inOut };
}

function sparkTiming(duration: number, delay: number) {
  return withDelay(
    delay * 1000 * duration,
    withSequence(
      withTiming(1, { duration: 175 * duration, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 175 * duration, easing: Easing.out(Easing.cubic) }),
    ),
  );
}

export const SettingsIcon = forwardRef<SettingsIconHandle, SettingsIconProps>(
  ({ size = 24, duration = 1, color = 'currentColor', isAnimated = true }, ref) => {
    const reduced = useReducedMotion();
    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const gearDraw = useSharedValue(0);
    const coreDraw = useSharedValue(0);
    const spark0 = useSharedValue(0);
    const spark1 = useSharedValue(0);
    const spark2 = useSharedValue(0);
    const spark3 = useSharedValue(0);
    const spark4 = useSharedValue(0);

    const reset = useCallback(() => {
      cancelAnimation(rotate);
      cancelAnimation(scale);
      cancelAnimation(translateY);
      cancelAnimation(gearDraw);
      cancelAnimation(coreDraw);
      cancelAnimation(spark0);
      cancelAnimation(spark1);
      cancelAnimation(spark2);
      cancelAnimation(spark3);
      cancelAnimation(spark4);
      rotate.value = 0;
      scale.value = 1;
      translateY.value = 0;
      gearDraw.value = 0;
      coreDraw.value = 0;
      spark0.value = 0;
      spark1.value = 0;
      spark2.value = 0;
      spark3.value = 0;
      spark4.value = 0;
    }, [coreDraw, gearDraw, rotate, scale, spark0, spark1, spark2, spark3, spark4, translateY]);

    const startAnimation = useCallback(() => {
      if (!isAnimated || reduced) return;

      reset();

      const spinMs = 900 * duration;
      rotate.value = withSequence(
        withTiming(16, easeInOut(spinMs * 0.45)),
        withTiming(0, easeInOut(spinMs * 0.55)),
      );
      scale.value = withSequence(
        withTiming(1.06, easeInOut(spinMs * 0.45)),
        withTiming(1, easeInOut(spinMs * 0.55)),
      );
      translateY.value = withSequence(
        withTiming(-0.8, easeInOut(spinMs * 0.45)),
        withTiming(0, easeInOut(spinMs * 0.55)),
      );

      gearDraw.value = 0;
      gearDraw.value = withDelay(60 * duration, withTiming(1, easeInOut(700 * duration)));

      coreDraw.value = 0;
      coreDraw.value = withDelay(260 * duration, withTiming(1, easeInOut(600 * duration)));

      spark0.value = sparkTiming(duration, SPARKS[0].delay);
      spark1.value = sparkTiming(duration, SPARKS[1].delay);
      spark2.value = sparkTiming(duration, SPARKS[2].delay);
      spark3.value = sparkTiming(duration, SPARKS[3].delay);
      spark4.value = sparkTiming(duration, SPARKS[4].delay);
    }, [
      coreDraw,
      duration,
      gearDraw,
      isAnimated,
      reduced,
      reset,
      rotate,
      scale,
      spark0,
      spark1,
      spark2,
      spark3,
      spark4,
      translateY,
    ]);

    useImperativeHandle(ref, () => ({
      startAnimation,
      stopAnimation: reset,
    }));

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
    }));

    const gearProps = useAnimatedProps(() => ({
      strokeDashoffset: GEAR_LENGTH * (1 - gearDraw.value),
    }));

    const coreProps = useAnimatedProps(() => ({
      strokeDashoffset: CORE_LENGTH * (1 - coreDraw.value),
    }));

    const spark0Props = useAnimatedProps(() => ({ opacity: spark0.value }));
    const spark1Props = useAnimatedProps(() => ({ opacity: spark1.value }));
    const spark2Props = useAnimatedProps(() => ({ opacity: spark2.value }));
    const spark3Props = useAnimatedProps(() => ({ opacity: spark3.value }));
    const spark4Props = useAnimatedProps(() => ({ opacity: spark4.value }));
    const sparkPropsList = [spark0Props, spark1Props, spark2Props, spark3Props, spark4Props];

    return (
      <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <G stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d={GEAR_PATH} />
            <Circle cx={12} cy={12} r={3} />
          </G>

          <AnimatedPath
            d={GEAR_PATH}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={`${GEAR_LENGTH} ${GEAR_LENGTH}`}
            animatedProps={gearProps}
          />

          <AnimatedCircle
            cx={12}
            cy={12}
            r={3}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeDasharray={`${CORE_LENGTH} ${CORE_LENGTH}`}
            animatedProps={coreProps}
          />

          {SPARKS.map((spark, index) => (
            <AnimatedCircle
              key={`${spark.cx}-${spark.cy}`}
              cx={spark.cx}
              cy={spark.cy}
              r={spark.r}
              fill={color}
              animatedProps={sparkPropsList[index]}
            />
          ))}
        </Svg>
      </Animated.View>
    );
  },
);

SettingsIcon.displayName = 'SettingsIcon';
