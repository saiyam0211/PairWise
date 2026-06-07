const appJson = require('./app.json');

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

function isValidClientId(value) {
  return value.includes('.apps.googleusercontent.com') && !/your[-_]?/i.test(value);
}

function googleReverseScheme(clientId) {
  if (!isValidClientId(clientId)) return null;
  return `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;
}

const iosGoogleScheme = googleReverseScheme(iosClientId);
const androidGoogleScheme = googleReverseScheme(androidClientId);

const urlSchemes = ['pairwise', ...(iosGoogleScheme ? [iosGoogleScheme] : [])];

function oauthIntentFilter(scheme) {
  return {
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [{ scheme, pathPrefix: '/oauthredirect' }],
  };
}

const androidIntentFilters = [
  oauthIntentFilter('com.PairWise.app'),
  ...(androidGoogleScheme ? [oauthIntentFilter(androidGoogleScheme)] : []),
];

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  runtimeVersion: '1.0.0',
  updates: {
    url: 'https://u.expo.dev/b8c1e7df-751e-4d57-96af-b25fa62835af',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    ...appJson.expo.extra,
    eas: {
      ...appJson.expo.extra?.eas,
      projectId: 'b8c1e7df-751e-4d57-96af-b25fa62835af',
    },
  },
  android: {
    ...appJson.expo.android,
    intentFilters: androidIntentFilters,
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
