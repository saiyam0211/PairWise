import { useEffect } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/themeStore';
import { useTheme, type ThemePreference } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { MOTION } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
  chipBg: string;
  chipIcon: string;
}[] = [
  { value: 'light', label: 'Light', Icon: Sun, chipBg: '#EDE8E1', chipIcon: '#7D9488' },
  { value: 'dark', label: 'Dark', Icon: Moon, chipBg: '#3D4A38', chipIcon: '#E8A882' },
];

const TRACK_PADDING = 5;

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore();
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  const segmentWidth = useSharedValue(0);
  const activeIndex = useSharedValue(preference === 'light' ? 0 : 1);

  useEffect(() => {
    activeIndex.value = withTiming(preference === 'light' ? 0 : 1, {
      duration: reduced ? MOTION.duration.fast : MOTION.duration.normal,
      easing: MOTION.easing.out,
    });
  }, [preference, reduced]);

  function onTrackLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    segmentWidth.value = (w - TRACK_PADDING * 2) / 2;
  }

  const pillStyle = useAnimatedStyle(() => ({
    width: segmentWidth.value,
    transform: [{ translateX: activeIndex.value * segmentWidth.value }],
  }));

  return (
    <View
      onLayout={onTrackLayout}
      style={{
        backgroundColor: palette.keyBg,
        borderRadius: RADIUS.xl,
        padding: TRACK_PADDING,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          pillStyle,
          {
            position: 'absolute',
            top: TRACK_PADDING,
            left: TRACK_PADDING,
            bottom: TRACK_PADDING,
            borderRadius: RADIUS.lg,
            backgroundColor: palette.surface,
            ...softShadow('sm', isDark),
          },
        ]}
      />

      <View className="flex-row">
        {OPTIONS.map(({ value, label, Icon, chipBg, chipIcon }) => {
          const active = preference === value;
          return (
            <MotionPressable
              key={value}
              onPress={() => setPreference(value)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
              scaleTo={0.98}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? chipBg : palette.surfaceVariant,
                  marginBottom: 6,
                }}
              >
                <Icon size={20} color={active ? chipIcon : palette.onSurfaceVariant} strokeWidth={2.25} />
              </View>
              <Text
                className="font-manrope-bold text-sm"
                style={{ color: active ? palette.onSurface : palette.onSurfaceVariant }}
              >
                {label}
              </Text>
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}
