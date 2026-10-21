import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Radius } from '@/theme/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const OFFSCREEN = SCREEN_WIDTH * 1.4;
const MAX_ROTATION = 12;

export type SwipeDirection = 'LIKE' | 'PASS';

type SwipeCardProps = {
  children: React.ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  onPress?: () => void;
  enabled?: boolean;
};

export function SwipeCard({
  children,
  onSwipe,
  onPress,
  enabled = true,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const finalizeSwipe = useCallback(
    (direction: SwipeDirection) => {
      onSwipe(direction);
    },
    [onSwipe],
  );

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-16, 16])
    .failOffsetY([-24, 24])
    .onUpdate((event) => {
      if (isAnimating.value) {
        return;
      }
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.25;
    })
    .onEnd((event) => {
      const projected = event.translationX + event.velocityX * 0.15;
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD || Math.abs(projected) > SWIPE_THRESHOLD) {
        const direction: SwipeDirection =
          event.translationX > 0 ? 'LIKE' : 'PASS';
        isAnimating.value = true;
        translateX.value = withTiming(
          direction === 'LIKE' ? OFFSCREEN : -OFFSCREEN,
          { duration: 220 },
          (finished) => {
            if (finished) {
              runOnJS(finalizeSwipe)(direction);
              translateX.value = 0;
              translateY.value = 0;
              isAnimating.value = false;
            }
          },
        );
      } else {
        translateX.value = withSpring(0, { damping: 16, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      }
    })
    .onFinalize(() => {
      if (
        !isAnimating.value &&
        Math.abs(translateX.value) > 1
      ) {
        translateX.value = withSpring(0, { damping: 16, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(enabled)
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (success && onPress) {
        runOnJS(onPress)();
      }
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION, 0, MAX_ROTATION],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {children}
        <Animated.View
          style={[styles.badge, styles.likeBadge, likeStyle]}
          pointerEvents="none">
          <LinearGradient
            colors={['#F472B6', '#DC143C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeInner}>
            <AppText variant="h3" color="#FFFFFF" style={styles.badgeText}>
              LIKE
            </AppText>
          </LinearGradient>
        </Animated.View>
        <Animated.View
          style={[styles.badge, styles.passBadge, passStyle]}
          pointerEvents="none">
          <LinearGradient
            colors={['#9CA3AF', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeInner}>
            <AppText variant="h3" color="#FFFFFF" style={styles.badgeText}>
              PASS
            </AppText>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: 24,
    zIndex: 20,
  },
  likeBadge: {
    left: 24,
    transform: [{ rotate: '-12deg' }],
  },
  passBadge: {
    right: 24,
    transform: [{ rotate: '12deg' }],
  },
  badgeInner: {
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 2,
  },
});
