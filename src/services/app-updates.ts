import { Platform } from 'react-native';

import { installAndroidUpdate } from './updates/android-installer';
import { openIosStoreUpdate } from './updates/ios-installer';
import { checkForAppUpdate } from './updates/update-manifest';
import type { AppUpdate, UpdateProgressHandler } from './updates/types';

export type { AppUpdate } from './updates/types';
export { checkForAppUpdate };

export async function downloadAndInstallUpdate(
  update: AppUpdate,
  onProgress: UpdateProgressHandler,
): Promise<void> {
  if (Platform.OS === 'android') {
    await installAndroidUpdate(update, onProgress);
    return;
  }
  await openIosStoreUpdate(update);
}
