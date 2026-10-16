import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { ExploreProfile } from '@/services/profile-service';
import { Colors } from '@/theme/colors';

const RING_GRADIENTS: Record<string, { colors: readonly [string, string] }> = {
  FEMALE: { colors: ['#f9a8d4', '#a855f7'] },
  MALE: { colors: ['#40E0D0', '#007FFF'] },
  OTHER: { colors: ['#FFD700', '#16A34A'] },
};

function ringGradientFor(gender: ExploreProfile['gender']) {
  if (gender && RING_GRADIENTS[gender]) {
    return RING_GRADIENTS[gender];
  }
  return RING_GRADIENTS.OTHER;
}

type Props = {
  liker: ExploreProfile;
  size?: number;
  isLeyenda: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PretendienteAvatar({
  liker,
  size = 60,
  isLeyenda,
  onPress,
  style,
}: Props) {
  const gradient = ringGradientFor(liker.gender);
  const photoUrl = liker.photo?.url ?? liker.photos?.[0]?.url ?? null;
  const initial =
    (liker.firstName ?? '').trim().charAt(0).toUpperCase() || 'C';
  const ringSize = size + 6;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={
        isLeyenda
          ? `Ver perfil de ${liker.firstName ?? 'usuario'}`
          : 'Desbloquear pretendiente con Cuy Leyenda'
      }
      style={({ pressed }) => [style, pressed && styles.pressed]}>
      <LinearGradient
        colors={gradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.ring,
          { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
        ]}>
        <View
          style={[
            styles.inner,
            { width: size, height: size, borderRadius: size / 2 },
          ]}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: size, height: size }}
              contentFit="cover"
              blurRadius={isLeyenda ? 0 : 30}
            />
          ) : (
            <View style={[styles.placeholder, { width: size, height: size }]}>
              <AppText variant="h3" color={Colors.white}>
                {initial}
              </AppText>
            </View>
          )}
          {!isLeyenda ? (
            <View style={styles.lock} pointerEvents="none">
              <AntDesign
                name="lock"
                size={Math.round(size * 0.32)}
                color={Colors.white}
              />
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    overflow: 'hidden',
    backgroundColor: Colors.neutral,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.55)',
  },
  lock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
