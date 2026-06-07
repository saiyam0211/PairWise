import { View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Scale } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, exitFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

interface QuantityPromptProps {
  onAddQuantity: () => void;
  onSkip: () => void;
  onBack: () => void;
  amountDisplay: string;
  description: string;
}

export function QuantityPrompt({
  onAddQuantity,
  onSkip,
  onBack,
  amountDisplay,
  description,
}: QuantityPromptProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Animated.View
      entering={enterFade(reduced)}
      exiting={exitFadeDown(reduced)}
      className="flex-1 px-6 pt-6 justify-center"
    >
      <MotionPressable onPress={onBack} className="mb-4 absolute top-6 left-6">
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
          ← {amountDisplay}
        </Text>
      </MotionPressable>

      <View
        className="self-center w-14 h-14 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: palette.sage + '55' }}
      >
        <Scale size={26} color={palette.onSurface} />
      </View>

      <Text className="font-manrope-extrabold text-2xl mb-2 text-center" style={{ color: palette.onSurface }}>
        Add a quantity?
      </Text>
      <Text className="font-manrope-medium text-sm mb-6 text-center px-4" style={{ color: palette.onSurfaceVariant }}>
        Optional — track how much you bought, like 2 kg or 500 ml
      </Text>

      <View
        className="self-center px-3 py-1 mb-8"
        style={{ backgroundColor: palette.peach + '55', borderRadius: RADIUS.pill }}
      >
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.onSurface }}>
          {description.trim() || 'Expense'}
        </Text>
      </View>

      <View className="gap-3">
        <MotionPressable
          onPress={onAddQuantity}
          className="py-4 items-center"
          style={{
            backgroundColor: palette.accent,
            borderRadius: RADIUS.pill,
            ...softShadow('md', isDark),
          }}
        >
          <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
            Yes, add quantity
          </Text>
        </MotionPressable>

        <MotionPressable
          onPress={onSkip}
          className="py-4 items-center"
          style={{
            backgroundColor: palette.cream,
            borderRadius: RADIUS.pill,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
            No, skip quantity
          </Text>
        </MotionPressable>
      </View>
    </Animated.View>
  );
}
