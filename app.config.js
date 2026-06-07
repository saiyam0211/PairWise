const appJson = require('./app.json');

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const hasIosClient =
  iosClientId.includes('.apps.googleusercontent.com') && !/your[-_]?/i.test(iosClientId);

const googleScheme = hasIosClient
  ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
  : null;

const urlSchemes = ['pairwise', ...(googleScheme ? [googleScheme] : [])];

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    eas: {
      ...appJson.expo.extra?.eas,
      projectId: 'b8c1e7df-751e-4d57-96af-b25fa62835af',
    },
  },
  ios: {
    ...appJson.expo.ios,
    infoPlist: {
      ...(appJson.expo.ios?.infoPlist ?? {}),
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: urlSchemes,
        },
      ],
    },
  },
};
