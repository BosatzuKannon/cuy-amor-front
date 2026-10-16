import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useWhoLikesMe } from '@/hooks/useWhoLikesMe';
import { ageFromBirthDate } from '@/lib/profile-format';
import { titleCase } from '@/lib/text';
import type { WhoLikesMeEntry } from '@/services/interaction-service';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const PAGE_SIZE = 20;

function LikerCard({
  entry,
  isLeyenda,
  onPress,
}: {
  entry: WhoLikesMeEntry;
  isLeyenda: boolean;
  onPress: () => void;
}) {
  const liker = entry.liker;
  const name = titleCase(liker.firstName ?? '');
  const age = ageFromBirthDate(liker.birthDate);
  const photoUrl = liker.photo?.url ?? liker.photos?.[0]?.url ?? null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isLeyenda
          ? `Ver perfil de ${name || 'usuario'}`
          : `Desbloquear pretendiente ${name || 'usuario'} con Cuy Leyenda`
      }
      style={({ pressed }) => [styles.gridItem, pressed && styles.pressed]}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.gridPhoto}
          contentFit="cover"
          blurRadius={isLeyenda ? 0 : 26}
        />
      ) : (
        <View style={[styles.gridPhoto, styles.gridPlaceholder]}>
          <AppText variant="display" color={Colors.white}>
            {name.charAt(0) || 'C'}
          </AppText>
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.78)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gridOverlay}
      />

      {entry.type === 'SUPER_LIKE' ? (
        <View style={styles.superBadge}>
          <Image
            source={require('@/assets/images/cuyazoo.png')}
            style={styles.superBadgeIcon}
            contentFit="contain"
          />
        </View>
      ) : null}

      {!isLeyenda ? (
        <View style={styles.gridLock} pointerEvents="none">
          <AntDesign name="lock" size={22} color={Colors.white} />
        </View>
      ) : null}

      <View style={styles.gridNameWrap} pointerEvents="none">
        <AppText
          variant="bodyMedium"
          color={Colors.white}
          numberOfLines={1}
          style={styles.gridName}>
          {name}
          {age !== null ? `, ${age}` : ''}
        </AppText>
      </View>
    </Pressable>
  );
}

export default function WhoLikesYouScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLeyenda,
    entries,
    total,
    loading,
    error,
    refreshing,
    loadingMore,
    activeLiker,
    showLeyendaModal,
    fetchFirstPage,
    refresh,
    loadMore,
    openLiker,
    closeLiker,
    openLeyendaModal,
    closeLeyendaModal,
    handleDecision,
  } = useWhoLikesMe(PAGE_SIZE);

  useFocusEffect(
    useCallback(() => {
      void fetchFirstPage();
    }, [fetchFirstPage]),
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/matches');
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
            Pretendientes
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            {total > 0
              ? `${total} ${total === 1 ? 'persona te dio' : 'personas te dieron'} like`
              : 'Quién le dio like a tu perfil'}
          </AppText>
        </View>
      </View>

      {!isLeyenda ? (
        <Pressable
          onPress={openLeyendaModal}
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
              Descubre quién le dio like a tu perfil y dale match.
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
            No pudimos cargar a tus pretendientes.
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
          <AntDesign name="heart" size={48} color="rgba(255,255,255,0.4)" />
          <AppText variant="body" color="rgba(255,255,255,0.7)" style={styles.stateText}>
            Aún no tienes pretendientes.
          </AppText>
        </View>
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <LikerCard
                entry={item}
                isLeyenda={isLeyenda}
                onPress={() => openLiker(item.liker)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void refresh()}
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
        visible={activeLiker !== null}
        profile={activeLiker}
        onClose={closeLiker}
        onPass={() => {
          if (activeLiker) {
            void handleDecision(activeLiker.id, 'PASS');
          }
        }}
        onSuperLike={() => {
          if (activeLiker) {
            void handleDecision(activeLiker.id, 'SUPER_LIKE');
          }
        }}
        onLike={() => {
          if (activeLiker) {
            void handleDecision(activeLiker.id, 'LIKE');
          }
        }}
      />

      <CuyLeyendaModal
        visible={showLeyendaModal}
        onClose={closeLeyendaModal}
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
  gridContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  gridRow: {
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral,
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  gridLock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  superBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  superBadgeIcon: {
    width: 20,
    height: 20,
  },
  gridNameWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  gridName: {
    textAlign: 'left',
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
