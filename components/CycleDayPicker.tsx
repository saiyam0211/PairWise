import { Modal, View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

export const MAX_CYCLE_START_DAY = 28;
const DAYS = Array.from({ length: MAX_CYCLE_START_DAY }, (_, i) => i + 1);

interface CycleDayPickerProps {
  visible: boolean;
  value: number;
  onChange: (day: number) => void;
  onClose: () => void;
}

export function CycleDayPicker({ visible, value, onChange, onClose }: CycleDayPickerProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  function selectDay(day: number) {
    onChange(day);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={enterFade(reduced)}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(61, 64, 57, 0.52)' }}
      >
        <MotionPressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          scaleTo={1}
        />

        <Animated.View
          entering={enterFadeDown(reduced, 20)}
          className="px-5 pt-5 pb-8"
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: RADIUS.xxl,
            borderTopRightRadius: RADIUS.xxl,
            ...softShadow('lg', isDark),
          }}
        >
          <View className="flex-row items-center gap-3 mb-1 px-1">
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: palette.peach + '66' }}
            >
              <CalendarDays size={22} color={palette.onSurface} />
            </View>
            <View className="flex-1">
              <Text className="font-manrope-extrabold text-lg" style={{ color: palette.onSurface }}>
                Cycle reset day
              </Text>
              <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
                Your budget renews on this day each month
              </Text>
            </View>
          </View>

          <View className="mt-5 mb-6 px-1">
            {Array.from({ length: 4 }, (_, row) => (
              <View key={row} className="flex-row gap-2 mb-2">
                {DAYS.slice(row * 7, row * 7 + 7).map((day) => {
                  const selected = day === value;
                  return (
                    <MotionPressable
                      key={day}
                      onPress={() => selectDay(day)}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: RADIUS.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? palette.accent : palette.cream,
                        borderWidth: 1,
                        borderColor: selected ? palette.accent : palette.border,
                        ...(selected ? softShadow('sm', isDark) : {}),
                      }}
                    >
                      <Text
                        className="font-manrope-bold text-base"
                        style={{ color: selected ? palette.onAccent : palette.onSurface }}
                      >
                        {day}
                      </Text>
                    </MotionPressable>
                  );
                })}
              </View>
            ))}
          </View>

          <MotionPressable
            onPress={onClose}
            className="py-4 items-center"
            style={{
              backgroundColor: palette.cream,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
              Done
            </Text>
          </MotionPressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface CycleDayTriggerProps {
  day: number;
  onPress: () => void;
}

export function CycleDayTrigger({ day, onPress }: CycleDayTriggerProps) {
  const { palette, isDark } = useTheme();

  return (
    <MotionPressable
      onPress={onPress}
      className="px-5 py-2"
      style={{
        backgroundColor: palette.peach + '66',
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('sm', isDark),
      }}
    >
      <Text className="font-manrope-extrabold text-center" style={{ color: palette.onSurface, fontSize: 18, minWidth: 28 }}>
        {day}
      </Text>
    </MotionPressable>
  );
}
