import * as Application from 'expo-application';

const manifestUrl =
  'https://github.com/alikizaro/bara/releases/download/latest/update.json';
const releasePrefix =
  'https://github.com/alikizaro/bara/releases/download/latest/';

export interface AppUpdate {
  versionCode: number;
  versionName: string;
  apkUrl: string;
}

export async function checkForAppUpdate(): Promise<AppUpdate | null> {
  try {
    const response = await fetch(`${manifestUrl}?t=${Date.now()}`);
    if (!response.ok) {
      return null;
    }
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
    const installedCode = Number(Application.nativeBuildVersion ?? 0);
    return value.versionCode > installedCode ? (value as AppUpdate) : null;
  } catch {
    return null;
  }
}
