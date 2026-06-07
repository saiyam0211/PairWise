import { useState, useEffect } from 'react';
import { Modal, View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { CalendarDays } from 'lucide-react-native';
import { ArrowLeft, ArrowRight } from '@/components/ArrowIcons';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';
import { daysInMonth, monthLabel, sameDay, startOfDay } from '@/lib/dates';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface SpendDatePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
}

export function SpendDatePicker({
  visible,
  value,
  onSelect,
  onClose,
  minDate,
  maxDate = new Date(),
}: SpendDatePickerProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [visible, value]);

  const min = minDate ? startOfDay(minDate) : undefined;
  const max = startOfDay(maxDate);
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  function isDisabled(day: number): boolean {
    const d = startOfDay(new Date(viewYear, viewMonth, day));
    if (min && d < min) return true;
    if (d > max) return true;
    return false;
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return;
    onSelect(startOfDay(new Date(viewYear, viewMonth, day)));
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const canGoNext =
    viewYear < max.getFullYear() || (viewYear === max.getFullYear() && viewMonth < max.getMonth());
  const canGoPrev = min
    ? viewYear > min.getFullYear() || (viewYear === min.getFullYear() && viewMonth > min.getMonth())
    : true;

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
              style={{ backgroundColor: palette.sage + '66' }}
            >
              <CalendarDays size={22} color={palette.onSurface} />
            </View>
            <View className="flex-1">
              <Text className="font-manrope-extrabold text-lg" style={{ color: palette.onSurface }}>
                Pick a date
              </Text>
              <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
                No time needed — just the day
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-5 mb-3 px-1">
            <MotionPressable
              onPress={() => canGoPrev && shiftMonth(-1)}
              disabled={!canGoPrev}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoPrev ? 1 : 0.35,
                backgroundColor: palette.cream,
              }}
            >
              <ArrowLeft size={22} color={palette.onSurface} />
            </MotionPressable>

            <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
              {monthLabel(viewYear, viewMonth)}
            </Text>

            <MotionPressable
              onPress={() => canGoNext && shiftMonth(1)}
              disabled={!canGoNext}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoNext ? 1 : 0.35,
                backgroundColor: palette.cream,
              }}
            >
              <ArrowRight size={22} color={palette.onSurface} />
            </MotionPressable>
          </View>

          <View className="flex-row mb-2 px-1">
            {WEEKDAYS.map((label, i) => (
              <View key={`${label}-${i}`} style={{ flex: 1, alignItems: 'center' }}>
                <Text className="font-manrope-semibold text-xs" style={{ color: palette.onSurfaceVariant }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-6 px-1">
            {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => {
              const rowCells = cells.slice(row * 7, row * 7 + 7);
              while (rowCells.length < 7) rowCells.push(null);

              return (
                <View key={row} className="flex-row mb-2">
                  {rowCells.map((day, col) => {
                    if (day === null) {
                      return <View key={`empty-${row}-${col}`} style={{ flex: 1, aspectRatio: 1, marginHorizontal: 2 }} />;
                    }

                  const selected = sameDay(new Date(viewYear, viewMonth, day), value);
                  const disabled = isDisabled(day);
                  const isTodayCell = sameDay(new Date(viewYear, viewMonth, day), max);

                  return (
                    <MotionPressable
                      key={day}
                      onPress={() => selectDay(day)}
                      disabled={disabled}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        marginHorizontal: 2,
                        borderRadius: RADIUS.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? palette.accent : palette.cream,
                        borderWidth: 1,
                        borderColor: selected ? palette.accent : isTodayCell ? palette.peach : palette.border,
                        opacity: disabled ? 0.35 : 1,
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
              );
            })}
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
              Cancel
            </Text>
          </MotionPressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
