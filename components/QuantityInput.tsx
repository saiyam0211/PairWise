import { useState } from 'react';
import { View, Text, TextInput, Modal, FlatList } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { ArrowLeft } from '@/components/ArrowIcons';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFadeDown } from '@/lib/motion';
import { PrimaryButton } from '@/components/OnboardScreen';
import { MotionPressable } from '@/components/MotionPressable';

export const UNITS = ['piece', 'Kg', 'gm', 'ml', 'lt'] as const;
export type SpendUnit = (typeof UNITS)[number];

interface QuantityInputProps {
  quantity: string;
  unit: SpendUnit;
  onQuantityChange: (v: string) => void;
  onUnitChange: (u: SpendUnit) => void;
  onSubmit: () => void;
  onBack: () => void;
  amountDisplay: string;
  description: string;
  saving?: boolean;
}

export function QuantityInput({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  onSubmit,
  onBack,
  amountDisplay,
  description,
  saving,
}: QuantityInputProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Animated.View entering={enterFadeDown(reduced)} className="flex-1 px-6 pt-6">
      <MotionPressable onPress={onBack} className="mb-4 flex-row items-center gap-2">
        <ArrowLeft size={20} color={palette.dateHeader} />
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
          {amountDisplay}
        </Text>
      </MotionPressable>

      <View
        className="self-start px-3 py-1 mb-3"
        style={{ backgroundColor: palette.peach + '55', borderRadius: RADIUS.pill }}
      >
        <Text className="font-manrope-semibold text-xs" style={{ color: palette.onSurface }}>
          {description.trim() || 'Expense'}
        </Text>
      </View>
      <Text className="font-manrope-extrabold text-2xl mb-6" style={{ color: palette.onSurface }}>
        How much did you get?
      </Text>

      <View className="flex-row gap-3 mb-6">
        <TextInput
          value={quantity}
          onChangeText={(v) => onQuantityChange(v.replace(/[^0-9.]/g, ''))}
          placeholder="1"
          placeholderTextColor={palette.onSurfaceVariant}
          keyboardType="decimal-pad"
          className="font-manrope-extrabold flex-1 px-5 py-4 text-center"
          style={{
            backgroundColor: palette.surface,
            color: palette.onSurface,
            borderRadius: RADIUS.xl,
            fontSize: 32,
            borderWidth: 1,
            borderColor: palette.border,
            ...softShadow('sm', isDark),
          }}
        />

        <MotionPressable
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center justify-center px-5 gap-2"
          style={{
            backgroundColor: palette.sage + '66',
            borderRadius: RADIUS.xl,
            minWidth: 110,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text className="font-manrope-bold text-lg" style={{ color: palette.onSurface }}>
            {unit}
          </Text>
          <ChevronDown size={18} color={palette.onSurface} />
        </MotionPressable>
      </View>

      <PrimaryButton label="Continue" onPress={onSubmit} loading={saving} variant="peach" trailingArrow />

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <MotionPressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(61,64,57,0.45)' }}
          onPress={() => setPickerOpen(false)}
        >
          <View
            className="px-4 pt-4 pb-8"
            style={{ backgroundColor: palette.surface, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl }}
          >
            <Text className="font-manrope-bold text-lg mb-3 px-2" style={{ color: palette.onSurface }}>
              Unit
            </Text>
            <FlatList
              data={UNITS as unknown as SpendUnit[]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <MotionPressable
                  onPress={() => {
                    onUnitChange(item);
                    setPickerOpen(false);
                  }}
                  className="px-4 py-4 mb-2"
                  style={{
                    backgroundColor: item === unit ? palette.primaryContainer : palette.surfaceVariant,
                    borderRadius: RADIUS.lg,
                  }}
                >
                  <Text
                    className="font-manrope-semibold text-base"
                    style={{ color: item === unit ? palette.onPrimaryContainer : palette.onSurface }}
                  >
                    {item}
                  </Text>
                </MotionPressable>
              )}
            />
          </View>
        </MotionPressable>
      </Modal>
    </Animated.View>
  );
}
