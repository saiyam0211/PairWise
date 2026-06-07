import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Switch } from 'react-native';
import { appAlert, toast } from '@/lib/feedback';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleSheetIcon } from '@/components/icons/GoogleSheetIcon';
import { useTheme } from '@/lib/theme';
import { RADIUS, softShadow } from '@/lib/brand';
import { MotionPressable } from '@/components/MotionPressable';
import { GoogleSheetsPicker } from '@/components/GoogleSheetsPicker';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { ensureCycleSheetTab } from '@/lib/sheetsSync';
import {
  GOOGLE_OAUTH_EXTRA_PARAMS,
  GOOGLE_SHEETS_SCOPES,
  googleAuthUnsupportedMessage,
  isGoogleAuthSupported,
  validateGoogleOAuthEnv,
} from '@/lib/googleAuthConfig';
import {
  disconnectGoogleSheets,
  fetchGoogleSheetsStatus,
  listGoogleSpreadsheets,
  saveGoogleOAuthToken,
  setGoogleSheetsEnabled,
  type GoogleSheetsStatus,
  type GoogleSpreadsheetFile,
} from '@/lib/googleSheets';

WebBrowser.maybeCompleteAuthSession();

export function GoogleSheetsCard() {
  const { palette, isDark } = useTheme();
  const session = useAuthStore((s) => s.session);
  const partnership = useBudgetStore((s) => s.partnership);
  const loadPartnership = useBudgetStore((s) => s.loadPartnership);

  const isCreator = partnership?.creator_id === session?.user?.id;
  const googleAuthSupported = isGoogleAuthSupported();

  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSaving, setPickerSaving] = useState(false);
  const [files, setFiles] = useState<GoogleSpreadsheetFile[]>([]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: GOOGLE_SHEETS_SCOPES,
    extraParams: GOOGLE_OAUTH_EXTRA_PARAMS,
  });

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchGoogleSheetsStatus());
    } catch (error) {
      console.warn('[google-sheets]', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, partnership?.id]);

  useEffect(() => {
    if (__DEV__ && request?.redirectUri) {
      console.log('[google-oauth] redirectUri:', request.redirectUri);
    }
  }, [request?.redirectUri]);

  const openPicker = useCallback(async () => {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      setFiles(await listGoogleSpreadsheets());
    } catch (error) {
      toast.error('Could not load spreadsheets', error instanceof Error ? error.message : 'Try again.');
      setPickerOpen(false);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const finishConnected = useCallback(async () => {
    setPickerOpen(false);
    if (partnership?.id) await loadPartnership(partnership.id);
    await refreshStatus();
    ensureCycleSheetTab();
    toast.success('Connected', 'New spends will sync to your spreadsheet automatically.');
  }, [partnership?.id, loadPartnership, refreshStatus]);

  const handleOAuthSuccess = useCallback(
    async (refreshToken: string) => {
      setConnecting(true);
      try {
        await saveGoogleOAuthToken(refreshToken);
        await openPicker();
      } catch (error) {
        toast.error('Could not connect', error instanceof Error ? error.message : 'Try again.');
      } finally {
        setConnecting(false);
      }
    },
    [openPicker],
  );

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        setConnecting(false);
        const detail = response.error?.message ?? response.params?.error_description ?? response.params?.error;
        void appAlert.show(
          'Google sign-in failed',
          detail
            ? `${detail}\n\nIf this is an EAS build, add the EAS keystore SHA-1 to your Android OAuth client (run: eas credentials -p android).`
            : 'Please try again.',
        );
      }
      return;
    }

    const refreshToken = response.authentication?.refreshToken;
    if (refreshToken) {
      void handleOAuthSuccess(refreshToken);
      return;
    }

    void appAlert.show(
      'Google sign-in incomplete',
      'No refresh token was returned. Revoke PairWise in your Google account settings and try again with consent.',
    );
    setConnecting(false);
  }, [response, handleOAuthSuccess]);

  async function handleConnectPress() {
    if (!googleAuthSupported) {
      void appAlert.show('Development build required', googleAuthUnsupportedMessage());
      return;
    }

    const envError = validateGoogleOAuthEnv();
    if (envError) {
      void appAlert.show('Google OAuth setup', envError);
      return;
    }

    if (!request) {
      toast.info('Please wait', 'Google sign-in is still loading. Try again in a moment.');
      return;
    }

    setConnecting(true);
    const result = await promptAsync();
    if (result.type !== 'success') {
      setConnecting(false);
    }
  }

  async function handleChangeSpreadsheet() {
    try {
      await openPicker();
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'Try again.');
    }
  }

  async function handleToggleEnabled(value: boolean) {
    try {
      await setGoogleSheetsEnabled(value);
      await refreshStatus();
      if (partnership?.id) await loadPartnership(partnership.id);
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'Could not update setting.');
    }
  }

  async function handleDisconnect() {
    const confirmed = await appAlert.confirm(
      'Disconnect Google Sheets?',
      'Automatic syncing will stop for both partners.',
      { confirmLabel: 'Disconnect', destructive: true },
    );
    if (!confirmed) return;

    try {
      await disconnectGoogleSheets();
      setPickerOpen(false);
      if (partnership?.id) await loadPartnership(partnership.id);
      await refreshStatus();
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'Could not disconnect.');
    }
  }

  if (!partnership) return null;

  return (
    <>
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
        <View className="flex-row items-center gap-2 mb-1">
          <GoogleSheetIcon size={18} color={palette.primary} />
          <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }}>
            Google Sheets
          </Text>
        </View>
        <Text className="font-manrope-medium text-xs mb-4" style={{ color: palette.onSurfaceVariant }}>
          {isCreator
            ? 'Sign in with Google, pick a spreadsheet, and every spend syncs automatically. Each cycle gets its own tab.'
            : 'Your partner can connect a spreadsheet. Spends sync automatically when enabled.'}
        </Text>

        {!googleAuthSupported && isCreator ? (
          <View
            className="px-4 py-3 mb-3"
            style={{ backgroundColor: palette.cream, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: palette.border }}
          >
            <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
              {googleAuthUnsupportedMessage()}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : status?.connected ? (
          <View className="gap-3">
            <View
              className="px-4 py-3"
              style={{ backgroundColor: palette.cream, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: palette.border }}
            >
              <Text className="font-manrope-semibold text-xs uppercase tracking-widest mb-1" style={{ color: palette.onSurfaceVariant }}>
                Spreadsheet
              </Text>
              <Text className="font-manrope-bold text-base" style={{ color: palette.onSurface }} numberOfLines={2}>
                {status.spreadsheet_name ?? 'Connected spreadsheet'}
              </Text>
              {status.cycle_tab ? (
                <Text className="font-manrope-medium text-xs mt-2" style={{ color: palette.onSurfaceVariant }}>
                  Current tab: {status.cycle_tab}
                </Text>
              ) : null}
            </View>

            {isCreator ? (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="font-manrope-semibold text-sm" style={{ color: palette.onSurface }}>
                    Auto-sync spends
                  </Text>
                  <Switch
                    value={status.enabled}
                    onValueChange={handleToggleEnabled}
                    trackColor={{ false: palette.border, true: palette.sage }}
                    thumbColor={palette.surface}
                  />
                </View>

                <MotionPressable
                  onPress={handleChangeSpreadsheet}
                  className="py-3 items-center"
                  style={{
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.cream,
                  }}
                >
                  <Text className="font-manrope-semibold text-sm" style={{ color: palette.onSurface }}>
                    Change spreadsheet
                  </Text>
                </MotionPressable>

                <MotionPressable
                  onPress={handleDisconnect}
                  className="py-3 items-center"
                  style={{
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.cream,
                  }}
                >
                  <Text className="font-manrope-semibold text-sm" style={{ color: palette.budgetOver }}>
                    Disconnect
                  </Text>
                </MotionPressable>
              </>
            ) : (
              <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                {status.enabled ? 'Sync is on — your spends appear in the sheet too.' : 'Sync is paused by the budget creator.'}
              </Text>
            )}
          </View>
        ) : isCreator ? (
          status?.oauthReady ? (
            <View className="gap-3">
              <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
                Google account connected — choose where to save your spends.
              </Text>
              <MotionPressable
                onPress={() => void openPicker()}
                className="py-3.5 items-center"
                style={{ backgroundColor: palette.accent, borderRadius: RADIUS.pill, ...softShadow('sm', isDark) }}
              >
                <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
                  Choose spreadsheet
                </Text>
              </MotionPressable>
              <MotionPressable onPress={handleDisconnect} className="py-2 items-center">
                <Text className="font-manrope-semibold text-sm" style={{ color: palette.dateHeader }}>
                  Cancel setup
                </Text>
              </MotionPressable>
            </View>
          ) : (
            <MotionPressable
              onPress={handleConnectPress}
              disabled={!request || connecting || !googleAuthSupported}
              className="py-3.5 items-center flex-row justify-center gap-2"
              style={{
                backgroundColor: palette.accent,
                borderRadius: RADIUS.pill,
                opacity: !request || connecting || !googleAuthSupported ? 0.7 : 1,
                ...softShadow('sm', isDark),
              }}
            >
              {connecting ? <ActivityIndicator color={palette.onAccent} /> : null}
              <Text className="font-manrope-bold text-base" style={{ color: palette.onAccent }}>
                Sign in with Google
              </Text>
            </MotionPressable>
          )
        ) : (
          <Text className="font-manrope-medium text-sm" style={{ color: palette.onSurfaceVariant }}>
            Not connected yet. Ask your partner to link a spreadsheet in Settings.
          </Text>
        )}
      </View>

      <GoogleSheetsPicker
        visible={pickerOpen}
        files={files}
        loading={pickerLoading}
        saving={pickerSaving}
        onClose={() => setPickerOpen(false)}
        onConnected={() => void finishConnected()}
        onSavingChange={setPickerSaving}
      />
    </>
  );
}
