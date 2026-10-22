import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { HighlyRequestedBadge } from '@/components/highly-requested-badge';
import { AppText } from '@/components/ui/app-text';
import { ageFromBirthDate, formatDistance } from '@/lib/profile-format';
import { titleCase } from '@/lib/text';
import type {
  ExploreProfile,
  RelationshipGoalCode,
} from '@/services/profile-service';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type CardGradient = {
  colors: readonly [string, string];
};

const CARD_GRADIENTS: Record<string, CardGradient> = {
  FEMALE: { colors: ['#f9a8d4', '#a855f7'] },
  MALE: { colors: ['#40E0D0', '#007FFF'] },
  OTHER: { colors: ['#FFD700', '#16A34A'] },
};

const RELATIONSHIP_GOAL_LABELS: Record<RelationshipGoalCode, string> = {
  CASUAL: 'Parchar',
  FRIENDSHIP: 'Amistad',
  RELATIONSHIP: 'Relación',
  CHAT: 'Solo conversar',
  LET_IT_FLOW: 'Dejar que fluya',
  LIGHT_CASUAL: 'Algo casual',
};

function cardGradientFor(gender: ExploreProfile['gender']): CardGradient {
  if (gender && CARD_GRADIENTS[gender]) {
    return CARD_GRADIENTS[gender];
  }
  return CARD_GRADIENTS.OTHER;
}

type ExploreCardProps = {
  profile: ExploreProfile;
};

export function ExploreCard({ profile }: ExploreCardProps) {
  const gradient = cardGradientFor(profile.gender);
  const name = titleCase(profile.firstName ?? '');
  const age = ageFromBirthDate(profile.birthDate);
  const distanceLabel = formatDistance(profile.distance) ?? 'Cerca de ti';
  const goalLabel = profile.relationshipGoal
    ? RELATIONSHIP_GOAL_LABELS[profile.relationshipGoal]
    : null;

  return (
    <View style={[styles.card, profile.isLeyenda && styles.cardLeyenda]}>
      <LinearGradient
        colors={gradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}>
        <View style={styles.imageWrap}>
          {profile.photo ? (
            <CardPhoto key={profile.photo.url} photoUrl={profile.photo.url} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <AppText
                variant="display"
                color={Colors.white}
                style={styles.placeholderLetter}>
                {name.charAt(0) || 'C'}
              </AppText>
            </View>
          )}

          {profile.isLeyenda ? <LeyendaShine /> : null}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          />

          {profile.isLeyenda ? (
            <View style={styles.crownBadge} pointerEvents="none">
              <AntDesign name="crown" size={16} color="#FFD700" />
            </View>
          ) : null}

          <View style={styles.overlayContent}>
            {profile.isHighlyRequested ? (
              <HighlyRequestedBadge
                compact
                style={styles.highlyRequestedBadge}
              />
            ) : null}
            <AppText
              variant="h2"
              color={Colors.white}
              style={styles.overlayName}>
              {name}
              {age !== null ? `, ${age}` : ''}
            </AppText>
            <View style={styles.pillsRow}>
              {profile.isLeyenda ? (
                <View style={styles.premiumChip}>
                  <Image
                    source={require('@/assets/images/iconvip.png')}
                    style={styles.premiumChipIcon}
                    contentFit="contain"
                  />
                  <AppText
                    variant="tag"
                    color="#FFD700"
                    style={styles.premiumChipText}>
                    Cuy Leyenda
                  </AppText>
                </View>
              ) : null}
              <View style={styles.distancePill}>
                <AntDesign name="environment" size={12} color={Colors.white} />
                <AppText
                  variant="tag"
                  color={Colors.white}
                  style={styles.distanceText}>
                  {distanceLabel}
                </AppText>
              </View>
              {goalLabel ? (
                <View style={styles.goalPill}>
                  <AppText
                    variant="tag"
                    color="#FFFFFF"
                    style={styles.goalPillText}>
                    {goalLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
            {profile.bio ? (
              <AppText
                variant="caption"
                color="rgba(255,255,255,0.92)"
                style={styles.overlayBio}
                numberOfLines={2}>
                {profile.bio}
              </AppText>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function LeyendaShine() {
  const progress = useSharedValue(-1);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1.5, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * Dimensions.get('window').width },
      { rotate: '18deg' },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shine, shineStyle]}
      testID="leyenda-shine">
      <LinearGradient
        colors={[
          'rgba(255,215,0,0)',
          'rgba(255,215,0,0.35)',
          'rgba(255,255,255,0.55)',
          'rgba(255,215,0,0.35)',
          'rgba(255,215,0,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shineGradient}
      />
    </Animated.View>
  );
}

function CardPhoto({ photoUrl }: { photoUrl: string }) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <View style={styles.image}>
      <Image
        source={{ uri: photoUrl }}
        style={styles.imageFull}
        contentFit="cover"
        onLoadStart={() => setIsImageLoading(true)}
        onLoadEnd={() => setIsImageLoading(false)}
        onError={() => setIsImageLoading(false)}
      />
      {isImageLoading ? (
        <View style={styles.imageLoading}>
          <ActivityIndicator color="#DC143C" size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    borderRadius: Radius.xl,
    ...Shadows.card,
  },
  cardLeyenda: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cardGradient: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: 3,
  },
  imageWrap: {
    flex: 1,
    borderRadius: Radius.xl - 3,
    overflow: 'hidden',
    backgroundColor: Colors.neutral,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
    left: -90,
    zIndex: 5,
  },
  shineGradient: {
    flex: 1,
  },
  crownBadge: {
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
    borderColor: '#FFD700',
    zIndex: 12,
    elevation: 12,
  },
  imageFull: {
    flex: 1,
    width: '100%',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  placeholderLetter: {
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: Spacing.lg,
    alignItems: 'flex-start',
    rowGap: 6,
    zIndex: 10,
    elevation: 10,
  },
  overlayName: {
    textAlign: 'left',
  },
  highlyRequestedBadge: {
    marginBottom: Spacing.xxs,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: 8,
  },
  premiumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 11,
    elevation: 11,
  },
  premiumChipIcon: {
    width: 18,
    height: 18,
  },
  premiumChipText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 11,
    elevation: 11,
  },
  distanceText: {
    textAlign: 'left',
    fontWeight: '600',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  goalPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  overlayBio: {
    textAlign: 'left',
  },
});
