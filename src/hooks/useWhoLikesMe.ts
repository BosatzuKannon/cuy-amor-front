import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';

import { toast } from '@/lib/toast';
import {
  createInteraction,
  getWhoLikesMe,
  type InteractionTypeCode,
  type WhoLikesMeEntry,
  type WhoLikesMePage,
} from '@/services/interaction-service';
import type { ExploreProfile } from '@/services/profile-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export type LikerDecision = Extract<
  InteractionTypeCode,
  'LIKE' | 'PASS' | 'SUPER_LIKE'
>;

export function useWhoLikesMe(pageSize: number) {
  const session = useAuthStore((state) => state.session);
  const isLeyenda = useAuthStore(
    (state) => state.profile?.isLeyenda ?? false,
  );
  const coinsBalance = useAuthStore(
    (state) => state.profile?.coinsBalance ?? 0,
  );
  const dailyCuyazosLeft = useAuthStore(
    (state) => state.profile?.dailyCuyazosLeft ?? 0,
  );

  const [entries, setEntries] = useState<WhoLikesMeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeLiker, setActiveLiker] = useState<ExploreProfile | null>(null);
  const [showLeyendaModal, setShowLeyendaModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCuyazo, setPendingCuyazo] = useState<ExploreProfile | null>(
    null,
  );
  const [cuyazoLoading, setCuyazoLoading] = useState(false);
  const loadingMoreRef = useRef(false);
  const submittingRef = useRef(false);

  const applyFirstPage = useCallback((page: WhoLikesMePage) => {
    setEntries(page.data);
    setTotal(page.total);
    setNextCursor(page.nextCursor);
    setHasMore(page.hasMore);
  }, []);

  const fetchFirstPage = useCallback(async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const page = await getWhoLikesMe(session, { limit: pageSize });
      applyFirstPage(page);
    } catch (err) {
      console.error('[pretendientes] fetch failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session, pageSize, applyFirstPage]);

  const refresh = useCallback(async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError(false);
    try {
      const page = await getWhoLikesMe(session, { limit: pageSize });
      applyFirstPage(page);
    } catch (err) {
      console.error('[pretendientes] refresh failed:', err);
      toast.error(
        'No pudimos actualizar',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [session, pageSize, applyFirstPage]);

  const loadMore = useCallback(async () => {
    if (!session || loadingMoreRef.current || !hasMore || !nextCursor) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getWhoLikesMe(session, {
        cursor: nextCursor,
        limit: pageSize,
      });
      setEntries((prev) => [...prev, ...page.data]);
      setTotal(page.total);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[pretendientes] load more failed:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [session, hasMore, nextCursor, pageSize]);

  const removeEntry = useCallback((likerId: string) => {
    setEntries((prev) =>
      prev.filter((entry) => entry.liker.id !== likerId),
    );
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  const openLiker = useCallback(
    (liker: ExploreProfile) => {
      if (!isLeyenda) {
        setShowLeyendaModal(true);
        return;
      }
      setActiveLiker(liker);
    },
    [isLeyenda],
  );

  const closeLiker = useCallback(() => setActiveLiker(null), []);
  const openLeyendaModal = useCallback(() => setShowLeyendaModal(true), []);
  const closeLeyendaModal = useCallback(
    () => setShowLeyendaModal(false),
    [],
  );

  const performCuyazo = useCallback(
    async (likerId: string) => {
      if (!session || submittingRef.current) {
        return;
      }
      submittingRef.current = true;
      setCuyazoLoading(true);
      try {
        const result = await createInteraction(likerId, 'SUPER_LIKE', session);
        if (result.newCoinBalance !== undefined) {
          useAuthStore.getState().setCoinsBalance(result.newCoinBalance);
        }
        const profile = useAuthStore.getState().profile;
        if (profile?.isLeyenda && profile.dailyCuyazosLeft > 0) {
          useAuthStore.getState().updateProfile({
            dailyCuyazosLeft: profile.dailyCuyazosLeft - 1,
          });
        }
        removeEntry(likerId);
        if (result.isMatch) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          toast.success('¡Es un Match! 🎉', 'Ahora pueden chatear.');
          void useChatStore.getState().fetchMatches();
        }
      } catch (err) {
        console.error('[pretendientes] cuyazo failed:', err);
        toast.error(
          'No se pudo enviar el Cuyazo',
          'Necesitas 15 Cuy Coins o un Cuyazo diario de Leyenda. Revisa tu saldo e inténtalo de nuevo.',
        );
      } finally {
        submittingRef.current = false;
        setCuyazoLoading(false);
        setPendingCuyazo(null);
      }
    },
    [session, removeEntry],
  );

  const confirmPendingCuyazo = useCallback(() => {
    if (!pendingCuyazo) {
      return;
    }
    void performCuyazo(pendingCuyazo.id);
  }, [pendingCuyazo, performCuyazo]);

  const cancelPendingCuyazo = useCallback(() => {
    if (!cuyazoLoading) {
      setPendingCuyazo(null);
    }
  }, [cuyazoLoading]);

  const handleDecision = useCallback(
    async (likerId: string, type: LikerDecision) => {
      if (!session || submittingRef.current) {
        return;
      }
      if (type === 'SUPER_LIKE') {
        if (isLeyenda && dailyCuyazosLeft > 0) {
          void performCuyazo(likerId);
          return;
        }
        const pending = entries.find((entry) => entry.liker.id === likerId);
        if (pending) {
          setActiveLiker(null);
          setPendingCuyazo(pending.liker);
        }
        return;
      }
      submittingRef.current = true;
      setSubmitting(true);
      try {
        const result = await createInteraction(likerId, type, session);
        removeEntry(likerId);
        if (result.isMatch) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          toast.success('¡Es un Match! 🎉', 'Ahora pueden chatear.');
          void useChatStore.getState().fetchMatches();
        }
      } catch (err) {
        console.error('[pretendientes] decision failed:', err);
        toast.error(
          'No se pudo completar la acción',
          'Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [session, removeEntry, entries, isLeyenda, dailyCuyazosLeft, performCuyazo],
  );

  return {
    session,
    isLeyenda,
    coinsBalance,
    dailyCuyazosLeft,
    entries,
    total,
    loading,
    error,
    refreshing,
    loadingMore,
    hasMore,
    submitting,
    activeLiker,
    showLeyendaModal,
    pendingCuyazo,
    cuyazoLoading,
    fetchFirstPage,
    refresh,
    loadMore,
    openLiker,
    closeLiker,
    openLeyendaModal,
    closeLeyendaModal,
    handleDecision,
    confirmPendingCuyazo,
    cancelPendingCuyazo,
  };
}
