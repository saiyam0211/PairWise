import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { formatCents } from '@/lib/money';
import { isToday } from '@/lib/dates';
import { RADIUS, softShadow } from '@/lib/brand';

interface TransactionRowProps {
  description: string | null;
  amountCents: number;
  time: string;
  currencyCode?: string;
  spenderName: string;
  isSelf?: boolean;
}

export function TransactionRow({
  description,
  amountCents,
  time,
  currencyCode = 'USD',
  spenderName,
  isSelf = false,
}: TransactionRowProps) {
  const { palette, isDark } = useTheme();

  const showTime = isToday(time);
  const timeStr = new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const accent = isSelf ? palette.sage : palette.peach;

  return (
    <View
      className="flex-row items-center mx-1 mb-2 px-4 py-3.5 gap-3"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('sm', isDark),
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: `${accent}66` }}
      >
        <Text className="font-manrope-extrabold text-sm" style={{ color: palette.onSurface }}>
          {spenderName.trim()[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-manrope-extrabold" style={{ fontSize: 20, color: palette.onSurface }}>
            {formatCents(amountCents, currencyCode)}
          </Text>
          <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
            {showTime ? timeStr : ''}
          </Text>
        </View>
        {description ? (
          <Text className="font-manrope-medium text-sm mt-0.5" style={{ color: palette.onSurfaceVariant }} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        <View
          className="self-start px-2.5 py-0.5 mt-1.5"
          style={{ backgroundColor: `${accent}44`, borderRadius: RADIUS.pill }}
        >
          <Text className="font-manrope-semibold text-xs" style={{ color: palette.onSurface }}>
            {spenderName}
          </Text>
        </View>
      </View>
    </View>
  );
}
