import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { api } from '@/lib/api';
import type { SystemConfigData } from '@/store/useUpdateGateStore';

const SOFT_UPDATE_DISMISSED_KEY = 'soft_update_dismissed_at';
const SOFT_UPDATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getLocalVersionCode(): Promise<number> {
  const nativeBuildVersion = Application.nativeBuildVersion;
  const parsedNative = nativeBuildVersion ? Number(nativeBuildVersion) : NaN;
  if (Number.isFinite(parsedNative) && parsedNative > 0) {
    return parsedNative;
  }

  const expoVersionCode = Constants.expoConfig?.android?.versionCode;
  if (typeof expoVersionCode === 'number' && expoVersionCode > 0) {
    return expoVersionCode;
  }

  return 1;
}

export async function fetchSystemConfig(): Promise<SystemConfigData> {
  const { data } = await api.get<SystemConfigData>('/system/config', {
    timeout: 8000,
  });
  return {
    minVersionCode: data.minVersionCode,
    latestVersionCode: data.latestVersionCode,
    appStatus: data.appStatus,
    appStatusMessage: data.appStatusMessage ?? null,
    updateUrl:
      data.updateUrl?.trim() ||
      'market://details?id=com.bosatzu.frontcuyamor',
  };
}

export async function hasShownSoftUpdateRecently(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SOFT_UPDATE_DISMISSED_KEY);
    if (!raw) {
      return false;
    }
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) {
      return false;
    }
    return Date.now() - dismissedAt < SOFT_UPDATE_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export async function markSoftUpdateDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(SOFT_UPDATE_DISMISSED_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
}
