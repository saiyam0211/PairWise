import { View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { CalendarClock } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFade, exitFadeDown } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

interface SpendWhenPromptProps {
  onToday: () => void;
  onPastSpend: () => void;
  onBack: () => void;
  amountDisplay: string;
  description: string;
  saving?: boolean;
}

export function SpendWhenPrompt({
  onToday,
  onPastSpend,
  onBack,
  amountDisplay,
  description,
  saving,
}: SpendWhenPromptProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();

  return (
    <Animated.View
      entering={enterFade(reduced)}
      exiting={exitFadeDown(reduced)}
      className="flex-1 px-6 pt-6 justify-center"
    >
      <MotionPressable onPress={onBack} disabled={saving} className="mb-4 absolute top-6 left-6">
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
          ← {amountDisplay}
        </Text>
      </MotionPressable>

      <View
        className="self-center w-14 h-14 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: palette.peach + '55' }}
      >
        <CalendarClock size={26} color={palette.onSurface} />
      </View>

      <Text className="font-manrope-extrabold text-2xl mb-2 text-center" style={{ color: palette.onSurface }}>
        When was this?
      </Text>
      <Text className="font-manrope-medium text-sm mb-6 text-center px-4" style={{ color: palette.onSurfaceVariant }}>
        Save for today, or pick an earlier date for a past expense
      </Text>

      <View
        className="self-center px-3 py-1 mb-8"
        style={{ backgroundColor: palette.sage + '55', borderRadius: RADIUS.pill }}
      >
        <Text className="font-manrope-semibold text-sm" style={{ color: palette.onSurface }}>
          {description.trim() || 'Expense'}
        </Text>
      </View>

      <View className="gap-3">
        <MotionPressable
          onPress={onToday}
          disabled={saving}
          className="py-4 items-center"
          style={{
            backgroundColor: palette.accent,
            borderRadius: RADIUS.pill,
            ...softShadow('md', isDark),
          }}
        >
          <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
            {saving ? 'Saving…' : 'Today'}
          </Text>
        </MotionPressable>

        <MotionPressable
          onPress={onPastSpend}
          disabled={saving}
          className="py-4 items-center"
          style={{
            backgroundColor: palette.cream,
            borderRadius: RADIUS.pill,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
            Past spend
          </Text>
        </MotionPressable>
      </View>
    </Animated.View>
  );
}
