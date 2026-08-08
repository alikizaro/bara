import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

import type { AppUpdate, UpdateProgressHandler } from './types';

export async function installAndroidUpdate(
  update: AppUpdate,
  onProgress: UpdateProgressHandler,
): Promise<void> {
  if (!FileSystem.cacheDirectory) throw new Error('مساحة التنزيل غير متاحة');

  const destination = `${FileSystem.cacheDirectory}lamma-${update.versionCode}.apk`;
  await FileSystem.deleteAsync(destination, { idempotent: true });
  const download = FileSystem.createDownloadResumable(
    update.apkUrl,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress(totalBytesWritten / totalBytesExpectedToWrite);
      }
    },
  );
  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error('تعذر تنزيل ملف التحديث');

  onProgress(1);
  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1,
    type: 'application/vnd.android.package-archive',
  });
}
