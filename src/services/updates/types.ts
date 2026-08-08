export interface AppUpdate {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  iosStoreUrl?: string;
}

export type UpdateProgressHandler = (progress: number) => void;
