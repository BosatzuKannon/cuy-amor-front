import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { titleCase } from '@/lib/text';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { type ChatMatch, type GenderCode } from '@/services/matches-service';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

function openChat(match: ChatMatch) {
  router.push({
    pathname: '/chat/[id]',
    params: {
      id: match.id,
      otherUserId: match.otherUser.id,
      otherUserName: match.otherUser.firstName,
      otherUserAvatarUrl: match.otherUser.avatarUrl ?? '',
      otherUserGender: match.otherUser.gender ?? 'OTHER',
      otherUserLastSeen: match.otherUser.lastSeen ?? '',
    },
  });
}

const AVATAR_GRADIENTS: Record<string, { colors: readonly [string, string] }> = {
  FEMALE: { colors: ['#f9a8d4', '#a855f7'] },
  MALE: { colors: ['#40E0D0', '#007FFF'] },
  OTHER: { colors: ['#FFD700', '#16A34A'] },
};

function avatarGradientFor(
  gender: GenderCode | null,
): { colors: readonly [string, string] } {
  if (gender && AVATAR_GRADIENTS[gender]) {
    return AVATAR_GRADIENTS[gender];
  }
  return AVATAR_GRADIENTS.OTHER;
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

function MatchesSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.skeletonSectionTitle} />
      <View style={styles.skeletonAvatarRow}>
        <Skeleton style={styles.skeletonAvatar} />
        <Skeleton style={styles.skeletonAvatar} />
        <Skeleton style={styles.skeletonAvatar} />
      </View>
      <Skeleton style={styles.skeletonSectionTitle} />
      <Skeleton style={styles.skeletonRow} />
      <Skeleton style={styles.skeletonRow} />
      <Skeleton style={styles.skeletonRow} />
    </View>
  );
}

function Avatar({
  url,
  size,
  style,
}: {
  url: string | null;
  size: number;
  style?: StyleProp<ImageStyle>;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.avatarImage, { width: size, height: size }, style]}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size }, style]}>
      <AntDesign name="user" size={size * 0.42} color={Colors.white} />
    </View>
  );
}

function formatMessageTime(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) {
    return 'ahora';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'ayer';
  }
  if (days < 7) {
    return `${days}d`;
  }
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const matches = useChatStore((state) => state.matches);
  const loading = useChatStore((state) => state.loading);
  const fetchMatches = useChatStore((state) => state.fetchMatches);

  useFocusEffect(
    useCallback(() => {
      void fetchMatches();
    }, [fetchMatches]),
  );

  const newMatches = matches.filter((match) => match.lastMessage === null);
  const conversations = matches.filter((match) => match.lastMessage !== null);

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 30 },
        ]}
        showsVerticalScrollIndicator={false}>
        <AppText variant="h2" color={Colors.white} style={styles.title}>
          Mis Cuyes
        </AppText>

        {loading && matches.length === 0 ? (
          <MatchesSkeleton />
        ) : (
          <View style={styles.card}>
            <AppText variant="tag" color={Colors.textMuted} style={styles.sectionTitle}>
              Nuevos Matches
            </AppText>
            {newMatches.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newMatchesRow}>
                {newMatches.map((match) => (
                  <View key={match.id} style={styles.newMatchItem}>
                    <Pressable
                      onPress={() => openChat(match)}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.newMatchPressable,
                        pressed && styles.pressedAvatar,
                      ]}>
                      <LinearGradient
                        colors={avatarGradientFor(match.otherUser.gender).colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.newMatchAvatarWrap}>
                        <Avatar
                          url={match.otherUser.avatarUrl}
                          size={60}
                          style={styles.newMatchAvatar}
                        />
                      </LinearGradient>
                    </Pressable>
                    <AppText
                      variant="caption"
                      color={Colors.text}
                      numberOfLines={1}
                      style={styles.newMatchName}>
                      {titleCase(match.otherUser.firstName)}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <AppText variant="caption" color={Colors.textMuted} style={styles.emptyHint}>
                Aún no tienes matches nuevos.
              </AppText>
            )}

            <View style={styles.divider} />

            <AppText variant="tag" color={Colors.textMuted} style={styles.sectionTitle}>
              Conversaciones
            </AppText>
            {conversations.length > 0 ? (
              conversations.map((match) => {
                const lastMessage = match.lastMessage;
                if (!lastMessage) {
                  return null;
                }
                const isMine = lastMessage.senderId === session?.user.id;
                return (
                  <Pressable
                    key={match.id}
                    onPress={() => openChat(match)}
                    style={({ pressed }) => [
                      styles.conversationRow,
                      pressed && styles.conversationRowPressed,
                    ]}>
                    <Avatar
                      url={match.otherUser.avatarUrl}
                      size={48}
                      style={styles.conversationAvatar}
                    />
                    <View style={styles.conversationBody}>
                      <AppText
                        variant="bodyMedium"
                        color={Colors.text}
                        numberOfLines={1}
                        style={[
                          styles.conversationName,
                          match.hasUnread && styles.conversationNameUnread,
                        ]}>
                        {titleCase(match.otherUser.firstName)}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={match.hasUnread ? Colors.text : Colors.textMuted}
                        numberOfLines={1}
                        style={styles.conversationSnippet}>
                        {isMine ? `Tú: ${lastMessage.content}` : lastMessage.content}
                      </AppText>
                    </View>
                    <View style={styles.conversationSide}>
                      <AppText
                        variant="caption"
                        color={Colors.textMuted}
                        style={styles.conversationTime}>
                        {formatMessageTime(lastMessage.createdAt)}
                      </AppText>
                      {match.hasUnread ? <View style={styles.unreadDot} /> : null}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <AppText variant="caption" color={Colors.textMuted} style={styles.emptyHint}>
                Aún no tienes conversaciones.
              </AppText>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  title: {
    textAlign: 'left',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
  },
  sectionTitle: {
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  newMatchesRow: {
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  newMatchItem: {
    alignItems: 'center',
    width: 76,
    gap: Spacing.xs,
  },
  newMatchAvatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchPressable: {
    borderRadius: 33,
  },
  pressedAvatar: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  newMatchAvatar: {
    width: 60,
    height: 60,
  },
  newMatchName: {
    textAlign: 'left',
    alignSelf: 'stretch',
    maxWidth: 76,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  conversationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  conversationRowPressed: {
    opacity: 0.7,
  },
  conversationAvatar: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.neutral,
  },
  conversationBody: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.xxs,
  },
  conversationName: {
    textAlign: 'left',
    maxWidth: '100%',
  },
  conversationNameUnread: {
    fontWeight: '700',
  },
  conversationSnippet: {
    textAlign: 'left',
    maxWidth: '100%',
  },
  conversationSide: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  conversationTime: {
    textAlign: 'left',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  emptyHint: {
    textAlign: 'left',
    marginBottom: Spacing.sm,
  },
  skeleton: {
    backgroundColor: '#E6E8EB',
    borderRadius: Radius.md,
  },
  skeletonSectionTitle: {
    width: 140,
    height: 14,
    marginBottom: Spacing.md,
  },
  skeletonAvatarRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  skeletonAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
  },
  skeletonRow: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  avatarImage: {
    borderRadius: Radius.pill,
  },
  avatarPlaceholder: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.55)',
  },
});