import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { toast } from '@/lib/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { CalendarCheck, History, PiggyBank, TrendingDown, Users } from 'lucide-react-native';
import { ArrowLeft } from '@/components/ArrowIcons';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { fmtCycleDate } from '@/lib/cycle';
import { formatCents } from '@/lib/money';
import { enterFade, enterFadeDown } from '@/lib/motion';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import type { Database } from '@/lib/supabase';
import { BrandDecor } from '@/components/BrandDecor';
import { MotionPressable } from '@/components/MotionPressable';
import { CycleDayPicker, CycleDayTrigger } from '@/components/CycleDayPicker';
import { NumericKeypad } from '@/components/NumericKeypad';
import { keypadDigit, keypadBackspace } from '@/lib/money';

type CycleSnapshot = Database['public']['Tables']['cycle_snapshots']['Row'];
type ViewMode = 'summary' | 'history' | 'setup';

function SnapshotSummary({ snapshot, currency }: { snapshot: CycleSnapshot; currency: string }) {
  const { palette, isDark } = useTheme();
  const session = useAuthStore((s) => s.session?.user?.id);
  const saved = snapshot.saved_cents;
  const over = saved < 0;

  return (
    <View
      className="p-5 mb-4"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.xxl,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('md', isDark),
      }}
    >
      <View className="flex-row items-center gap-2 mb-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: palette.sage + '55' }}
        >
          <CalendarCheck size={20} color={palette.onSurface} />
        </View>
        <View className="flex-1">
          <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
            {fmtCycleDate(snapshot.cycle_start_at)} – {fmtCycleDate(snapshot.cycle_end_at)}
          </Text>
          <Text className="font-manrope-medium text-xs capitalize" style={{ color: palette.onSurfaceVariant }}>
            {snapshot.close_reason === 'natural' ? 'Ended on schedule' : 'Ended early'}
          </Text>
        </View>
      </View>

      <View
        className="items-center py-5 mb-4"
        style={{ backgroundColor: palette.cream, borderRadius: RADIUS.xl }}
      >
        <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-1" style={{ color: palette.onSurfaceVariant }}>
          Spent together
        </Text>
        <Text className="font-manrope-extrabold text-4xl" style={{ color: palette.onSurface, letterSpacing: -1 }}>
          {formatCents(snapshot.total_spent_cents, currency)}
        </Text>
        <Text className="font-manrope-medium text-xs mt-1" style={{ color: palette.onSurfaceVariant }}>
          of {formatCents(snapshot.budget_cents, currency)} budget
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mb-3">
        <Users size={16} color={palette.onSurfaceVariant} />
        <Text className="font-manrope-bold text-sm" style={{ color: palette.onSurface }}>
          Partner breakdown
        </Text>
      </View>

      <View className="gap-2 mb-4">
        {snapshot.member_spends.map((member) => {
          const isSelf = member.user_id === session;
          const accent = isSelf ? palette.sage : palette.peach;
          return (
            <View
              key={member.user_id}
              className="flex-row items-center justify-between px-4 py-3"
              style={{
                backgroundColor: accent + '44',
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text className="font-manrope-semibold text-base" style={{ color: palette.onSurface }}>
                {isSelf ? 'You' : member.display_name}
              </Text>
              <Text className="font-manrope-extrabold text-base" style={{ color: palette.onSurface }}>
                {formatCents(member.spent_cents, currency)}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        className="flex-row items-center gap-3 px-4 py-4"
        style={{
          backgroundColor: over ? palette.budgetOver + '22' : palette.sage + '33',
          borderRadius: RADIUS.lg,
        }}
      >
        {over ? (
          <TrendingDown size={22} color={palette.budgetOver} />
        ) : (
          <PiggyBank size={22} color={palette.primary} />
        )}
        <View className="flex-1">
          <Text className="font-manrope-semibold text-xs uppercase tracking-widest" style={{ color: palette.onSurfaceVariant }}>
            {over ? 'Over budget' : 'Saved this cycle'}
          </Text>
          <Text
            className="font-manrope-extrabold text-xl"
            style={{ color: over ? palette.budgetOver : palette.onSurface }}
          >
            {formatCents(Math.abs(saved), currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function CycleClosedScreen() {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const session = useAuthStore((s) => s.session);
  const partnership = useBudgetStore((s) => s.partnership);
  const snapshots = useBudgetStore((s) => s.cycleSnapshots);
  const latestSnapshot = useBudgetStore((s) => s.latestSnapshot());
  const startNewCycle = useBudgetStore((s) => s.startNewCycle);
  const loadPartnership = useBudgetStore((s) => s.loadPartnership);

  const [mode, setMode] = useState<ViewMode>('summary');
  const [selected, setSelected] = useState<CycleSnapshot | null>(null);
  const [budgetRupees, setBudgetRupees] = useState(0);
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCreator = partnership?.creator_id === session?.user?.id;
  const currency = partnership?.currency_code ?? 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const displaySnapshot = selected ?? latestSnapshot;

  useEffect(() => {
    if (!partnership?.id || partnership.cycle_active || isCreator) return;
    const timer = setInterval(() => {
      loadPartnership(partnership.id);
    }, 8000);
    return () => clearInterval(timer);
  }, [partnership?.id, partnership?.cycle_active, isCreator, loadPartnership]);

  function openSetup() {
    if (!partnership) return;
    setBudgetRupees(Math.floor(partnership.monthly_budget_cents / 100));
    setCycleStartDay(partnership.cycle_start_day);
    setMode('setup');
  }

  async function handleStartCycle() {
    if (budgetRupees === 0 || saving) return;
    setSaving(true);
    const { error } = await startNewCycle(budgetRupees * 100, cycleStartDay);
    setSaving(false);
    if (error) toast.error('Error', error);
  }

  if (mode === 'setup' && isCreator) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'bottom']}>
        <View className="flex-1">
          <View className="px-6 pt-4 pb-2">
            <MotionPressable onPress={() => setMode('summary')} className="flex-row items-center gap-2 mb-4 self-start">
              <ArrowLeft size={20} color={palette.dateHeader} />
              <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
                Back
              </Text>
            </MotionPressable>
            <BrandDecor size="sm" />
            <Text className="font-manrope-extrabold text-2xl mb-1" style={{ color: palette.onSurface }}>
              Set up new cycle
            </Text>
            <Text className="font-manrope-medium text-sm mb-4" style={{ color: palette.onSurfaceVariant }}>
              Choose your budget and reset day to start tracking again
            </Text>

            <View
              className="w-full items-center py-6 px-4 mb-4"
              style={{
                backgroundColor: palette.cream,
                borderRadius: RADIUS.xxl,
                borderWidth: 1,
                borderColor: palette.border,
                ...softShadow('sm', isDark),
              }}
            >
              <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-2" style={{ color: palette.onSurfaceVariant }}>
                Monthly budget
              </Text>
              <Text className="font-manrope-extrabold text-5xl" style={{ color: palette.onSurface, letterSpacing: -1 }}>
                {`${currencySymbol}${budgetRupees.toLocaleString('en-IN')}`}
              </Text>
            </View>

            <View
              className="p-4"
              style={{
                backgroundColor: palette.surface,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text className="font-manrope-bold text-sm mb-3" style={{ color: palette.onSurface }}>
                Cycle reset day
              </Text>
              <View className="flex-row items-center justify-center gap-3">
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  Resets on day
                </Text>
                <CycleDayTrigger day={cycleStartDay} onPress={() => setShowDayPicker(true)} />
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  of each month
                </Text>
              </View>
            </View>
          </View>

          <NumericKeypad
            hideDecimal
            onDigit={(d) => setBudgetRupees((r) => keypadDigit(r, d))}
            onBackspace={() => setBudgetRupees((r) => keypadBackspace(r))}
            onConfirm={handleStartCycle}
            confirmDisabled={budgetRupees === 0 || saving}
          />
        </View>

        <CycleDayPicker
          visible={showDayPicker}
          value={cycleStartDay}
          onChange={setCycleStartDay}
          onClose={() => setShowDayPicker(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enterFade(reduced)}>
          {mode === 'history' ? (
            <>
              <MotionPressable
                onPress={() => {
                  setSelected(null);
                  setMode('summary');
                }}
                className="flex-row items-center gap-2 mb-4 self-start"
              >
                <ArrowLeft size={20} color={palette.dateHeader} />
                <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
                  Back to summary
                </Text>
              </MotionPressable>
              <Text className="font-manrope-extrabold text-2xl mb-1" style={{ color: palette.onSurface }}>
                Past cycles
              </Text>
              <Text className="font-manrope-medium text-sm mb-5" style={{ color: palette.onSurfaceVariant }}>
                Review previous months together
              </Text>
              {snapshots.map((snap) => (
                <MotionPressable
                  key={snap.id}
                  onPress={() => {
                    setSelected(snap);
                    setMode('summary');
                  }}
                  className="mb-3 p-4"
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1,
                    borderColor: palette.border,
                    ...softShadow('sm', isDark),
                  }}
                >
                  <Text className="font-manrope-bold text-base mb-1" style={{ color: palette.onSurface }}>
                    {fmtCycleDate(snap.cycle_start_at)} – {fmtCycleDate(snap.cycle_end_at)}
                  </Text>
                  <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                    {formatCents(snap.total_spent_cents, currency)} spent ·{' '}
                    {snap.saved_cents >= 0 ? 'saved' : 'over'}{' '}
                    {formatCents(Math.abs(snap.saved_cents), currency)}
                  </Text>
                </MotionPressable>
              ))}
            </>
          ) : (
            <>
              <View className="items-center mb-5">
                <BrandDecor size="sm" />
                <Text className="font-manrope-extrabold text-3xl text-center mt-2" style={{ color: palette.onSurface, letterSpacing: -0.5 }}>
                  Cycle complete
                </Text>
                <Text className="font-manrope-medium text-sm text-center mt-2 px-4" style={{ color: palette.onSurfaceVariant }}>
                  {isCreator
                    ? 'Review your summary, then start a new cycle to keep tracking.'
                    : 'Waiting for your partner to start the next cycle. You can review past spending below.'}
                </Text>
              </View>

              {displaySnapshot ? (
                <Animated.View entering={enterFadeDown(reduced)}>
                  <SnapshotSummary snapshot={displaySnapshot} currency={currency} />
                </Animated.View>
              ) : null}

              <View className="gap-3 mt-2">
                <MotionPressable
                  onPress={() => setMode('history')}
                  className="flex-row items-center justify-center gap-2 py-4"
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                >
                  <History size={18} color={palette.onSurface} />
                  <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
                    View past cycles
                  </Text>
                </MotionPressable>

                {isCreator ? (
                  <MotionPressable
                    onPress={openSetup}
                    className="py-4 items-center"
                    style={{
                      backgroundColor: palette.accent,
                      borderRadius: RADIUS.pill,
                      ...softShadow('md', isDark),
                    }}
                  >
                    <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
                      Start new cycle
                    </Text>
                  </MotionPressable>
                ) : null}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
