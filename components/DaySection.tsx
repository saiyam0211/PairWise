import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { TransactionRow } from './TransactionRow';
import { formatCents } from '@/lib/money';
import { RADIUS } from '@/lib/brand';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import type { Database } from '@/lib/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface DaySectionProps {
  date: string;
  transactions: Transaction[];
  currencyCode?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
}

export function DaySection({ date, transactions, currencyCode = 'USD' }: DaySectionProps) {
  const { palette } = useTheme();
  const sessionUserId = useAuthStore((s) => s.session?.user?.id);
  const spenderLabel = useBudgetStore((s) => s.spenderLabel);
  const dayTotal = transactions.reduce((sum, tx) => sum + tx.amount_cents, 0);

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between px-2 pb-2">
        <View
          className="px-3 py-1"
          style={{ backgroundColor: palette.primaryContainer, borderRadius: RADIUS.pill }}
        >
          <Text className="font-manrope-bold text-sm" style={{ color: palette.onPrimaryContainer }}>
            {formatDate(date)}
          </Text>
        </View>
        <Text className="font-manrope-semibold text-xs" style={{ color: palette.onSurfaceVariant }}>
          {formatCents(dayTotal, currencyCode)}
        </Text>
      </View>
      {transactions.map((tx) => (
        <TransactionRow
          key={tx.id}
          description={tx.description}
          amountCents={tx.amount_cents}
          time={tx.occurred_at}
          currencyCode={currencyCode}
          spenderName={spenderLabel(tx.user_id)}
          isSelf={tx.user_id === sessionUserId}
        />
      ))}
    </View>
  );
}
