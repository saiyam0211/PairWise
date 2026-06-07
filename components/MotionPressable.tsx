import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MotionPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

/** Press / tap feedback — subtle scale-down on press (animations.dev). */
export function MotionPressable({
  style,
  scaleTo = MOTION.pressScale,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: MotionPressableProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[animStyle, style]}
      onPressIn={(e) => {
        if (!disabled && !reduced) {
          scale.value = withTiming(scaleTo, {
            duration: MOTION.duration.instant,
            easing: MOTION.easing.out,
          });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) {
          scale.value = withTiming(1, {
            duration: MOTION.duration.fast,
            easing: MOTION.easing.out,
          });
        }
        onPressOut?.(e);
      }}
    />
  );
}
