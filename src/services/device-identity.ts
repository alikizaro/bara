import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const INSTALLATION_ID_KEY = 'bara.installation-id.v1';
const DISPLAY_NAME_KEY = 'bara.display-name.v1';

export async function getOrCreateInstallationId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (stored) {
    return stored;
  }

  const installationId = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId);
  return installationId;
}

export async function getStoredDisplayName(): Promise<string | null> {
  return SecureStore.getItemAsync(DISPLAY_NAME_KEY);
}

export async function storeDisplayName(displayName: string): Promise<void> {
  await SecureStore.setItemAsync(DISPLAY_NAME_KEY, displayName);
}
