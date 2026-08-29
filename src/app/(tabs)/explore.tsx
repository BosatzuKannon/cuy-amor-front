import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ExploreCard } from '@/components/explore-card';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  getExploreFeed,
  type ExploreProfile,
} from '@/services/profile-service';
import {
  createInteraction,
  type InteractionTypeCode,
} from '@/services/interaction-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const NINJA_COST_IN_COINS = 50;
const DEFAULT_NINJA_DAYS_LEFT = 7;

type NinjaActivationResponse = {
  isNinja: boolean;
  ninjaExpiresAt: string | null;
  ninjaDaysLeft?: number;
};

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as {
      response?: { data?: { message?: string | string[] } };
    }).response?.data;
    const message = data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }
  }
  return fallback;
}

function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
}

function ExploreSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton style={styles.skeletonImage} />
      <View style={styles.skeletonOverlay}>
        <Skeleton style={styles.skeletonName} />
        <Skeleton style={styles.skeletonBio} />
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [isNinjaLoading, setIsNinjaLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNinjaTooltip, setShowNinjaTooltip] = useState(false);

  const coinsBalance = profile?.coinsBalance ?? 0;
  const isNinjaActive = profile?.isNinja ?? false;
  const ninjaDaysLeft = profile?.ninjaDaysLeft ?? 0;
  const isLeyenda = profile?.isLeyenda ?? false;
  const dailyCuyazosLeft = profile?.dailyCuyazosLeft ?? 0;

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        return;
      }
      let active = true;
      setLoading(true);
      getExploreFeed(session)
        .then((data) => {
          if (active) {
            setProfiles(data);
          }
        })
        .catch((error) => {
          console.error('[explore] fetch failed:', error);
          if (active) {
            toast.error(
              'No se pudieron cargar los perfiles',
              'Revisa tu conexión e inténtalo de nuevo.',
            );
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }, [session]),
  );

  const activeProfile = profiles[0] ?? null;
  const noProfiles = profiles.length === 0;

  const processingRef = useRef(false);
  const ninjaTooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (ninjaTooltipTimeoutRef.current) {
        clearTimeout(ninjaTooltipTimeoutRef.current);
      }
    };
  }, []);

  async function performAction(type: InteractionTypeCode) {
    if (processingRef.current || !session || !activeProfile) {
      return;
    }
    processingRef.current = true;
    try {
      const result = await createInteraction(activeProfile.id, type, session);
      if (result.isMatch) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        toast.success('¡Es un Match! 🎉', 'Ahora pueden chatear.');
      }
      if (result.newCoinBalance !== undefined) {
        useAuthStore.getState().setCoinsBalance(result.newCoinBalance);
      }
      if (type === 'SUPER_LIKE' && isLeyenda && dailyCuyazosLeft > 0) {
        useAuthStore.getState().updateProfile({
          dailyCuyazosLeft: dailyCuyazosLeft - 1,
        });
      }
      setProfiles((prev) => prev.slice(1));
    } catch (error) {
      console.error(`[explore] ${type} failed:`, error);
      const message = extractApiErrorMessage(
        error,
        'No se pudo completar la acción.',
      );
      if (type === 'SUPER_LIKE') {
        toast.error(
          'Saldo insuficiente',
          'Necesitas 15 Cuy Coins para enviar un Cuyazo.',
        );
      } else {
        toast.error('No se pudo completar la acción', message);
      }
    } finally {
      processingRef.current = false;
    }
  }

  async function handleToggleNinja(value: boolean) {
    if (!session || isNinjaLoading) {
      return;
    }
    setIsNinjaLoading(true);
    try {
      if (value) {
        const { data } = await api.post<NinjaActivationResponse>(
          '/users/ninja/activate',
          {},
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        const currentBalance =
          useAuthStore.getState().profile?.coinsBalance ?? 0;
        if (!isLeyenda) {
          useAuthStore.getState().updateProfile({
            coinsBalance: Math.max(0, currentBalance - NINJA_COST_IN_COINS),
            isNinja: true,
            ninjaDaysLeft:
              data.ninjaDaysLeft ?? DEFAULT_NINJA_DAYS_LEFT,
          });
          toast.success(
            'Modo Cuy Ninja activado',
            `-50 Cuy Coins · ${data.ninjaDaysLeft ?? DEFAULT_NINJA_DAYS_LEFT} días de sigilo`,
          );
        } else {
          useAuthStore.getState().updateProfile({
            isNinja: true,
            ninjaDaysLeft:
              data.ninjaDaysLeft ?? DEFAULT_NINJA_DAYS_LEFT,
          });
          toast.success(
            'Modo Cuy Ninja activado',
            `${data.ninjaDaysLeft ?? DEFAULT_NINJA_DAYS_LEFT} días de sigilo · Gratis para Cuy Leyenda`,
          );
        }
      } else {
        await api.post(
          '/users/ninja/deactivate',
          {},
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        useAuthStore.getState().updateProfile({
          isNinja: false,
          ninjaDaysLeft: 0,
        });
        toast.success('Modo Cuy Ninja desactivado', 'Vuelves a ser visible.');
      }
    } catch (error) {
      console.error('[explore] toggle ninja failed:', error);
      toast.error(
        extractApiErrorMessage(error, 'No se pudo actualizar el modo ninja'),
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setIsNinjaLoading(false);
    }
  }

  function showNinjaInfo() {
    setShowNinjaTooltip(true);
    if (ninjaTooltipTimeoutRef.current) {
      clearTimeout(ninjaTooltipTimeoutRef.current);
    }
    ninjaTooltipTimeoutRef.current = setTimeout(
      () => setShowNinjaTooltip(false),
      3000,
    );
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRight}>
            <View style={styles.coinsPill}>
              <View style={styles.coinsIconWrap}>
                <Image
                  source={require('@/assets/images/coinn.png')}
                  style={styles.coinsIcon}
                  contentFit="contain"
                />
              </View>
              <AppText
                variant="tag"
                color={Colors.white}
                style={styles.coinsText}>
                {coinsBalance}
              </AppText>
            </View>
            <Pressable
              onPress={() => router.push('/search-preferences')}
              hitSlop={10}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.settingsPressed,
              ]}>
              <AntDesign name="setting" size={20} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {loading && profiles.length === 0 ? (
          <ExploreSkeleton />
        ) : activeProfile ? (
          <ExploreCard
            profile={activeProfile}
            onPress={() => setIsProfileOpen(true)}
          />
        ) : (
          <View style={[styles.card, styles.emptyCard, styles.cardEmpty]}>
            <AntDesign name="heart" size={40} color={Colors.white} />
            <AppText variant="h3" color={Colors.white} style={styles.emptyTitle}>
              No hay cuyes por ahora
            </AppText>
            <AppText
              variant="caption"
              color="rgba(255,255,255,0.9)"
              style={styles.emptyHint}>
              Vuelve pronto para descubrir nuevos perfiles cerca de ti.
            </AppText>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void performAction('PASS')}
            disabled={noProfiles}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionSide,
              { backgroundColor: '#FFFFFF' },
              noProfiles && styles.actionDisabled,
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <AntDesign name="close" size={28} color="#9CA3AF" />
          </Pressable>

          <Pressable
            onPress={() => void performAction('SUPER_LIKE')}
            disabled={noProfiles}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionCuyazo,
              noProfiles && styles.actionDisabled,
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <Image
              source={require('@/assets/images/cuyazoo.png')}
              style={styles.actionCuyazoIcon}
              contentFit="contain"
            />
            {isLeyenda && dailyCuyazosLeft > 0 && (
              <View style={styles.cuyazoBadge}>
                <AppText variant="tag" color={Colors.white} style={styles.cuyazoBadgeText}>
                  {dailyCuyazosLeft}
                </AppText>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => void performAction('LIKE')}
            disabled={noProfiles}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionSide,
              { backgroundColor: '#FFFFFF' },
              noProfiles && styles.actionDisabled,
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <AntDesign name="heart" size={28} color="#DC2626" />
          </Pressable>
        </View>

        <View style={styles.ninjaWrap}>
          <View style={styles.ninjaCard}>
            <View style={styles.ninjaIconWrap}>
              <Image
                source={require('@/assets/images/ninjaa.png')}
                style={styles.ninjaIcon}
                contentFit="contain"
              />
            </View>
            <View style={styles.ninjaInfo}>
              <AppText
                variant="caption"
                color={Colors.white}
                style={[styles.ninjaTitle, styles.ninjaTitleBold]}>
                Modo Cuy Ninja
              </AppText>
            </View>
            <View style={styles.ninjaSwitchArea}>
              {isNinjaActive ? (
                <AppText
                  variant="tag"
                  color={Colors.textMuted}
                  style={styles.ninjaDaysLabel}>
                  {ninjaDaysLeft} días
                </AppText>
              ) : null}
              <Switch
                value={isNinjaActive}
                onValueChange={(value) => void handleToggleNinja(value)}
                disabled={isNinjaLoading || (isNinjaActive && !isLeyenda)}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#767577"
                style={styles.ninjaSwitch}
              />
            </View>
            <Pressable
              onPress={showNinjaInfo}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Información del Modo Cuy Ninja"
              style={({ pressed }) => [
                styles.ninjaInfoButton,
                pressed && styles.ninjaInfoButtonPressed,
              ]}>
              <AntDesign
                name="info-circle"
                size={18}
                color="rgba(255,255,255,0.9)"
              />
            </Pressable>
          </View>
          {showNinjaTooltip ? (
            <View style={styles.ninjaTooltip} pointerEvents="none">
              <AppText
                variant="caption"
                color={Colors.white}
                style={styles.ninjaTooltipText}>
                De esta manera nadie te va a encontrar y podrás explorar el
                campo como un ninja.
              </AppText>
              <AppText
                variant="caption"
                color={Colors.white}
                style={styles.ninjaTooltipText}>
                {isLeyenda ? 'Gratis para Cuy Leyenda' : 'Costo: 50 Cuy Coins/sem'}
              </AppText>
            </View>
          ) : null}
        </View>

        <PublicProfileModal
          visible={isProfileOpen && activeProfile !== null}
          profile={activeProfile}
          onClose={() => setIsProfileOpen(false)}
          onPass={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void performAction('PASS');
          }}
          onSuperLike={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            void performAction('SUPER_LIKE');
          }}
          onLike={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void performAction('LIKE');
          }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  settingsPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    ...Shadows.button,
  },
  coinsIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsIcon: {
    width: 24,
    height: 24,
  },
  coinsText: {
    textAlign: 'left',
  },
  card: {
    height: '60%',
    width: '100%',
    borderRadius: Radius.xl,
  },
  cardEmpty: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    maxWidth: 280,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  actionSide: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
  },
  actionCuyazo: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionCuyazoIcon: {
    width: 70,
    height: 70,
  },
  cuyazoBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cuyazoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  ninjaWrap: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  ninjaCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Radius.xl,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ninjaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ninjaIcon: {
    width: 26,
    height: 26,
  },
  ninjaInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  ninjaTitle: {
    textAlign: 'left',
    fontSize: 12,
    lineHeight: 16,
  },
  ninjaTitleBold: {
    fontWeight: '600',
  },
  ninjaInfoButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ninjaInfoButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
  ninjaSwitch: {
    transform: [{ scale: 0.85 }],
  },
  ninjaSwitchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ninjaDaysLabel: {
    fontSize: 11,
    textAlign: 'right',
  },
  ninjaTooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: Spacing.sm,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    gap: Spacing.xs,
    alignItems: 'flex-start',
    ...Shadows.button,
  },
  ninjaTooltipText: {
    textAlign: 'left',
  },
  skeleton: {
    backgroundColor: '#E6E8EB',
    borderRadius: Radius.md,
  },
  skeletonCard: {
    flex: 1,
    width: '100%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#E6E8EB',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  skeletonOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  skeletonName: {
    width: '55%',
    height: 22,
  },
  skeletonBio: {
    width: '85%',
    height: 14,
  },
});
