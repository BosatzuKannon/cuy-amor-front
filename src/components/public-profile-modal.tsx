import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { AppBackground } from '@/components/ui/app-background';
import { ageFromBirthDate, formatDistance } from '@/lib/profile-format';
import { titleCase } from '@/lib/text';
import {
  type ExploreProfile,
  type RelationshipGoalCode,
} from '@/services/profile-service';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

const MAX_PHOTOS = 3;
const DEFAULT_CITY = 'Pasto';

const BRAND_PRIMARY = '#DC143C';
const BRAND_SECONDARY = '#E2725B';
const TEXT_DARK = '#333333';
const MUTED_GRAY = '#8E8E93';
const CARD_BG = 'rgba(255, 255, 255, 0.65)';

const RELATIONSHIP_GOAL_LABELS: Record<RelationshipGoalCode, string> = {
  CASUAL: 'Parchar',
  FRIENDSHIP: 'Amistad',
  RELATIONSHIP: 'Relación',
  CHAT: 'Solo conversar',
  LET_IT_FLOW: 'Dejar que fluya',
  LIGHT_CASUAL: 'Algo casual',
};

const GENDER_BORDER_COLORS: Record<string, string> = {
  FEMALE: '#F472B6',
  MALE: '#22D3EE',
  OTHER: '#FBBF24',
};

const GENDER_BORDER_WIDTH = 3;

type PublicProfileModalProps = {
  visible: boolean;
  profile: ExploreProfile | null;
  onClose: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
};

type ProfileContentProps = {
  profile: ExploreProfile;
  onClose: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
};

function ProfileContent({
  profile,
  onClose,
  onPass,
  onSuperLike,
  onLike,
}: ProfileContentProps) {
  const { width: screenWidth, height: windowHeight } =
    Dimensions.get('window');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = useMemo(() => {
    const list =
      profile.photos && profile.photos.length > 0
        ? profile.photos
        : profile.photo
          ? [profile.photo]
          : [];
    return list.slice(0, MAX_PHOTOS);
  }, [profile]);

  const name = titleCase(profile.firstName ?? '');
  const age = ageFromBirthDate(profile.birthDate);
  const cityLabel = profile.city?.trim() ? profile.city.trim() : DEFAULT_CITY;
  const distanceLabel = formatDistance(profile.distance);
  const distanceLine = distanceLabel
    ? `A ${distanceLabel} de ti`
    : 'Cerca de ti';
  const goalLabel = profile.relationshipGoal
    ? RELATIONSHIP_GOAL_LABELS[profile.relationshipGoal]
    : null;
  const genderBorderColor = profile.gender
    ? GENDER_BORDER_COLORS[profile.gender]
    : null;
  const hobbies = (profile.hobbies ?? []).filter(
    (hobby) => hobby.trim().length > 0,
  );

  const pagerHeight = Math.round(windowHeight * 0.38);

  function handlePagerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (screenWidth <= 0 || photos.length === 0) {
      return;
    }
    const rawIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth,
    );
    const nextIndex = Math.min(Math.max(rawIndex, 0), photos.length - 1);
    setActivePhotoIndex((prev) => (prev === nextIndex ? prev : nextIndex));
  }

  return (
    <View style={styles.modalRoot}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>

          {/* TASK 2: Floating Photo Slider */}
          <View
            style={[
              styles.photoCard,
              genderBorderColor
                ? { borderWidth: GENDER_BORDER_WIDTH, borderColor: genderBorderColor }
                : null,
            ]}>
            {photos.length > 0 ? (
              <FlatList
                data={photos}
                keyExtractor={(item, index) => item.id ?? `${item.url}-${index}`}
                horizontal={true}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                scrollEventThrottle={16}
                onScroll={handlePagerScroll}
                getItemLayout={(_, index) => ({
                  length: screenWidth - 30,
                  offset: (screenWidth - 30) * index,
                  index,
                })}
                style={{ width: screenWidth - 30, height: pagerHeight }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: screenWidth - 30, height: pagerHeight }}
                    contentFit="cover"
                  />
                )}
              />
            ) : (
              <View
                style={[
                  styles.placeholderSlide,
                  { width: screenWidth - 30, height: pagerHeight },
                ]}>
                <AppText
                  variant="display"
                  color={Colors.white}
                  style={styles.placeholderLetter}>
                  {name.charAt(0) || 'C'}
                </AppText>
              </View>
            )}

            {photos.length > 1 ? (
              <View style={styles.dotsRow} pointerEvents="none">
                {photos.map((item, index) => (
                  <View
                    key={item.id ?? `${item.url}-${index}`}
                    style={[
                      styles.dot,
                      index === activePhotoIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar perfil"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}>
              <AntDesign name="close" size={20} color={Colors.white} />
            </Pressable>
          </View>

          {/* TASK 3: Semi-Transparent Header Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              <AppText variant="h2" color={TEXT_DARK} style={styles.nameText}>
                {name}
                {age !== null ? `, ${age}` : ''}
              </AppText>

              <View style={styles.locationRow}>
                <AntDesign
                  name="environment"
                  size={14}
                  color={BRAND_PRIMARY}
                />
                <AppText
                  variant="bodyMedium"
                  color={TEXT_DARK}
                  style={styles.locationCity}>
                  {cityLabel}
                </AppText>
                <View style={styles.locationDot} />
                <AppText
                  variant="caption"
                  color={MUTED_GRAY}
                  style={styles.distanceText}>
                  {distanceLine}
                </AppText>
              </View>

              {goalLabel ? (
                <View style={styles.goalRow}>
                  <AppText
                    variant="tag"
                    color={BRAND_SECONDARY}
                    style={styles.sectionLabel}>
                    BUSCA
                  </AppText>
                  <AppText
                    variant="body"
                    color={TEXT_DARK}
                    style={styles.goalText}>
                    {goalLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>

          {/* TASK 4: Semi-Transparent Details Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              {hobbies.length > 0 ? (
                <>
                  <AppText
                    variant="tag"
                    color={BRAND_SECONDARY}
                    style={styles.sectionLabel}>
                    PASATIEMPOS
                  </AppText>
                  <View style={styles.chipsWrap}>
                    {hobbies.map((hobby, index) => (
                      <View key={`${hobby}-${index}`} style={styles.hobbyChip}>
                        <AppText
                          variant="tag"
                          color={BRAND_PRIMARY}
                          style={styles.hobbyChipText}
                          numberOfLines={1}>
                          {hobby}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <AppText
                variant="tag"
                color={BRAND_SECONDARY}
                style={[styles.sectionLabel, { marginTop: hobbies.length > 0 ? Spacing.lg : 0 }]}>
                SOBRE MÍ
              </AppText>
              <AppText
                variant="body"
                color={TEXT_DARK}
                style={styles.bioText}>
                {profile.bio?.trim() ? profile.bio : 'Aún no hay bio por aquí. 🐹'}
              </AppText>
            </View>
          </View>

          {/* TASK 5: Interaction Buttons - Exact Explore View Styling */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => { onPass?.(); onClose?.(); }}
              disabled={!onPass}
              activeOpacity={0.8}
              accessibilityLabel="Pass"
              accessibilityRole="button"
              style={[
                styles.actionButton,
                !onPass && styles.actionButtonDisabled,
              ]}>
              <AntDesign name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { onSuperLike?.(); onClose?.(); }}
              disabled={!onSuperLike}
              activeOpacity={0.8}
              accessibilityLabel="Super Like"
              accessibilityRole="button"
              style={[
                styles.superLikeButton,
                !onSuperLike && styles.actionButtonDisabled,
              ]}>
              <Image
                source={require('@/assets/images/cuyazoo.png')}
                style={styles.superLikeIcon}
                contentFit="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { onLike?.(); onClose?.(); }}
              disabled={!onLike}
              activeOpacity={0.8}
              accessibilityLabel="Like"
              accessibilityRole="button"
              style={[
                styles.actionButton,
                !onLike && styles.actionButtonDisabled,
              ]}>
              <AntDesign name="heart" size={28} color="#DC143C" />
            </TouchableOpacity>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function PublicProfileModal({
  visible,
  profile,
  onClose,
  onPass,
  onSuperLike,
  onLike,
}: PublicProfileModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      {visible && profile ? (
        <View style={styles.modalRoot}>
          <AppBackground />
          <ProfileContent
            key={profile.id}
            profile={profile}
            onClose={onClose}
            onPass={onPass}
            onSuperLike={onSuperLike}
            onLike={onLike}
          />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  photoCard: {
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  placeholderSlide: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  placeholderLetter: {
    textAlign: 'center',
  },
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    zIndex: 20,
    elevation: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 30,
    elevation: 30,
  },
  closeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  infoCard: {
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 20,
    backgroundColor: CARD_BG,
  },
  infoContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  nameText: {
    textAlign: 'left',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  locationCity: {
    textAlign: 'left',
  },
  locationDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: MUTED_GRAY,
  },
  distanceText: {
    textAlign: 'left',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    textAlign: 'left',
    textTransform: 'uppercase',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  goalText: {
    textAlign: 'left',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  hobbyChip: {
    backgroundColor: '#FFFFFF',
    borderColor: BRAND_PRIMARY,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  hobbyChipText: {
    textAlign: 'left',
    fontWeight: '600',
  },
  bioText: {
    textAlign: 'left',
    marginTop: Spacing.xs,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  superLikeButton: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeIcon: {
    width: 70,
    height: 70,
  },
});