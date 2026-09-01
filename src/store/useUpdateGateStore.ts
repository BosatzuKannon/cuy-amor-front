import { create } from 'zustand';

export type AppStatus = 'ACTIVE' | 'MAINTENANCE' | 'DEPRECATED';

export type SystemConfigData = {
  minVersionCode: number;
  latestVersionCode: number;
  appStatus: AppStatus;
  appStatusMessage: string | null;
  updateUrl: string;
};

export type UpdateGateStatus = 'checking' | 'ok' | 'hardBlocked';

type UpdateGateState = {
  status: UpdateGateStatus;
  config: SystemConfigData | null;
  localVersionCode: number;
  softUpdatePending: boolean;
  setConfig: (config: SystemConfigData) => void;
  setLocalVersionCode: (code: number) => void;
  setStatus: (status: UpdateGateStatus) => void;
  setSoftUpdatePending: (pending: boolean) => void;
};

const DEFAULT_UPDATE_URL = 'market://details?id=com.bosatzu.frontcuyamor';

export const useUpdateGateStore = create<UpdateGateState>((set) => ({
  status: 'checking',
  config: null,
  localVersionCode: 1,
  softUpdatePending: false,
  setConfig: (config) => set({ config }),
  setLocalVersionCode: (localVersionCode) => set({ localVersionCode }),
  setStatus: (status) => set({ status }),
  setSoftUpdatePending: (softUpdatePending) => set({ softUpdatePending }),
}));

export function getDefaultUpdateUrl(): string {
  return DEFAULT_UPDATE_URL;
}
