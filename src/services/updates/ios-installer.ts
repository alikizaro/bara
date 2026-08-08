import { Linking } from 'react-native';

import type { AppUpdate } from './types';

export async function openIosStoreUpdate(update: AppUpdate): Promise<void> {
  if (!update.iosStoreUrl) throw new Error('رابط App Store غير متاح بعد');
  await Linking.openURL(update.iosStoreUrl);
}
