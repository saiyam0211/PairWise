import { forwardRef, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { LogOut } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { ThemeToggle } from './ThemeToggle';
import { PartnerCard } from './PartnerCard';
import { GoogleSheetsCard } from './GoogleSheetsCard';
import { ConfirmModal } from './ConfirmModal';
import { useAppBottomSheet } from './bottomSheetConfig';
import { MotionPressable } from './MotionPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

export const SettingsSheet = forwardRef<BottomSheet>((_, ref) => {
  const { palette, isDark } = useTheme();
  const { backdropComponent, backgroundStyle, handleIndicatorStyle, animationConfigs } = useAppBottomSheet();
  const { clear: clearAuth } = useAuthStore();
  const { partnership, partnerJoined, loadPartnership } = useBudgetStore();

  const joined = partnerJoined();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (partnership?.id) loadPartnership(partnership.id);
  }, [partnership?.id]);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAuth();
    useBudgetStore.getState().reset();
    useOnboardingStore.getState().reset();
    setSigningOut(false);
    setSignOutOpen(false);
  }

  return (
    <>
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={joined ? ['82%'] : ['88%']}
      enablePanDownToClose
      backdropComponent={backdropComponent}
      animationConfigs={animationConfigs}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
    >
      <BottomSheetView style={{ flex: 1, padding: 24 }}>
        <Text
          className="font-manrope-extrabold mb-1 text-center"
          style={{ fontSize: 24, color: palette.onSurface, letterSpacing: -0.5 }}
        >
          Settings
        </Text>
        <Text className="font-manrope-medium text-xs text-center mb-6" style={{ color: palette.onSurfaceVariant }}>
          Your pair & preferences
        </Text>

        {partnership && <PartnerCard partnership={partnership} />}

        <View
          className="mb-6 p-4"
          style={{
            backgroundColor: palette.surface,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: palette.border,
            ...softShadow('sm', isDark),
          }}
        >
          <Text className="font-manrope-bold text-base mb-1" style={{ color: palette.onSurface }}>
            Appearance
          </Text>
          <Text className="font-manrope-medium text-xs mb-4" style={{ color: palette.onSurfaceVariant }}>
            Choose how PairWise looks on your device
          </Text>
          <ThemeToggle />
        </View>

        <GoogleSheetsCard />

        <MotionPressable
          onPress={() => setSignOutOpen(true)}
          className="flex-row items-center gap-3 px-4 py-4"
          style={{
            backgroundColor: palette.surface,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <LogOut size={18} color={palette.budgetOver} />
          <Text className="font-manrope-semibold text-base" style={{ color: palette.budgetOver }}>
            Sign out
          </Text>
        </MotionPressable>

        <View className="mt-6 items-center">
          <Text className="font-manrope-medium text-xs" style={{ color: palette.onSurfaceVariant }}>
            PairWise — version 1.0.0
          </Text>
        </View>
      </BottomSheetView>
    </BottomSheet>

    <ConfirmModal
      visible={signOutOpen}
      title="Sign out?"
      message="You'll need to sign in again to keep tracking shared spending with your partner."
      confirmLabel="Sign out"
      cancelLabel="Stay signed in"
      destructive
      icon={LogOut}
      loading={signingOut}
      onConfirm={signOut}
      onCancel={() => setSignOutOpen(false)}
    />
    </>
  );
});

SettingsSheet.displayName = 'SettingsSheet';
