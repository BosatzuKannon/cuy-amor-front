import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchSystemConfig,
  getLocalVersionCode,
  hasShownSoftUpdateRecently,
  markSoftUpdateDismissed,
} from '@/lib/update-gate';
import { useUpdateGateStore } from '@/store/useUpdateGateStore';

export function useUpdateGate() {
  const status = useUpdateGateStore((s) => s.status);
  const config = useUpdateGateStore((s) => s.config);
  const localVersionCode = useUpdateGateStore((s) => s.localVersionCode);
  const softUpdatePending = useUpdateGateStore(
    (s) => s.softUpdatePending,
  );
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  const runGate = useCallback(async () => {
    const store = useUpdateGateStore.getState();

    try {
      let versionCode = 1;
      try {
        versionCode = await getLocalVersionCode();
      } catch {
        versionCode = 1;
      }
      store.setLocalVersionCode(versionCode);

      let remote;
      try {
        remote = await fetchSystemConfig();
      } catch {
        remote = null;
      }

      if (!remote) {
        store.setStatus('ok');
        store.setSoftUpdatePending(false);
        return;
      }

      store.setConfig(remote);

      const minVersionCode = remote.minVersionCode ?? 1;
      const latestVersionCode = remote.latestVersionCode ?? 1;

      if (versionCode < minVersionCode) {
        store.setStatus('hardBlocked');
        store.setSoftUpdatePending(false);
        return;
      }

      store.setStatus('ok');
      if (versionCode < latestVersionCode) {
        const shownRecently = await hasShownSoftUpdateRecently();
        store.setSoftUpdatePending(!shownRecently);
      } else {
        store.setSoftUpdatePending(false);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void runGate();
  }, [runGate]);

  const dismissSoftUpdate = useCallback(() => {
    void markSoftUpdateDismissed();
    useUpdateGateStore.getState().setSoftUpdatePending(false);
  }, []);

  return {
    ready,
    status,
    config,
    localVersionCode,
    softUpdatePending,
    dismissSoftUpdate,
  };
}
