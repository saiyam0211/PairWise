import { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useTheme } from '@/lib/theme';
import { filterTransactionsInActiveCycle } from '@/lib/cycle';
import { useBudgetStore } from '@/stores/budgetStore';
import { BudgetTimelineCard } from '@/components/BudgetTimelineCard';
import { DaySection } from '@/components/DaySection';
import { useAppBottomSheet } from '@/components/bottomSheetConfig';
import type { Database } from '@/lib/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type DayGroup = { date: string; transactions: Transaction[] };

export const HistorySheet = forwardRef<BottomSheet>((_, ref) => {
  const { palette } = useTheme();
  const { backdropComponent, backgroundStyle, handleIndicatorStyle, animationConfigs } = useAppBottomSheet();
  const transactions = useBudgetStore((s) => s.transactions);
  const partnership = useBudgetStore((s) => s.partnership);
  const previousCycleEndAt = useBudgetStore((s) => s.cycleSnapshots[0]?.cycle_end_at ?? null);
  const refreshPartnership = useBudgetStore((s) => s.refreshPartnership);

  const cycleKey = partnership?.cycle_active
    ? `${partnership.current_cycle_start_at}-${partnership.monthly_budget_cents}-${partnership.cycle_start_day}`
    : 'closed';

  const cycleTransactions = useMemo(
    () => filterTransactionsInActiveCycle(transactions, partnership, previousCycleEndAt),
    [transactions, partnership, previousCycleEndAt, cycleKey],
  );

  const grouped = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup['transactions']>();
    for (const tx of cycleTransactions) {
      const dateKey = new Date(tx.occurred_at).toISOString().slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(tx);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([date, txs]) => ({ date, transactions: txs }));
  }, [cycleTransactions]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['80%']}
      enablePanDownToClose
      backdropComponent={backdropComponent}
      animationConfigs={animationConfigs}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onChange={(index) => {
        if (index >= 0) refreshPartnership();
      }}
    >
      <BottomSheetFlatList
        key={cycleKey}
        data={grouped}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            <Text
              className="font-manrope-extrabold mb-1 text-center"
              style={{ fontSize: 24, color: palette.onSurface, letterSpacing: -0.5 }}
            >
              This cycle
            </Text>
            <Text className="font-manrope-medium text-xs text-center mb-6" style={{ color: palette.onSurfaceVariant }}>
              Current month spending
            </Text>
            <BudgetTimelineCard key={cycleKey} />
          </>
        }
        renderItem={({ item }) => (
          <DaySection
            date={item.date}
            transactions={item.transactions}
            currencyCode={partnership?.currency_code ?? 'INR'}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="font-manrope-medium text-base" style={{ color: palette.onSurfaceVariant }}>
              No expenses this cycle yet — start tracking!
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
});

HistorySheet.displayName = 'HistorySheet';
