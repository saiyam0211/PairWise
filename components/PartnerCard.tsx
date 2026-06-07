import { View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { formatCents } from '@/lib/money';
import { RADIUS, softShadow } from '@/lib/brand';
import { enterFadeDown } from '@/lib/motion';
import { InviteShare } from '@/components/InviteShare';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import type { Database } from '@/lib/supabase';

type Partnership = Database['public']['Tables']['partnerships']['Row'];

function initial(name?: string | null) {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}

function AvatarBubble({
  label,
  color,
  textColor,
  borderColor,
  offset = 0,
}: {
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
  offset?: number;
}) {
  return (
    <View
      style={{
        marginLeft: offset,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor,
      }}
    >
      <Text className="font-manrope-extrabold text-base" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

interface PartnerCardProps {
  partnership: Partnership;
}

export function PartnerCard({ partnership }: PartnerCardProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const { session } = useAuthStore();
  const joined = useBudgetStore((s) => s.partnerJoined());
  const partner = useBudgetStore((s) => s.partnerProfile());
  const myProfile = useBudgetStore((s) => s.myProfile());
  const memberSpentCents = useBudgetStore((s) => s.memberSpentCents);

  const isCreator = partnership.creator_id === session?.user?.id;
  const partnerLabel = partnership.partner_name ?? 'Partner';
  const myName = myProfile?.display_name ?? 'You';
  const partnerDisplayName = partner?.display_name ?? partnerLabel;
  const currency = partnership.currency_code;

  const partnerSpent = partner ? memberSpentCents(partner.id) : 0;
  const mySpent = session?.user ? memberSpentCents(session.user.id) : 0;

  const cardBg = isDark ? palette.primaryContainer : palette.cream;
  const textMain = isDark ? palette.onPrimaryContainer : palette.onSurface;
  const statBg = isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.55)';

  if (joined) {
    return (
      <Animated.View
        entering={enterFadeDown(reduced, 40)}
        className="p-5 mb-5 overflow-hidden"
        style={{
          backgroundColor: cardBg,
          borderRadius: RADIUS.xxl,
          borderWidth: isDark ? 0 : 1,
          borderColor: palette.border,
          ...softShadow('md', isDark),
        }}
      >
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center flex-1">
            <AvatarBubble
              label={initial(myName)}
              color={palette.sage}
              textColor={palette.onSurface}
              borderColor={cardBg}
            />
            <AvatarBubble
              label={initial(partnerDisplayName)}
              color={palette.peach}
              textColor={palette.onSurface}
              borderColor={cardBg}
              offset={-12}
            />
          </View>
          <View
            className="flex-row items-center gap-1 px-3 py-1.5"
            style={{
              borderRadius: RADIUS.pill,
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${palette.sage}55`,
            }}
          >
            <Check size={14} color={textMain} />
            <Text className="font-manrope-bold text-xs" style={{ color: textMain }}>
              Joined
            </Text>
          </View>
        </View>

        <Text
          className="font-manrope-semibold text-xs uppercase tracking-widest mb-1"
          style={{ color: textMain, opacity: 0.7 }}
        >
          Tracking together
        </Text>
        <Text className="font-manrope-extrabold text-xl mb-4" style={{ color: textMain }}>
          {partnerDisplayName}
        </Text>

        <View className="flex-row gap-2">
          <View className="flex-1 px-3 py-3" style={{ backgroundColor: statBg, borderRadius: RADIUS.lg }}>
            <Text className="font-manrope-semibold text-xs mb-1" style={{ color: textMain, opacity: 0.65 }}>
              {partnerDisplayName} spent
            </Text>
            <Text className="font-manrope-extrabold text-lg" style={{ color: palette.peach }}>
              {formatCents(partnerSpent, currency)}
            </Text>
            <Text className="font-manrope-medium text-xs mt-0.5" style={{ color: textMain, opacity: 0.55 }}>
              This cycle
            </Text>
          </View>
          <View className="flex-1 px-3 py-3" style={{ backgroundColor: statBg, borderRadius: RADIUS.lg }}>
            <Text className="font-manrope-semibold text-xs mb-1" style={{ color: textMain, opacity: 0.65 }}>
              You spent
            </Text>
            <Text className="font-manrope-extrabold text-lg" style={{ color: palette.sage }}>
              {formatCents(mySpent, currency)}
            </Text>
            <Text className="font-manrope-medium text-xs mt-0.5" style={{ color: textMain, opacity: 0.55 }}>
              This cycle
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={enterFadeDown(reduced, 40)}
      className="p-5 mb-5"
      style={{
        backgroundColor: palette.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: palette.border,
        ...softShadow('sm', isDark),
      }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: palette.peach }}
        >
          <Text className="font-manrope-extrabold text-base" style={{ color: palette.onSurface }}>
            {initial(partnerLabel)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
            {partnerLabel}
          </Text>
          <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
            Waiting for partner to join…
          </Text>
        </View>
      </View>

      {isCreator && partnership.invite_token && (
        <View className="mt-2">
          <Text className="font-manrope-semibold text-sm mb-3" style={{ color: palette.onSurfaceVariant }}>
            Invite again
          </Text>
          <InviteShare inviteCode={partnership.invite_token} partnerName={partnerLabel} compact />
        </View>
      )}
    </Animated.View>
  );
}
