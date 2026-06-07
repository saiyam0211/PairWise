import { useRef, useEffect } from 'react';
import { TextInput, View, Text } from 'react-native';
import { ArrowLeft, ArrowRight } from '@/components/ArrowIcons';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, exitFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

interface DescriptionInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  amountDisplay: string;
}

export function DescriptionInput({
  value,
  onChange,
  onSubmit,
  onBack,
  amountDisplay,
}: DescriptionInputProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      entering={enterFade(reduced)}
      exiting={exitFadeDown(reduced)}
      className="flex-1 px-6 pt-6"
    >
      <MotionPressable onPress={onBack} className="mb-4 flex-row items-center gap-2">
        <ArrowLeft size={20} color={palette.dateHeader} />
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
          {amountDisplay}
        </Text>
      </MotionPressable>

      <Text className="font-manrope-extrabold text-2xl mb-2" style={{ color: palette.onSurface }}>
        What was it for?
      </Text>
      <Text className="font-manrope-medium text-sm mb-5" style={{ color: palette.onSurfaceVariant }}>
        Add a short note so you both remember
      </Text>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Coffee, groceries…"
        placeholderTextColor={palette.onSurfaceVariant}
        className="text-lg font-manrope px-5 py-4 mb-6"
        style={{
          backgroundColor: palette.surface,
          color: palette.onSurface,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: palette.border,
          ...softShadow('sm', isDark),
        }}
        returnKeyType="next"
        onSubmitEditing={onSubmit}
        maxLength={120}
      />

      <MotionPressable
        onPress={onSubmit}
        className="py-4 items-center flex-row justify-center gap-2"
        style={{
          backgroundColor: palette.accent,
          borderRadius: RADIUS.pill,
          ...softShadow('md', isDark),
        }}
      >
        <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
          Next
        </Text>
        <ArrowRight size={20} color={palette.onAccent} />
      </MotionPressable>
    </Animated.View>
  );
}
