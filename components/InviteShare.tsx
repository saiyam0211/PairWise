import { View, Text, Linking, Share, Platform } from 'react-native';
import { toast } from '@/lib/feedback';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Copy, MessageCircle, MessagesSquare, Share2 } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { buildInviteMessage, smsUrl, whatsAppUrl } from '@/lib/invite';
import { enterFadeDown, enterStagger } from '@/lib/motion';
import { MotionPressable } from '@/components/MotionPressable';

interface InviteShareProps {
  inviteCode: string;
  partnerName?: string;
  compact?: boolean;
}

async function openUrl(url: string, fallback: string) {
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  } else {
    toast.info('Unavailable', fallback);
  }
}

const CHIP_COLORS = ['sage', 'peach', 'sage', 'peach', 'sage'] as const;

export function InviteShare({ inviteCode, partnerName, compact = false }: InviteShareProps) {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const message = buildInviteMessage(inviteCode, partnerName);

  async function copyCode() {
    await Share.share({ message: `PairWise invite code: ${inviteCode}` });
  }

  async function copyLink() {
    await Share.share({ message });
  }

  async function shareWhatsApp() {
    await openUrl(whatsAppUrl(message), 'WhatsApp is not installed on this device.');
  }

  async function shareMessages() {
    if (Platform.OS === 'ios') {
      await openUrl(smsUrl(message), 'Messages is not available.');
    } else {
      await Share.share({ message });
    }
  }

  async function shareMore() {
    await Share.share({ message });
  }

  const options = [
    { id: 'copy', label: 'Copy code', icon: Copy, onPress: copyCode },
    { id: 'link', label: 'Copy link', icon: Share2, onPress: copyLink },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, onPress: shareWhatsApp },
    { id: 'messages', label: 'Messages', icon: MessagesSquare, onPress: shareMessages },
    { id: 'more', label: 'More', icon: Share2, onPress: shareMore },
  ];

  return (
    <View>
      {!compact && (
        <Animated.View
          entering={enterFadeDown(reduced)}
          className="px-8 py-6 mb-6 items-center"
          style={{
            backgroundColor: palette.cream,
            borderRadius: RADIUS.xxl,
            borderWidth: 1,
            borderColor: palette.border,
            ...softShadow('md', isDark),
          }}
        >
          <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-2" style={{ color: palette.onSurfaceVariant }}>
            Your invite code
          </Text>
          <Text
            className="font-manrope-extrabold"
            style={{ fontSize: 36, letterSpacing: 8, color: palette.onSurface }}
          >
            {inviteCode}
          </Text>
        </Animated.View>
      )}

      {compact && (
        <Text
          className="font-manrope-extrabold text-center mb-3"
          style={{ fontSize: 22, letterSpacing: 4, color: palette.onSurface }}
        >
          {inviteCode}
        </Text>
      )}

      <View className="flex-row flex-wrap gap-3 justify-center">
        {options.map((opt, i) => {
          const tone = CHIP_COLORS[i];
          const chipBg = tone === 'sage' ? palette.sage + '55' : palette.peach + '66';
          return (
            <Animated.View key={opt.id} entering={enterStagger(reduced, i + 1)}>
              <MotionPressable
                onPress={opt.onPress}
                className="items-center justify-center px-4 py-3"
                style={{
                  backgroundColor: chipBg,
                  borderRadius: RADIUS.lg,
                  minWidth: 88,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <opt.icon size={22} color={palette.primary} />
                <Text className="font-manrope-semibold text-xs mt-1.5" style={{ color: palette.onSurface }}>
                  {opt.label}
                </Text>
              </MotionPressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
