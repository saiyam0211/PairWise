import Constants, { ExecutionEnvironment } from 'expo-constants';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
];

/** Google OAuth only works in dev/production builds — not Expo Go. */
export function isGoogleAuthSupported(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.Bare ||
    Constants.executionEnvironment === ExecutionEnvironment.Standalone
  );
}

export function googleAuthUnsupportedMessage(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return 'Google Sign-In does not work in Expo Go on Android. Create a development build with: npx expo run:android';
  }
  return 'Google Sign-In is not available in this environment.';
}

export const GOOGLE_OAUTH_EXTRA_PARAMS = {
  access_type: 'offline' as const,
  prompt: 'consent' as const,
};

export function validateGoogleOAuthEnv(): string | null {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

  if (!web) return 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env';
  if (!android) return 'Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env (create an Android OAuth client, not Web).';
  if (web === android) {
    return 'Web and Android client IDs must be different. Create a separate Android OAuth client in Google Cloud Console.';
  }
  if (ios && web === ios) {
    return 'Web and iOS client IDs must be different. Create separate OAuth clients for each platform.';
  }
  return null;
}
