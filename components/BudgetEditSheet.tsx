import { forwardRef, useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CalendarRange, Flag } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { getCycleEndFromStart, fmtCycleDate } from '@/lib/cycle';
import { keypadDigit, keypadBackspace } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useAppBottomSheet } from '@/components/bottomSheetConfig';
import { CycleDayPicker, CycleDayTrigger } from '@/components/CycleDayPicker';
import { NumericKeypad } from '@/components/NumericKeypad';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MotionPressable } from '@/components/MotionPressable';

export const BudgetEditSheet = forwardRef<BottomSheet>((_, ref) => {
  const { palette, isDark } = useTheme();
  const { backdropComponent, backgroundStyle, handleIndicatorStyle, animationConfigs } = useAppBottomSheet();
  const partnership = useBudgetStore((s) => s.partnership);
  const updatePartnership = useBudgetStore((s) => s.updatePartnership);
  const closeCycle = useBudgetStore((s) => s.closeCycle);
  const session = useAuthStore((s) => s.session);

  const [budgetRupees, setBudgetRupees] = useState(0);
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [endCycleOpen, setEndCycleOpen] = useState(false);
  const [endingCycle, setEndingCycle] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCreator = partnership?.creator_id === session?.user?.id;
  const cycleStartAt = partnership?.current_cycle_start_at ?? new Date().toISOString();
  const cycleEnd = getCycleEndFromStart(cycleStartAt, cycleStartDay);
  const currencySymbol = partnership?.currency_code === 'INR' ? '₹' : '$';

  const syncFromPartnership = useCallback(() => {
    if (!partnership) return;
    setBudgetRupees(Math.floor(partnership.monthly_budget_cents / 100));
    setCycleStartDay(partnership.cycle_start_day);
  }, [partnership]);

  async function saveChanges() {
    if (!partnership || !isCreator || budgetRupees === 0 || saving) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('partnerships')
      .update({
        monthly_budget_cents: budgetRupees * 100,
        cycle_start_day: cycleStartDay,
      })
      .eq('id', partnership.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) updatePartnership(data);
    if (ref && 'current' in ref && ref.current) ref.current.close();
  }

  async function confirmEndCycle() {
    setEndingCycle(true);
    const { error } = await closeCycle();
    setEndingCycle(false);
    setEndCycleOpen(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    if (ref && 'current' in ref && ref.current) ref.current.close();
  }

  return (
    <>
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['88%']}
        enablePanDownToClose
        backdropComponent={backdropComponent}
        animationConfigs={animationConfigs}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        onChange={(index) => {
          if (index >= 0) syncFromPartnership();
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View className="px-6 pt-1 pb-2">
            <Text
              className="font-manrope-extrabold mb-1 text-center"
              style={{ fontSize: 24, color: palette.onSurface, letterSpacing: -0.5 }}
            >
              Edit budget
            </Text>
            <Text className="font-manrope-medium text-xs text-center mb-5" style={{ color: palette.onSurfaceVariant }}>
              Monthly limit & cycle dates
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
              <Text
                className="font-manrope-semibold text-xs uppercase tracking-widest mb-2"
                style={{ color: palette.onSurfaceVariant }}
              >
                Monthly budget
              </Text>
              <Text
                className="font-manrope-extrabold"
                style={{
                  fontSize: 52,
                  color: budgetRupees === 0 ? palette.onSurfaceVariant : palette.onSurface,
                  letterSpacing: -1,
                }}
              >
                {`${currencySymbol}${budgetRupees.toLocaleString('en-IN')}`}
              </Text>
            </View>

            <View
              className="p-5 mb-3"
              style={{
                backgroundColor: palette.surface,
                borderRadius: RADIUS.xxl,
                borderWidth: 1,
                borderColor: palette.border,
                ...softShadow('sm', isDark),
              }}
            >
              <View className="flex-row items-center gap-3 mb-4">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: palette.peach + '66' }}
                >
                  <CalendarRange size={22} color={palette.onSurface} />
                </View>
                <View className="flex-1">
                  <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
                    Cycle reset day
                  </Text>
                  <Text className="font-manrope-medium text-xs leading-5" style={{ color: palette.onSurfaceVariant }}>
                    Your budget renews on this day each month
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-center gap-2 mb-4 py-2">
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  Resets on day
                </Text>
                <CycleDayTrigger day={cycleStartDay} onPress={() => setShowDayPicker(true)} />
                <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                  of each month
                </Text>
              </View>

              <View
                className="px-4 py-3 items-center"
                style={{ backgroundColor: palette.sage + '33', borderRadius: RADIUS.lg }}
              >
                <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-1" style={{ color: palette.onSurfaceVariant }}>
                  Current cycle ends
                </Text>
                <Text className="font-manrope-extrabold text-base" style={{ color: palette.onSurface }}>
                  {fmtCycleDate(cycleEnd)}
                </Text>
              </View>

              {isCreator ? (
                <MotionPressable
                  onPress={() => setEndCycleOpen(true)}
                  className="flex-row items-center justify-center gap-2 mt-4 py-3.5"
                  style={{
                    backgroundColor: palette.cream,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                >
                  <Flag size={16} color={palette.budgetOver} />
                  <Text className="font-manrope-bold text-sm" style={{ color: palette.budgetOver }}>
                    End current cycle early
                  </Text>
                </MotionPressable>
              ) : null}
            </View>

            {!isCreator ? (
              <Text className="font-manrope-medium text-xs text-center mb-2" style={{ color: palette.onSurfaceVariant }}>
                Only the budget creator can change these settings.
              </Text>
            ) : null}
          </View>

          {isCreator ? (
            <NumericKeypad
              hideDecimal
              onDigit={(d) => setBudgetRupees((r) => keypadDigit(r, d))}
              onBackspace={() => setBudgetRupees((r) => keypadBackspace(r))}
              onConfirm={saveChanges}
              confirmDisabled={budgetRupees === 0 || saving}
            />
          ) : null}
        </BottomSheetView>
      </BottomSheet>

      <CycleDayPicker
        visible={showDayPicker}
        value={cycleStartDay}
        onChange={setCycleStartDay}
        onClose={() => setShowDayPicker(false)}
      />

      <ConfirmModal
        visible={endCycleOpen}
        title="End this cycle?"
        message="You'll see a summary of what you spent together. The app stays paused until you start a new cycle."
        confirmLabel="End cycle"
        cancelLabel="Keep going"
        destructive
        icon={Flag}
        loading={endingCycle}
        onConfirm={confirmEndCycle}
        onCancel={() => setEndCycleOpen(false)}
      />
    </>
  );
});

BudgetEditSheet.displayName = 'BudgetEditSheet';
