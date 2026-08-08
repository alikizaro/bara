import * as Application from 'expo-application';
import { Platform } from 'react-native';

import type { AppUpdate } from './types';

const manifestUrl =
  'https://github.com/alikizaro/bara/releases/download/latest/update.json';
const releasePrefix =
  'https://github.com/alikizaro/bara/releases/download/latest/';

export async function checkForAppUpdate(): Promise<AppUpdate | null> {
  try {
    const response = await fetch(`${manifestUrl}?t=${Date.now()}`);
    if (!response.ok) return null;

    const value = (await response.json()) as Partial<AppUpdate>;
    if (
      typeof value.versionCode !== 'number' ||
      !Number.isInteger(value.versionCode) ||
      typeof value.versionName !== 'string' ||
      typeof value.apkUrl !== 'string' ||
      !value.apkUrl.startsWith(releasePrefix)
    ) {
      return null;
    }

    if (Platform.OS === 'ios' && !isAppStoreUrl(value.iosStoreUrl)) return null;
    const installedCode = Number(Application.nativeBuildVersion ?? 0);
    return value.versionCode > installedCode ? (value as AppUpdate) : null;
  } catch {
    return null;
  }
}

function isAppStoreUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('https://apps.apple.com/');
}
