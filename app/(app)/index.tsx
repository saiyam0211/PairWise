import { useState, useCallback, useRef, useEffect } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { toast } from '@/lib/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import type BottomSheet from '@gorhom/bottom-sheet';

import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { supabase } from '@/lib/supabase';
import { getAnchoredCycleWindow, getCycleWindow } from '@/lib/cycle';
import { toPastSpendDate } from '@/lib/dates';
import { keypadDigit, keypadBackspace, formatCents } from '@/lib/money';

import { AppLoadingScreen } from '@/components/AppLoadingScreen';

import { BudgetPill } from '@/components/BudgetPill';
import { AmountDisplay } from '@/components/AmountDisplay';
import { NumericKeypad } from '@/components/NumericKeypad';
import { DescriptionInput } from '@/components/DescriptionInput';
import { QuantityPrompt } from '@/components/QuantityPrompt';
import { QuantityInput, SpendUnit } from '@/components/QuantityInput';
import { SpendWhenPrompt } from '@/components/SpendWhenPrompt';
import { SpendDatePicker } from '@/components/SpendDatePicker';
import { SpendSuccessOverlay } from '@/components/SpendSuccessOverlay';
import { SettingsSheet } from '@/components/SettingsSheet';
import { HistorySheet } from '@/components/HistorySheet';
import { BudgetEditSheet } from '@/components/BudgetEditSheet';
import { maybeSyncTransaction } from '@/lib/sheetsSync';
import { CycleClosedScreen } from '@/components/CycleClosedScreen';

type Stage = 'amount' | 'description' | 'qtyPrompt' | 'quantity' | 'when' | 'success';

export default function SpendScreen() {
  const { palette } = useTheme();
  const { session, profile } = useAuthStore();
  const partnership = useBudgetStore((s) => s.partnership);
  const refreshPartnership = useBudgetStore((s) => s.refreshPartnership);
  const prevCycleKeyRef = useRef<string | null>(null);

  const cycleKey = partnership?.cycle_active
    ? `${partnership.current_cycle_start_at}-${partnership.monthly_budget_cents}-${partnership.cycle_start_day}`
    : 'closed';

  const [amountRupees, setAmountRupees] = useState(0);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<SpendUnit>('piece');
  const [includeQuantity, setIncludeQuantity] = useState(false);
  const [stage, setStage] = useState<Stage>('amount');
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pastDate, setPastDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });
  const [successRemaining, setSuccessRemaining] = useState(0);
  const [successSpentToday, setSuccessSpentToday] = useState(0);

  const settingsRef = useRef<BottomSheet>(null);
  const historyRef = useRef<BottomSheet>(null);
  const budgetEditRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (!partnership?.id || !partnership.cycle_active) return;

    if (prevCycleKeyRef.current === null) {
      prevCycleKeyRef.current = cycleKey;
      return;
    }

    if (prevCycleKeyRef.current === cycleKey) return;
    prevCycleKeyRef.current = cycleKey;

    refreshPartnership().then(() => {
      setAmountRupees(0);
      setDescription('');
      setQuantity('1');
      setUnit('piece');
      setIncludeQuantity(false);
      setStage('amount');
      setSaving(false);
      setDatePickerOpen(false);
    });
  }, [cycleKey, partnership?.id, partnership?.cycle_active, refreshPartnership]);

  function openHistory() {
    settingsRef.current?.close();
    budgetEditRef.current?.close();
    historyRef.current?.expand();
  }

  function openSettings() {
    historyRef.current?.close();
    budgetEditRef.current?.close();
    settingsRef.current?.expand();
  }

  function openBudgetEdit() {
    historyRef.current?.close();
    settingsRef.current?.close();
    budgetEditRef.current?.expand();
  }

  function toDescriptionStage() {
    if (amountRupees === 0) return;
    setStage('description');
  }

  function toQtyPromptStage() {
    setStage('qtyPrompt');
  }

  function toQuantityStage() {
    setQuantity('1');
    setUnit('piece');
    setStage('quantity');
  }

  function toAmountStage() {
    setStage('amount');
  }

  function finishQuantity(withQuantity: boolean) {
    setIncludeQuantity(withQuantity);
    setStage('when');
  }

  function whenBack() {
    setStage(includeQuantity ? 'quantity' : 'qtyPrompt');
  }

  const submit = useCallback(
    async (occurredAt: Date, withQuantity: boolean) => {
      if (!session?.user || !partnership || amountRupees === 0) return;
      setSaving(true);

      const qty = withQuantity ? parseFloat(quantity) || 1 : null;
      const unitValue = withQuantity ? unit : null;
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          partnership_id: partnership.id,
          user_id: session.user.id,
          amount_cents: amountRupees * 100,
          description: description.trim() || null,
          category: null,
          quantity: qty,
          unit: unitValue,
          occurred_at: occurredAt.toISOString(),
        })
        .select()
        .single();

      setSaving(false);
      setDatePickerOpen(false);
      if (error) {
        toast.error('Error', error.message);
        return;
      }

      if (data) {
        useBudgetStore.getState().addTransaction(data);
        if (partnership.google_sheets_enabled) {
          maybeSyncTransaction(data);
        }
      }

      const state = useBudgetStore.getState();
      setSuccessRemaining(state.remainingCents());
      setSuccessSpentToday(state.spentTodayCents());
      setStage('success');
    },
    [amountRupees, description, quantity, unit, session, partnership],
  );

  function saveForToday() {
    submit(new Date(), includeQuantity);
  }

  function saveForPastDate(date: Date) {
    submit(toPastSpendDate(date), includeQuantity);
  }

  function dismissSuccess() {
    setAmountRupees(0);
    setDescription('');
    setQuantity('1');
    setUnit('piece');
    setIncludeQuantity(false);
    setStage('amount');
  }

  const currency = partnership?.currency_code ?? 'INR';
  const currencySymbol =
    new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '₹';

  const cycleStart = partnership
    ? partnership.current_cycle_start_at
      ? getAnchoredCycleWindow(partnership.current_cycle_start_at, partnership.cycle_start_day).start
      : getCycleWindow(partnership.cycle_start_day).start
    : undefined;
  const amountDisplay = formatCents(amountRupees * 100, currency);

  if (!profile?.partnership_id || !partnership || partnership.id !== profile.partnership_id) {
    return <AppLoadingScreen />;
  }

  if (!partnership.cycle_active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
        <CycleClosedScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top']}>
      <BudgetPill onHistoryPress={openHistory} onSettingsPress={openSettings} onEditPress={openBudgetEdit} />

      {stage === 'amount' && (
        <>
          <AmountDisplay whole={amountRupees} currencySymbol={currencySymbol} />
          <NumericKeypad
            hideDecimal
            onDigit={(d) => setAmountRupees((r) => keypadDigit(r, d))}
            onBackspace={() => setAmountRupees((r) => keypadBackspace(r))}
            onConfirm={toDescriptionStage}
            confirmDisabled={amountRupees === 0 || saving}
          />
        </>
      )}

      {stage === 'description' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <DescriptionInput
            value={description}
            onChange={setDescription}
            onSubmit={toQtyPromptStage}
            onBack={toAmountStage}
            amountDisplay={amountDisplay}
          />
        </KeyboardAvoidingView>
      )}

      {stage === 'qtyPrompt' && (
        <QuantityPrompt
          amountDisplay={amountDisplay}
          description={description}
          onAddQuantity={toQuantityStage}
          onSkip={() => finishQuantity(false)}
          onBack={() => setStage('description')}
        />
      )}

      {stage === 'quantity' && (
        <QuantityInput
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
          onSubmit={() => finishQuantity(true)}
          onBack={() => setStage('qtyPrompt')}
          amountDisplay={amountDisplay}
          description={description}
        />
      )}

      {stage === 'when' && (
        <>
          <SpendWhenPrompt
            amountDisplay={amountDisplay}
            description={description}
            onToday={saveForToday}
            onPastSpend={() => setDatePickerOpen(true)}
            onBack={whenBack}
            saving={saving}
          />
          <SpendDatePicker
            visible={datePickerOpen}
            value={pastDate}
            minDate={cycleStart}
            maxDate={new Date()}
            onSelect={(date) => {
              setPastDate(date);
              saveForPastDate(date);
            }}
            onClose={() => setDatePickerOpen(false)}
          />
        </>
      )}

      <SpendSuccessOverlay
        visible={stage === 'success'}
        remainingCents={successRemaining}
        spentTodayCents={successSpentToday}
        currency={currency}
        onDismiss={dismissSuccess}
      />

      <SettingsSheet ref={settingsRef} />
      <HistorySheet ref={historyRef} />
      <BudgetEditSheet ref={budgetEditRef} />
    </SafeAreaView>
  );
}
