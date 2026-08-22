import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ageFromBirthDate, formatDistance } from '@/lib/profile-format';
import { titleCase } from '@/lib/text';
import type { ExploreProfile } from '@/services/profile-service';
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

function cardGradientFor(gender: ExploreProfile['gender']): CardGradient {
  if (gender && CARD_GRADIENTS[gender]) {
    return CARD_GRADIENTS[gender];
  }
  return CARD_GRADIENTS.OTHER;
}

type ExploreCardProps = {
  profile: ExploreProfile;
  onPress: () => void;
};

export function ExploreCard({ profile, onPress }: ExploreCardProps) {
  const gradient = cardGradientFor(profile.gender);
  const name = titleCase(profile.firstName ?? '');
  const age = ageFromBirthDate(profile.birthDate);
  const distanceLabel = formatDistance(profile.distance) ?? 'Cerca de ti';

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}>
        <Pressable
          style={styles.imageWrap}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil público de ${name}`}>
          {profile.photo ? (
            <Image
              source={{ uri: profile.photo.url }}
              style={styles.image}
              contentFit="cover"
            />
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

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          />

          <View style={styles.overlayContent}>
            <AppText
              variant="h2"
              color={Colors.white}
              style={styles.overlayName}>
              {name}
              {age !== null ? `, ${age}` : ''}
            </AppText>
            <View style={styles.distancePill}>
              <AntDesign name="environment" size={12} color={Colors.white} />
              <AppText
                variant="tag"
                color={Colors.white}
                style={styles.distanceText}>
                {distanceLabel}
              </AppText>
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
        </Pressable>
      </LinearGradient>
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
    zIndex: 10,
    elevation: 10,
  },
  overlayName: {
    textAlign: 'left',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
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
  overlayBio: {
    textAlign: 'left',
    marginTop: Spacing.sm,
  },
});
