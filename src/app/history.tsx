import { AntDesign } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuyLeyendaModal } from '@/components/cuy-leyenda-modal';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { ageFromBirthDate } from '@/lib/profile-format';
import { titleCase } from '@/lib/text';
import { toast } from '@/lib/toast';
import {
  changeInteraction,
  getInteractionHistory,
  type InteractionHistoryEntry,
  type InteractionHistoryPage,
  type InteractionTypeCode,
} from '@/services/interaction-service';
import type { ExploreProfile } from '@/services/profile-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const PAGE_SIZE = 20;

type ReversibleAction = Extract<InteractionTypeCode, 'LIKE' | 'SUPER_LIKE'>;

const ACTION_LABELS: Record<InteractionTypeCode, string> = {
  LIKE: 'Like',
  PASS: 'Pass',
  SUPER_LIKE: 'Cuyazo',
};

const ACTION_COLORS: Record<InteractionTypeCode, string> = {
  LIKE: Colors.primary,
  PASS: '#9CA3AF',
  SUPER_LIKE: '#F59E0B',
};

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
  }
  return fallback;
}

function ActionBadge({ type }: { type: InteractionTypeCode }) {
  const color = ACTION_COLORS[type];
  return (
    <View style={[styles.actionBadge, { borderColor: color }]}>
      {type === 'SUPER_LIKE' ? (
        <Image
          source={require('@/assets/images/cuyazoo.png')}
          style={styles.actionBadgeIcon}
          contentFit="contain"
        />
      ) : (
        <AntDesign
          name={type === 'LIKE' ? 'heart' : 'close'}
          size={12}
          color={color}
        />
      )}
      <AppText variant="tag" color={color} style={styles.actionBadgeText}>
        {ACTION_LABELS[type]}
      </AppText>
    </View>
  );
}

function HistoryRow({
  entry,
  isLeyenda,
  onOpenProfile,
  onReversazo,
  onLockedPress,
  reversazoLoading,
}: {
  entry: InteractionHistoryEntry;
  isLeyenda: boolean;
  onOpenProfile: () => void;
  onReversazo: () => void;
  onLockedPress: () => void;
  reversazoLoading: boolean;
}) {
  const target = entry.target;
  const name = titleCase(target.firstName ?? '');
  const age = ageFromBirthDate(target.birthDate);
  const photoUrl = target.photo?.url ?? target.photos?.[0]?.url ?? null;

  const avatarContent = (
    <>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.avatar}
          contentFit="cover"
          blurRadius={isLeyenda ? 0 : 30}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText variant="h3" color={Colors.white}>
            {name.charAt(0) || 'C'}
          </AppText>
        </View>
      )}
      {!isLeyenda ? (
        <View style={styles.avatarLock} pointerEvents="none">
          <AntDesign name="lock" size={18} color={Colors.white} />
        </View>
      ) : null}
    </>
  );

  const bodyContent = (
    <View style={styles.historyBody}>
      <AppText
        variant="bodyMedium"
        color={Colors.text}
        style={styles.historyName}
        numberOfLines={1}>
        {name}
        {age !== null ? `, ${age}` : ''}
      </AppText>
      <View style={styles.historyMetaRow}>
        <ActionBadge type={entry.type} />
        <AppText variant="caption" color={Colors.textMuted} numberOfLines={1}>
          {dateFormatter.format(new Date(entry.createdAt))}
        </AppText>
      </View>
    </View>
  );

  if (!isLeyenda) {
    return (
      <Pressable
        onPress={onLockedPress}
        accessibilityRole="button"
        accessibilityLabel={`Desbloquear historial de ${name || 'usuario'} con Cuy Leyenda`}
        style={({ pressed }) => [
          styles.historyItem,
          pressed && styles.pressed,
        ]}>
        <View style={styles.avatarButton}>{avatarContent}</View>
        {bodyContent}
        <View style={[styles.reversazoButton, styles.reversazoLocked]}>
          <AntDesign name="lock" size={13} color={Colors.white} />
          <AppText variant="tag" color={Colors.white} style={styles.reversazoText}>
            Reversazo
          </AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.historyItem}>
      <Pressable
        onPress={onOpenProfile}
        hitSlop={6}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Ver perfil de ${name || 'usuario'}`}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.pressed,
        ]}>
        {avatarContent}
      </Pressable>

      {bodyContent}

      <Pressable
        onPress={onReversazo}
        disabled={reversazoLoading}
        accessibilityRole="button"
        accessibilityLabel="Reversazo"
        style={({ pressed }) => [
          styles.reversazoButton,
          reversazoLoading && styles.reversazoDisabled,
          pressed && styles.pressed,
        ]}>
        {reversazoLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <AntDesign name="reload" size={14} color={Colors.white} />
            <AppText variant="tag" color={Colors.white} style={styles.reversazoText}>
              Reversazo
            </AppText>
          </>
        )}
      </Pressable>
    </View>
  );
}

function ReversazoMenu({
  visible,
  currentType,
  submitting,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentType: InteractionTypeCode | null;
  submitting: boolean;
  onSelect: (action: ReversibleAction) => void;
  onClose: () => void;
}) {
  const options: { action: ReversibleAction; label: string; hint: string }[] = [
    { action: 'LIKE', label: 'Cambiar a Like', hint: 'Dale like a este perfil' },
    {
      action: 'SUPER_LIKE',
      label: 'Cambiar a Cuyazo',
      hint: 'Envía un Cuyazo para destacar',
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.menuOverlay}>
        <View style={styles.menuCard}>
          <View style={styles.menuHeader}>
            <Image
              source={require('@/assets/images/iconvip.png')}
              style={styles.menuIcon}
              contentFit="contain"
            />
            <AppText variant="h3" color={Colors.text} style={styles.menuTitle}>
              Reversazo VIP
            </AppText>
          </View>
          <AppText variant="caption" color={Colors.textMuted} style={styles.menuSubtitle}>
            Elige la nueva acción para este perfil.
          </AppText>

          {options.map((option) => {
            const isCurrent = currentType === option.action;
            return (
              <Pressable
                key={option.action}
                disabled={isCurrent || submitting}
                onPress={() => onSelect(option.action)}
                style={({ pressed }) => [
                  styles.menuOption,
                  isCurrent && styles.menuOptionDisabled,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.menuOptionIcon}>
                  {option.action === 'SUPER_LIKE' ? (
                    <Image
                      source={require('@/assets/images/cuyazoo.png')}
                      style={styles.menuOptionImage}
                      contentFit="contain"
                    />
                  ) : (
                    <AntDesign name="heart" size={18} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.menuOptionBody}>
                  <AppText variant="bodyMedium" color={Colors.text}>
                    {option.label}
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {isCurrent ? 'Acción actual' : option.hint}
                  </AppText>
                </View>
                {isCurrent ? (
                  <AntDesign name="check" size={16} color={Colors.success} />
                ) : null}
              </Pressable>
            );
          })}

          <Pressable
            onPress={onClose}
            disabled={submitting}
            style={({ pressed }) => [
              styles.menuCancel,
              pressed && styles.pressed,
            ]}>
            <AppText variant="label" color={Colors.primary}>
              Cancelar
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const isLeyenda = useAuthStore((state) => state.profile?.isLeyenda ?? false);

  const [entries, setEntries] = useState<InteractionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ExploreProfile | null>(
    null,
  );
  const [showLeyendaModal, setShowLeyendaModal] = useState(false);
  const [menuEntry, setMenuEntry] = useState<InteractionHistoryEntry | null>(
    null,
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const applyPage = useCallback((page: InteractionHistoryPage) => {
    setEntries(page.data);
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
      const page = await getInteractionHistory(session, { limit: PAGE_SIZE });
      applyPage(page);
    } catch (err) {
      console.error('[history] fetch failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session, applyPage]);

  const handleRefresh = useCallback(async () => {
    if (!session) {
      return;
    }
    setRefreshing(true);
    setError(false);
    try {
      const page = await getInteractionHistory(session, { limit: PAGE_SIZE });
      applyPage(page);
    } catch (err) {
      console.error('[history] refresh failed:', err);
      toast.error(
        'No pudimos actualizar',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [session, applyPage]);

  const loadMore = useCallback(async () => {
    if (!session || loadingMoreRef.current || !hasMore || !nextCursor) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getInteractionHistory(session, {
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      setEntries((prev) => [...prev, ...page.data]);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('[history] load more failed:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [session, hasMore, nextCursor]);

  useFocusEffect(
    useCallback(() => {
      void fetchFirstPage();
    }, [fetchFirstPage]),
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }

  function handleReversazo(entry: InteractionHistoryEntry) {
    if (!isLeyenda) {
      setShowLeyendaModal(true);
      return;
    }
    setMenuEntry(entry);
  }

  async function applyChange(action: ReversibleAction) {
    if (!session || !menuEntry) {
      return;
    }
    const entry = menuEntry;
    setSubmittingId(entry.id);
    try {
      const result = await changeInteraction(entry.target.id, action, session);
      setEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, type: action } : item,
        ),
      );
      setMenuEntry(null);
      if (result.isMatch) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        toast.success('¡Es un Match! 🎉', 'Ahora pueden chatear.');
      } else {
        toast.success(
          'Reversazo aplicado',
          'Tu decisión se actualizó correctamente.',
        );
      }
    } catch (err) {
      console.error('[history] change failed:', err);
      setMenuEntry(null);
      if (isAxiosError(err) && err.response?.status === 403) {
        setShowLeyendaModal(true);
      } else {
        toast.error(
          'No se pudo aplicar el Reversazo',
          extractApiErrorMessage(err, 'Revisa tu conexión e inténtalo de nuevo.'),
        );
      }
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <AntDesign name="left" size={20} color={Colors.white} />
        </Pressable>
        <View style={styles.titleWrap}>
          <AppText variant="h3" color={Colors.white} style={styles.title}>
            Reversazo VIP
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            Tus últimas decisiones
          </AppText>
        </View>
      </View>

      {!isLeyenda ? (
        <Pressable
          onPress={() => setShowLeyendaModal(true)}
          style={({ pressed }) => [styles.upsell, pressed && styles.pressed]}>
          <Image
            source={require('@/assets/images/iconvip.png')}
            style={styles.upsellIcon}
            contentFit="contain"
          />
          <View style={styles.upsellBody}>
            <AppText variant="bodyMedium" color={Colors.gold}>
              Hazte Cuy Leyenda
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              Desbloquea el Reversazo y cambia tus decisiones pasadas.
            </AppText>
          </View>
          <AntDesign name="right" size={16} color="rgba(255,255,255,0.85)" />
        </Pressable>
      ) : null}

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <AppText variant="body" color={Colors.white} style={styles.stateText}>
            No pudimos cargar tu historial.
          </AppText>
          <Pressable
            onPress={() => void fetchFirstPage()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <AppText variant="bodyMedium" color={Colors.primary} style={styles.retryText}>
              Reintentar
            </AppText>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerWrap}>
          <AntDesign name="reload" size={48} color="rgba(255,255,255,0.4)" />
          <AppText
            variant="body"
            color="rgba(255,255,255,0.7)"
            style={styles.stateText}>
            Aún no has evaluado perfiles.
          </AppText>
        </View>
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryRow
                entry={item}
                isLeyenda={isLeyenda}
                reversazoLoading={submittingId === item.id}
                onOpenProfile={() => setActiveProfile(item.target)}
                onReversazo={() => handleReversazo(item)}
                onLockedPress={() => setShowLeyendaModal(true)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void handleRefresh()}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
          />
        </View>
      )}

      <PublicProfileModal
        visible={activeProfile !== null}
        profile={activeProfile}
        showActions={false}
        onClose={() => setActiveProfile(null)}
      />

      <ReversazoMenu
        visible={menuEntry !== null}
        currentType={menuEntry?.type ?? null}
        submitting={menuEntry !== null && submittingId === menuEntry.id}
        onSelect={(action) => void applyChange(action)}
        onClose={() => {
          if (submittingId === null) {
            setMenuEntry(null);
          }
        }}
      />

      <CuyLeyendaModal
        visible={showLeyendaModal}
        onClose={() => setShowLeyendaModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: 'stretch',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  titleWrap: {
    flex: 1,
    gap: Spacing.xxs,
  },
  title: {
    textAlign: 'left',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  upsellIcon: {
    width: 32,
    height: 32,
  },
  upsellBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
    ...Shadows.button,
  },
  retryText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  listCard: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  listContent: {
    padding: Spacing.md,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  avatarButton: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  avatarLock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  historyBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  historyName: {
    textAlign: 'left',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  actionBadgeIcon: {
    width: 14,
    height: 14,
  },
  actionBadgeText: {
    fontWeight: '700',
  },
  reversazoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 104,
    justifyContent: 'center',
    ...Shadows.button,
  },
  reversazoDisabled: {
    opacity: 0.6,
  },
  reversazoLocked: {
    backgroundColor: '#9CA3AF',
  },
  reversazoText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(226, 114, 91, 0.15)',
    marginLeft: 60,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuIcon: {
    width: 28,
    height: 28,
  },
  menuTitle: {
    textAlign: 'left',
  },
  menuSubtitle: {
    textAlign: 'left',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuOptionDisabled: {
    opacity: 0.55,
  },
  menuOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.10)',
  },
  menuOptionImage: {
    width: 30,
    height: 30,
  },
  menuOptionBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  menuCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
