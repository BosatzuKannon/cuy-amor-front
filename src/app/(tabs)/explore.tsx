import { AntDesign } from '@expo/vector-icons';
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
import { toast } from '@/lib/toast';
import {
  getExploreFeed,
  updateUserPreferences,
  type ExploreProfile,
} from '@/services/profile-service';
import {
  createInteraction,
  type InteractionTypeCode,
} from '@/services/interaction-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

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
  const [togglingNinja, setTogglingNinja] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const coinsBalance = profile?.coinsBalance ?? 0;
  const invisibleMode = profile?.preferences?.invisibleMode ?? false;

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
    if (!session || togglingNinja) {
      return;
    }
    setTogglingNinja(true);
    try {
      const fresh = await updateUserPreferences(
        session.user.id,
        { invisibleMode: value },
        session,
      );
      const current = useAuthStore.getState().profile;
      if (current) {
        useAuthStore.getState().setProfile({ ...current, preferences: fresh });
      }
      toast.success(
        value ? 'Modo Cuy Ninja activado' : 'Modo Cuy Ninja desactivado',
        value
          ? 'Ya no apareces en el feed de otros usuarios.'
          : 'Tu perfil vuelve a aparecer en el feed.',
      );
    } catch (error) {
      console.error('[explore] toggle ninja failed:', error);
      toast.error(
        'No se pudo actualizar el modo ninja',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setTogglingNinja(false);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.push('/search-preferences')}
              hitSlop={10}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.settingsPressed,
              ]}>
              <AntDesign name="setting" size={20} color={Colors.white} />
            </Pressable>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <AppText
                variant="tag"
                color="rgba(255,255,255,0.9)"
                style={styles.brandText}>
                CUY AMOR
              </AppText>
            </View>
          </View>
          <View style={styles.coinsPill}>
            <AppText variant="tag" color={Colors.white} style={styles.coinsText}>
              🪙 {coinsBalance}
            </AppText>
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
          <View style={[styles.card, styles.emptyCard]}>
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
              styles.actionButton,
              styles.actionCenter,
              noProfiles && styles.actionDisabled,
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <AntDesign name="star" size={34} color={Colors.gold} />
          </Pressable>

          <Pressable
            onPress={() => void performAction('LIKE')}
            disabled={noProfiles}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionSide,
              noProfiles && styles.actionDisabled,
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <AntDesign name="heart" size={28} color="#DC2626" />
          </Pressable>
        </View>

        <View style={styles.ninjaCard}>
          <View style={styles.ninjaInfo}>
            <AppText
              variant="caption"
              color={Colors.white}
              style={[styles.ninjaTitle, styles.ninjaTitleBold]}>
              Modo Cuy Ninja 🥷
            </AppText>
            <AppText
              variant="caption"
              color="rgba(255,255,255,0.8)"
              style={styles.ninjaDescription}>
              De esta manera nadie te va a encontrar y podrás explorar el campo
              como un ninja.
            </AppText>
            <AppText
              variant="caption"
              color="rgba(255,255,255,0.8)"
              style={styles.ninjaPrice}>
              Costo: 50 Cuy Coins/sem
            </AppText>
          </View>
          <Switch
            value={invisibleMode}
            onValueChange={(value) => void handleToggleNinja(value)}
            disabled={togglingNinja}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor="#ffffff"
            ios_backgroundColor="#767577"
            style={styles.ninjaSwitch}
          />
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
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  settingsPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#00D166',
  },
  brandText: {
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
  },
  coinsPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  coinsText: {
    textAlign: 'left',
  },
  card: {
    flex: 1,
    width: '100%',
    borderRadius: Radius.xl,
    ...Shadows.card,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyTitle: {
    textAlign: 'left',
  },
  emptyHint: {
    textAlign: 'left',
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
  actionCenter: {
    width: 74,
    height: 74,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  ninjaCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  ninjaDescription: {
    textAlign: 'left',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },
  ninjaPrice: {
    textAlign: 'left',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },
  ninjaSwitch: {
    transform: [{ scale: 0.8 }],
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
