import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { formatCents } from '@/lib/money';
import { softShadow } from '@/lib/brand';
import { getAnchoredCycleWindow, getCycleWindow } from '@/lib/cycle';
import { useBudgetStore } from '@/stores/budgetStore';

function fmt(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function BudgetTimelineCard() {
  const { palette, isDark } = useTheme();
  const partnership = useBudgetStore((s) => s.partnership);
  const spent = useBudgetStore((s) => s.cycleSpentCents());
  const remaining = useBudgetStore((s) => s.remainingCents());

  if (!partnership) return null;

  const { start, end, daysTotal, daysElapsed, daysRemaining } = partnership.current_cycle_start_at
    ? getAnchoredCycleWindow(partnership.current_cycle_start_at, partnership.cycle_start_day)
    : getCycleWindow(partnership.cycle_start_day);
  const progress = Math.min(1, Math.max(0, daysElapsed / daysTotal));
  const currency = partnership.currency_code;
  const over = remaining < 0;

  const cardBg = isDark ? palette.primaryContainer : palette.cream;
  const textMain = isDark ? palette.onPrimaryContainer : palette.onSurface;
  const statBg = isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.55)';
  const trackBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(61,64,57,0.1)';

  return (
    <View
      className="mb-5 p-5 overflow-hidden"
      style={{
        backgroundColor: cardBg,
        borderRadius: 32,
        borderWidth: isDark ? 0 : 1,
        borderColor: palette.border,
        ...softShadow('md', isDark),
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: 18, right: 20, width: 52, height: 36 }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: palette.sage,
            opacity: isDark ? 0.55 : 0.9,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 18,
            top: 4,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: palette.peach,
            opacity: isDark ? 0.55 : 0.9,
          }}
        />
      </View>

      <Text
        className="font-manrope-semibold text-xs uppercase tracking-widest mb-1"
        style={{ color: textMain, opacity: 0.7 }}
      >
        Monthly budget
      </Text>
      <Text className="font-manrope-extrabold mb-4" style={{ fontSize: 38, color: textMain, letterSpacing: -0.5 }}>
        {formatCents(partnership.monthly_budget_cents, currency)}
      </Text>

      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 px-3 py-3" style={{ backgroundColor: statBg, borderRadius: 20 }}>
          <Text className="font-manrope-semibold text-xs mb-1" style={{ color: textMain, opacity: 0.65 }}>
            Spent
          </Text>
          <Text className="font-manrope-extrabold text-base" style={{ color: textMain }}>
            {formatCents(spent, currency)}
          </Text>
        </View>
        <View className="flex-1 px-3 py-3" style={{ backgroundColor: statBg, borderRadius: 20 }}>
          <Text className="font-manrope-semibold text-xs mb-1" style={{ color: textMain, opacity: 0.65 }}>
            Remaining
          </Text>
          <Text
            className="font-manrope-extrabold text-base"
            style={{ color: over ? palette.budgetOver : palette.budgetGood }}
          >
            {formatCents(Math.abs(remaining), currency)}
            {over ? ' over' : ''}
          </Text>
        </View>
        <View className="flex-1 px-3 py-3" style={{ backgroundColor: statBg, borderRadius: 20 }}>
          <Text className="font-manrope-semibold text-xs mb-1" style={{ color: textMain, opacity: 0.65 }}>
            Cycle
          </Text>
          <Text className="font-manrope-extrabold text-base" style={{ color: palette.peach }}>
            {daysRemaining}d left
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="font-manrope-semibold text-xs" style={{ color: textMain, opacity: 0.75 }}>
          {fmt(start)}
        </Text>
        <Text className="font-manrope-semibold text-xs" style={{ color: textMain, opacity: 0.75 }}>
          {fmt(end)}
        </Text>
      </View>
      <View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: trackBg }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: isDark ? palette.primary : palette.budgetGood,
          }}
        />
      </View>
      <Text className="font-manrope-medium text-xs mt-2" style={{ color: textMain, opacity: 0.6 }}>
        Day {daysElapsed} of {daysTotal} in this cycle
      </Text>
    </View>
  );
}
