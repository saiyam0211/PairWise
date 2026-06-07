import { type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Settings, Pencil } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { useBudgetStore } from '@/stores/budgetStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCents } from '@/lib/money';
import { getAnchoredCycleWindow, getCycleWindow } from '@/lib/cycle';
import { MotionPressable } from '@/components/MotionPressable';

interface BudgetPillProps {
  onHistoryPress: () => void;
  onSettingsPress: () => void;
  onEditPress: () => void;
}

function MiniAvatar({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.85)',
      }}
    >
      <Text className="font-manrope-extrabold text-xs" style={{ color: '#3D4039' }}>
        {label}
      </Text>
    </View>
  );
}

function SideButton({
  onPress,
  children,
  palette,
  isDark,
}: {
  onPress: () => void;
  children: ReactNode;
  palette: ReturnType<typeof useTheme>['palette'];
  isDark: boolean;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      className="w-12 h-12 items-center justify-center"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('sm', isDark),
      }}
    >
      {children}
    </MotionPressable>
  );
}

export function BudgetPill({ onHistoryPress, onSettingsPress, onEditPress }: BudgetPillProps) {
  const { palette, isDark } = useTheme();
  const { session } = useAuthStore();
  const partnership = useBudgetStore((s) => s.partnership);
  const remaining = useBudgetStore((s) => s.remainingCents());
  const cycleSpent = useBudgetStore((s) => s.cycleSpentCents());
  const spentToday = useBudgetStore((s) => s.spentTodayCents());
  const joined = useBudgetStore((s) => s.partnerJoined());
  const myProfile = useBudgetStore((s) => s.myProfile());
  const partner = useBudgetStore((s) => s.partnerProfile());

  const isCreator = partnership?.creator_id === session?.user?.id;
  const isOver = remaining < 0;
  const currency = partnership?.currency_code ?? 'INR';
  const budgetTotal = partnership?.monthly_budget_cents ?? 0;
  const progress = budgetTotal > 0 ? Math.min(1, cycleSpent / budgetTotal) : 0;

  const { daysRemaining } = partnership
    ? partnership.current_cycle_start_at
      ? getAnchoredCycleWindow(partnership.current_cycle_start_at, partnership.cycle_start_day)
      : getCycleWindow(partnership.cycle_start_day)
    : { daysRemaining: 0 };

  const pillColor = isOver ? palette.budgetOver : palette.budgetGood;
  const textColor = palette.budgetGoodText;

  const myInitial = (myProfile?.display_name?.trim()?.[0] ?? 'Y').toUpperCase();
  const partnerInitial = (
    partner?.display_name?.trim()?.[0] ??
    partnership?.partner_name?.trim()?.[0] ??
    'P'
  ).toUpperCase();

  return (
    <View className="flex-row items-start gap-3 px-4 pt-3 pb-2">
      <MotionPressable
        onPress={onHistoryPress}
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: pillColor,
          borderRadius: RADIUS.xxl,
          ...softShadow('md', isDark),
        }}
        scaleTo={0.98}
      >
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-manrope-semibold uppercase tracking-widest" style={{ color: textColor, opacity: 0.8 }}>
                {isOver ? 'Over budget' : 'Remaining'}
              </Text>
              <Text className="text-3xl font-manrope-extrabold mt-1" style={{ color: textColor, letterSpacing: -0.5 }}>
                {formatCents(Math.abs(remaining), currency)}
              </Text>
            </View>

            {joined ? (
              <View className="flex-row items-center" style={{ marginTop: 4 }}>
                <MiniAvatar label={myInitial} color={palette.sage} />
                <View style={{ marginLeft: -10 }}>
                  <MiniAvatar label={partnerInitial} color={palette.peach} />
                </View>
              </View>
            ) : session ? (
              <View
                className="px-3 py-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: RADIUS.pill }}
              >
                <Text className="font-manrope-semibold text-xs" style={{ color: textColor }}>
                  Waiting for partner
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="mt-4 h-2 overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.pill }}
          >
            <View
              style={{
                width: `${Math.max(progress * 100, progress > 0 ? 4 : 0)}%`,
                height: '100%',
                backgroundColor: isOver ? '#FFFFFF' : 'rgba(255,255,255,0.92)',
                borderRadius: RADIUS.pill,
              }}
            />
          </View>

          <View className="flex-row items-center justify-between mt-3">
            <Text className="font-manrope-medium text-xs" style={{ color: textColor, opacity: 0.85 }}>
              {formatCents(cycleSpent, currency)} of {formatCents(budgetTotal, currency)}
            </Text>
            <Text className="font-manrope-medium text-xs" style={{ color: textColor, opacity: 0.85 }}>
              {daysRemaining}d left
            </Text>
          </View>

          {spentToday > 0 ? (
            <View
              className="self-start mt-3 px-3 py-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.pill }}
            >
              <Text className="font-manrope-semibold text-xs" style={{ color: textColor }}>
                {formatCents(spentToday, currency)} spent today
              </Text>
            </View>
          ) : null}
        </View>
      </MotionPressable>

      <View className="gap-2 mt-1">
        <SideButton onPress={onSettingsPress} palette={palette} isDark={isDark}>
          <Settings size={20} color={palette.primary} />
        </SideButton>
        {isCreator ? (
          <SideButton onPress={onEditPress} palette={palette} isDark={isDark}>
            <Pencil size={18} color={palette.secondary} />
          </SideButton>
        ) : null}
      </View>
    </View>
  );
}
