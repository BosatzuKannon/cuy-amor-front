import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useCallback,
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isAxiosError } from 'axios';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ImageStyle,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { AiIcebreakerModal } from '@/components/ai-icebreaker-modal';
import { AiQuotaUpsellModal } from '@/components/ai-quota-upsell-modal';
import { GiftSelectorModal } from '@/components/gift-selector-modal';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { UserActionsModal } from '@/components/user-actions-modal';
import { supabase } from '@/lib/supabase';
import {
  extractAiErrorMessage,
  generateIcebreakers,
  isAiQuotaExhausted,
} from '@/services/ai-service';
import {
  formatVoiceDuration,
  MAX_VOICE_DURATION_MS,
  photoExceedsLimit,
  uploadChatPhoto,
  uploadChatVoiceNote,
} from '@/lib/chat-media';
import { toast } from '@/lib/toast';
import { titleCase } from '@/lib/text';
import {
  getMessages,
  markMatchRead,
  sendMessage,
  sendGift,
  sendZumbido,
  blockUser,
  reportUser,
  type ChatMessage,
  type GenderCode,
  type VirtualGiftSummary,
} from '@/services/matches-service';
import {
  getPublicProfile,
  type ExploreProfile,
} from '@/services/profile-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { selectGiftById, useGiftStore } from '@/store/useGiftStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const MESSAGE_AVATAR_SIZE = 28;
const FAB_VISIBLE_OFFSET = 200;
const READ_TICK_COLOR = '#53BDEB';
const ZUMBIDO_COOLDOWN_MS = 5000;
const ZUMBIDO_COST_IN_COINS = 5;

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
  }
  return fallback;
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

function startOfDayTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const HAS_UTC_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

function parseUtcDate(iso: string): Date {
  const normalized = HAS_UTC_OFFSET.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized);
}

function dayKey(iso: string): string {
  const date = parseUtcDate(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(iso: string): string {
  const date = parseUtcDate(iso);
  const diffDays = Math.round(
    (startOfDayTime(new Date()) - startOfDayTime(date)) / 86_400_000,
  );

  let label: string;
  if (diffDays === 0) {
    label = 'Hoy';
  } else if (diffDays === 1) {
    label = 'Ayer';
  } else if (diffDays < 7) {
    label = date.toLocaleDateString('es-CO', { weekday: 'long' });
  } else {
    label = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatLastSeen(iso: string): string {
  const date = parseUtcDate(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMinutes < 1) {
    return 'Últ. vez hace un momento';
  }
  if (diffMinutes < 60) {
    return `Últ. vez hace ${diffMinutes} min`;
  }
  const time = timeFormatter.format(date);
  const dayDiff = Math.round(
    (startOfDayTime(now) - startOfDayTime(date)) / 86_400_000,
  );
  if (dayDiff === 0) {
    return `Últ. vez hoy a las ${time}`;
  }
  if (dayDiff === 1) {
    return `Últ. vez ayer a las ${time}`;
  }
  const dateText = date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
  return `Últ. vez el ${dateText} a las ${time}`;
}

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatTime(iso: string): string {
  const date = parseUtcDate(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return timeFormatter.format(date);
}

type ChatListItem =
  | { type: 'message'; message: ChatMessage }
  | { type: 'date'; label: string; dateKey: string };

function buildChatItems(messages: ChatMessage[]): ChatListItem[] {
  const chronological = [...messages].sort(
    (a, b) =>
      parseUtcDate(a.createdAt).getTime() - parseUtcDate(b.createdAt).getTime(),
  );

  const items: ChatListItem[] = [];
  let lastDayKey: string | null = null;

  for (const message of chronological) {
    const key = dayKey(message.createdAt);
    if (key !== lastDayKey) {
      items.push({
        type: 'date',
        label: dayLabel(message.createdAt),
        dateKey: key,
      });
      lastDayKey = key;
    }
    items.push({ type: 'message', message });
  }

  return items.reverse();
}

type MessageStatusKind = 'sent' | 'delivered' | 'read';

function MessageStatus({ status }: { status: MessageStatusKind }) {
  const color = status === 'read' ? READ_TICK_COLOR : Colors.textMuted;
  if (status === 'sent') {
    return <MaterialIcons name="done" size={16} color={color} />;
  }
  return <MaterialIcons name="done-all" size={16} color={color} />;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSepWrap}>
      <View style={styles.dateSepPill}>
        <AppText variant="caption" color={Colors.white} style={styles.dateSepText}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

type ReplyTarget = { id: string; content: string; senderId: string };

function formatVoiceDurationLabel(ms: number | null | undefined): string {
  return formatVoiceDuration(ms);
}

function VoiceNoteBubble({
  url,
  durationMs,
  mine,
}: {
  url: string;
  durationMs: number | null | undefined;
  mine: boolean;
}) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);

  const tint = mine ? Colors.white : Colors.primary;
  const totalSeconds =
    status.duration > 0 ? status.duration : (durationMs ?? 0) / 1000;
  const currentSeconds = status.currentTime;
  const progress =
    totalSeconds > 0 ? Math.min(currentSeconds / totalSeconds, 1) : 0;

  function handleToggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || currentSeconds >= totalSeconds) {
      void player.seekTo(0);
    }
    player.play();
  }

  return (
    <Pressable onPress={handleToggle} style={styles.voiceRow}>
      <Ionicons
        name={status.playing ? 'pause' : 'play'}
        size={20}
        color={tint}
      />
      <View style={styles.voiceTrack}>
        <View
          style={[
            styles.voiceTrackFill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: tint,
            },
          ]}
        />
      </View>
      <AppText variant="caption" color={tint} style={styles.voiceDuration}>
        {formatVoiceDurationLabel(
          status.playing || currentSeconds > 0
            ? currentSeconds * 1000
            : durationMs,
        )}
      </AppText>
    </Pressable>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  mine,
  showAvatar,
  otherUserName,
  otherUserAvatarUrl,
  currentUserId,
  replyToMessage,
  highlighted,
  onReply,
  onPressReplyPreview,
  onOpenImage,
}: {
  message: ChatMessage;
  mine: boolean;
  showAvatar: boolean;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  currentUserId: string;
  replyToMessage: ChatMessage | null;
  highlighted: boolean;
  onReply: (message: ChatMessage) => void;
  onPressReplyPreview: (replyToId: ChatMessage['replyToId']) => void;
  onOpenImage: (url: string) => void;
}) {
  const metaColor = mine ? 'rgba(255,255,255,0.7)' : Colors.textMuted;

  if (message.isSystemMessage) {
    if (message.gift) {
      const giftLabel = mine
        ? `Has enviado ${message.gift.name}`
        : otherUserName
          ? `${titleCase(otherUserName)} ha enviado ${message.gift.name}`
          : `Ha enviado ${message.gift.name}`;
      return (
        <View style={styles.giftRow}>
          <View style={styles.giftCard}>
            <Image
              source={{ uri: message.gift.iconUrl }}
              style={styles.giftIcon}
              contentFit="contain"
            />
            <AppText variant="caption" style={styles.giftText}>
              ✨ {giftLabel} ✨
            </AppText>
          </View>
        </View>
      );
    }
    const systemLabel =
      message.content || 'Notificación del sistema';
    return (
      <View style={styles.systemMessageRow}>
        <AppText
          variant="caption"
          color={Colors.textMuted}
          style={styles.systemMessageText}>
          ✨ {systemLabel} ✨
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        mine ? styles.messageRowMine : styles.messageRowOther,
      ]}>
      {!mine &&
        (showAvatar ? (
          <Avatar
            url={otherUserAvatarUrl}
            size={MESSAGE_AVATAR_SIZE}
            style={styles.messageAvatar}
          />
        ) : (
          <View style={styles.messageSpacer} />
        ))}
      <Pressable
        onLongPress={() => onReply(message)}
        delayLongPress={350}
        style={styles.bubblePressable}>
        <View
          style={[
            styles.bubble,
            styles.bubbleShadow,
            mine ? styles.bubbleMine : styles.bubbleOther,
            highlighted &&
              (mine ? styles.bubbleMineHighlighted : styles.bubbleOtherHighlighted),
          ]}>
          {replyToMessage && (
            <Pressable
              onPress={() => onPressReplyPreview(message.replyToId)}
              style={({ pressed }) => [
                styles.replyPreview,
                mine ? styles.replyPreviewMine : styles.replyPreviewOther,
                pressed && styles.replyPreviewPressed,
              ]}>
              <View
                style={[
                  styles.replyPreviewAccent,
                  mine
                    ? styles.replyPreviewAccentMine
                    : styles.replyPreviewAccentOther,
                ]}
              />
              <View style={styles.replyPreviewBody}>
                <AppText
                  variant="caption"
                  color={mine ? Colors.white : Colors.primary}
                  numberOfLines={1}
                  style={styles.replyPreviewName}>
                  {replyToMessage.senderId === currentUserId
                    ? 'Tú'
                    : otherUserName
                      ? titleCase(otherUserName)
                      : 'Mensaje'}
                </AppText>
                <AppText
                  variant="caption"
                  color={mine ? 'rgba(255,255,255,0.75)' : Colors.textMuted}
                  numberOfLines={1}
                  style={styles.replyPreviewSnippet}>
                  {replyToMessage.content}
                </AppText>
              </View>
            </Pressable>
          )}
          {message.type === 'IMAGE' && message.mediaUrl ? (
            <Pressable
              onPress={() => onOpenImage(message.mediaUrl as string)}
              style={styles.imageBubbleWrap}>
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.bubbleImage}
                contentFit="cover"
              />
            </Pressable>
          ) : message.type === 'AUDIO' && message.mediaUrl ? (
            <VoiceNoteBubble
              url={message.mediaUrl}
              durationMs={message.mediaDurationMs}
              mine={mine}
            />
          ) : (
            <AppText
              variant="body"
              color={mine ? Colors.white : '#000000'}
              style={styles.bubbleText}>
              {message.content}
            </AppText>
          )}
          <View style={styles.bubbleMeta}>
            <AppText
              variant="caption"
              color={metaColor}
              style={styles.bubbleTime}>
              {formatTime(message.createdAt)}
            </AppText>
            <Pressable
              onPress={() => onReply(message)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.replyButton,
                pressed && styles.replyButtonPressed,
              ]}>
              <MaterialIcons name="reply" size={13} color={metaColor} />
            </Pressable>
            {mine && (
              <MessageStatus status={message.isRead ? 'read' : 'delivered'} />
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    id: string;
    otherUserId?: string;
    otherUserName?: string;
    otherUserAvatarUrl?: string;
    otherUserGender?: GenderCode;
    otherUserLastSeen?: string;
    otherUserIsLeyenda?: string;
  }>();
  const matchId = params.id;
  const otherUserId = params.otherUserId ?? null;
  const otherUserName = params.otherUserName ?? '';
  const otherUserAvatarUrl = params.otherUserAvatarUrl || null;
  const otherUserGender = params.otherUserGender ?? 'OTHER';
  const otherUserLastSeen = params.otherUserLastSeen || null;
  const otherUserIsLeyenda = (params.otherUserIsLeyenda ?? 'false') === 'true';

  const matches = useChatStore((state) => state.matches);

  const hydrated = useMemo(() => {
    if (!matchId) {
      return null;
    }
    return matches.find((match) => match.id === matchId)?.otherUser ?? null;
  }, [matches, matchId]);

  const missingHeaderDetails =
    !params.otherUserAvatarUrl && !params.otherUserName;
  const [hydratingUser, setHydratingUser] = useState(false);

  const resolvedOtherUserId = otherUserId ?? hydrated?.id ?? null;
  const resolvedOtherUserName =
    otherUserName || hydrated?.firstName || '';
  const resolvedOtherUserAvatarUrl =
    (otherUserAvatarUrl || hydrated?.avatarUrl) ?? null;
  const resolvedOtherUserGender =
    (params.otherUserGender as GenderCode) || hydrated?.gender || 'OTHER';
  const resolvedOtherUserLastSeen =
    otherUserLastSeen || hydrated?.lastSeen || null;
  const resolvedOtherUserIsLeyenda =
    otherUserIsLeyenda || Boolean(hydrated?.isLeyenda);

  const session = useAuthStore((state) => state.session);
  const supabaseToken = useAuthStore((state) => state.supabaseToken);
  const profile = useAuthStore((state) => state.profile);
  const dailyZumbidosLeft = profile?.dailyZumbidosLeft ?? 0;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [showFab, setShowFab] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [zumbidoCooldown, setZumbidoCooldown] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [showUserActions, setShowUserActions] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [fullProfile, setFullProfile] = useState<ExploreProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAiUpsell, setShowAiUpsell] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 200);
  const recordSeconds = Math.round(recorderState.durationMillis / 1000);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatUser: ExploreProfile | null = useMemo(
    () =>
      resolvedOtherUserId
        ? {
            id: resolvedOtherUserId,
            firstName: resolvedOtherUserName || 'Match',
            birthDate: null,
            bio: null,
            gender: resolvedOtherUserGender,
            isLeyenda: resolvedOtherUserIsLeyenda,
            photo: resolvedOtherUserAvatarUrl
              ? { id: 'chat-avatar', url: resolvedOtherUserAvatarUrl }
              : null,
          }
        : null,
    [
      resolvedOtherUserId,
      resolvedOtherUserName,
      resolvedOtherUserGender,
      resolvedOtherUserAvatarUrl,
      resolvedOtherUserIsLeyenda,
    ],
  );

  const openProfile = useCallback(() => {
    setIsProfileVisible(true);
    if (!resolvedOtherUserId || !session) {
      return;
    }
    setProfileLoading(true);
    getPublicProfile(resolvedOtherUserId, session)
      .then((profile) => setFullProfile(profile))
      .catch(() => {
        setFullProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [resolvedOtherUserId, session]);

  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const zumbidoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    void useGiftStore.getState().ensureGifts(session);
  }, [session]);

  useEffect(() => {
    return () => {
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (zumbidoTimeoutRef.current) {
        clearTimeout(zumbidoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session || !matchId) {
      return;
    }
    let active = true;
    getMessages(session, matchId)
      .then((data) => {
        if (active) {
          setMessages(data);
        }
      })
      .catch((error) => {
        console.error('[chat] fetch failed:', error);
        if (active) {
          toast.error(
            'No se pudieron cargar los mensajes',
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
  }, [session, matchId]);

  useEffect(() => {
    if (!session || !matchId || !supabaseToken) {
      return;
    }
    supabase.realtime.setAuth(supabaseToken);
    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload) => {
          if (payload.new?.matchId !== matchId) {
            return;
          }
          const newMessage = payload.new as unknown as ChatMessage;
          if (!newMessage?.id || newMessage.senderId === session.user.id) {
            return;
          }
          let incomingMessage = newMessage;
          if (newMessage.isSystemMessage && newMessage.giftId) {
            const foundGift = selectGiftById(
              useGiftStore.getState(),
              newMessage.giftId,
            );
            incomingMessage = { ...newMessage, gift: foundGift };
          }
          setMessages((prev) =>
            prev.some((m) => m.id === newMessage.id)
              ? prev
              : [...prev, incomingMessage],
          );
          void markMatchRead(session, matchId).catch((error) => {
            console.error('[chat] mark-read failed:', error);
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Message' },
        (payload) => {
          if (!payload.new?.id || payload.new?.matchId !== matchId) {
            return;
          }
          const updated = payload.new as unknown as ChatMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id ? { ...m, ...updated } : m,
            ),
          );
        },
      )
      .subscribe((status, err) => {
        console.log('Realtime Status:', status);
        if (err) console.error('Realtime Error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, matchId, supabaseToken]);

  useEffect(() => {
    if (!session || !matchId || !resolvedOtherUserId) {
      return;
    }

    const presenceChannel = supabase.channel(`presence:${matchId}`, {
      config: { presence: { key: session.user.id } },
    });

    const currentUserId = session.user.id;

    const syncPresence = () => {
      const presenceState = presenceChannel.presenceState() as Record<
        string,
        { user_id?: string }[]
      >;
      const isOnline = Object.values(presenceState).some((presences) =>
        presences.some((presence) => presence.user_id === resolvedOtherUserId),
      );
      setIsRecipientOnline(isOnline);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void presenceChannel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [session, matchId, resolvedOtherUserId]);

  useEffect(() => {
    if (session && matchId && !loading) {
      void useChatStore.getState().fetchMatches();
    }
  }, [session, matchId, loading]);

  useEffect(() => {
    if (!missingHeaderDetails || !session || !matchId) {
      setHydratingUser(false);
      return;
    }

    if (!hydrated) {
      setHydratingUser(true);
      void useChatStore
        .getState()
        .fetchMatches()
        .finally(() => setHydratingUser(false));
      return;
    }

    setHydratingUser(false);
  }, [missingHeaderDetails, hydrated, session, matchId]);

  const chatItems = useMemo(() => buildChatItems(messages), [messages]);

  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  useEffect(() => {
    if (!loading && chatItems.length > 0 && atBottomRef.current) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [loading, chatItems.length]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const atBottom = event.nativeEvent.contentOffset.y <= FAB_VISIBLE_OFFSET;
      atBottomRef.current = atBottom;
      setShowFab((prev) => {
        const next = !atBottom;
        return prev === next ? prev : next;
      });
    },
    [],
  );

  const scrollToLatest = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = chatItems.findIndex(
        (chatItem) =>
          chatItem.type === 'message' && chatItem.message.id === messageId,
      );
      if (index < 0) {
        return;
      }
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setHighlightedId(messageId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedId(null);
      }, 1000);
    },
    [chatItems],
  );

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
    });
  }, []);

  const handleJumpToReply = useCallback(
    (replyToId: ChatMessage['replyToId']) => {
      if (!replyToId) {
        return;
      }
      scrollToMessage(replyToId);
    },
    [scrollToMessage],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }, []);

  const handleBlockUser = useCallback(async () => {
    if (!session || !resolvedOtherUserId) {
      return;
    }
    setShowUserActions(false);
    try {
      await blockUser(session, resolvedOtherUserId);
      toast.success(
        'Usuario bloqueado',
        'Se eliminó el match y ya no podrán contactarse.',
      );
      handleBack();
    } catch (error) {
      console.error('[chat] block failed:', error);
      toast.error(
        extractApiErrorMessage(error, 'No se pudo bloquear al usuario'),
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    }
  }, [session, resolvedOtherUserId, handleBack]);

  const handleReportUser = useCallback(
    async (reason: string) => {
      if (!session || !resolvedOtherUserId) {
        return;
      }
      setShowUserActions(false);
      try {
        await reportUser(session, resolvedOtherUserId, reason);
        toast.success(
          'Reporte enviado',
          'Gracias por ayudarnos a mantener Cuy Amor seguro.',
        );
        handleBack();
      } catch (error) {
        console.error('[chat] report failed:', error);
        toast.error(
          extractApiErrorMessage(error, 'No se pudo enviar el reporte'),
          'Revisa tu conexión e inténtalo de nuevo.',
        );
      }
    },
    [session, resolvedOtherUserId, handleBack],
  );

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || !session || !matchId) {
      return;
    }
    const replyToId = replyTo?.id;
    setReplyTo(null);
    setSending(true);
    try {
      const message = await sendMessage(session, matchId, text, replyToId);
      setMessages((prev) => [...prev, message]);
      setInput('');
    } catch (error) {
      console.error('[chat] send failed:', error);
      toast.error(
        'No se pudo enviar el mensaje',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSending(false);
    }
  }

  async function handleAiIcebreaker() {
    if (!session || !matchId || aiLoading) {
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateIcebreakers(session, matchId);
      useAuthStore.getState().updateProfile({ dailyAiLeft: result.aiLeft });
      if (result.suggestions.length === 0) {
        toast.info('Sin ideas', 'La IA no generó sugerencias. Intenta de nuevo.');
        return;
      }
      setAiSuggestions(result.suggestions);
      setShowAiModal(true);
    } catch (error) {
      if (isAiQuotaExhausted(error)) {
        setShowAiUpsell(true);
        return;
      }
      console.error('[chat] ai icebreaker failed:', error);
      toast.error(
        'La IA no está disponible',
        extractAiErrorMessage(error, 'Intenta de nuevo en un momento.'),
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleSelectAiSuggestion(suggestion: string) {
    setInput(suggestion);
    setShowAiModal(false);
  }

  async function handlePickPhoto() {
    if (!session || !matchId || uploadingMedia) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(
        'Permiso de galería necesario',
        'Activa el acceso a tus fotos para enviar imágenes.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (photoExceedsLimit(asset)) {
      toast.error(
        'Imagen demasiado grande',
        'La foto no puede superar los 2 MB.',
      );
      return;
    }

    const replyToId = replyTo?.id;
    setReplyTo(null);
    setUploadingMedia(true);
    try {
      const mediaUrl = await uploadChatPhoto(session, matchId, asset);
      const message = await sendMessage(session, matchId, '📷 Foto', replyToId, {
        type: 'IMAGE',
        mediaUrl,
      });
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
    } catch (error) {
      console.error('[chat] photo send failed:', error);
      toast.error(
        'No se pudo enviar la foto',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setUploadingMedia(false);
    }
  }

  async function startRecording() {
    if (!session || !matchId || uploadingMedia || isRecording) {
      return;
    }
    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.error(
          'Permiso de micrófono necesario',
          'Activa el acceso al micrófono para enviar notas de voz.',
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
      }
      recordTimeoutRef.current = setTimeout(() => {
        void stopRecordingAndSend();
      }, MAX_VOICE_DURATION_MS);
    } catch (error) {
      console.error('[chat] start recording failed:', error);
      toast.error(
        'No se pudo iniciar la grabación',
        'Revisa el permiso del micrófono e inténtalo de nuevo.',
      );
    }
  }

  async function stopRecordingAndSend() {
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    if (!session || !matchId) {
      return;
    }

    const durationMs = Math.min(
      recorderState.durationMillis || recordSeconds * 1000,
      MAX_VOICE_DURATION_MS,
    );

    setIsRecording(false);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri || durationMs < 500) {
        return;
      }
      setUploadingMedia(true);
      const replyToId = replyTo?.id;
      setReplyTo(null);
      const mediaUrl = await uploadChatVoiceNote(session, matchId, uri);
      const message = await sendMessage(
        session,
        matchId,
        `🎤 Nota de voz (${Math.max(1, Math.round(durationMs / 1000))}s)`,
        replyToId,
        { type: 'AUDIO', mediaUrl, mediaDurationMs: durationMs },
      );
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
    } catch (error) {
      console.error('[chat] voice send failed:', error);
      toast.error(
        'No se pudo enviar la nota de voz',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setUploadingMedia(false);
    }
  }

  async function cancelRecording() {
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    setIsRecording(false);
    try {
      await audioRecorder.stop();
    } catch {
      // ignore
    }
  }

  const handleSendZumbido = useCallback(async () => {
    if (!session || !matchId || zumbidoCooldown) {
      return;
    }
    const dailyZumbidosLeft = profile?.dailyZumbidosLeft ?? 0;
    const isFree = dailyZumbidosLeft > 0;

    setZumbidoCooldown(true);
    try {
      const message = await sendZumbido(session, matchId);
      if (isFree) {
        useAuthStore.getState().updateProfile({
          dailyZumbidosLeft: dailyZumbidosLeft - 1,
        });
        toast.success('¡Zumbido enviado!', 'Gratis · Zumbido del día');
      } else {
        const currentBalance =
          useAuthStore.getState().profile?.coinsBalance ?? 0;
        useAuthStore
          .getState()
          .setCoinsBalance(currentBalance - ZUMBIDO_COST_IN_COINS);
        toast.success('¡Zumbido enviado!', '-5 Cuy Coins');
      }
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
    } catch (error) {
      console.error('[chat] zumbido failed:', error);
      toast.error(
        extractApiErrorMessage(error, 'No se pudo enviar el zumbido'),
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      if (zumbidoTimeoutRef.current) {
        clearTimeout(zumbidoTimeoutRef.current);
      }
      zumbidoTimeoutRef.current = setTimeout(() => {
        setZumbidoCooldown(false);
      }, ZUMBIDO_COOLDOWN_MS);
    }
  }, [session, matchId, zumbidoCooldown, profile]);

  const openGiftModal = useCallback(() => {
    setShowGiftModal(true);
    if (!session) {
      return;
    }
    void useGiftStore
      .getState()
      .ensureGifts(session)
      .then((loaded) => {
        if (!loaded) {
          toast.error(
            'No se pudieron cargar los regalos',
            'Revisa tu conexión e inténtalo de nuevo.',
          );
        }
      });
  }, [session]);

  const handleGiftPress = useCallback(
    async (gift: VirtualGiftSummary) => {
      if (!session || !matchId || sendingGiftId) {
        return;
      }
      const currentBalance =
        useAuthStore.getState().profile?.coinsBalance ?? 0;
      if (currentBalance < gift.coinCost) {
        toast.error(
          'No tienes suficientes Cuy Coins',
          'Recarga tu monedero e inténtalo de nuevo.',
        );
        return;
      }
      setSendingGiftId(gift.id);
      try {
        const message = await sendGift(session, matchId, gift.id);
        useAuthStore.getState().setCoinsBalance(currentBalance - gift.coinCost);
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message],
        );
        setShowGiftModal(false);
        toast.success('¡Regalo enviado!', `-${gift.coinCost} Cuy Coins`);
      } catch (error) {
        console.error('[chat] gift failed:', error);
        toast.error(
          extractApiErrorMessage(error, 'No se pudo enviar el regalo'),
          'Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        setSendingGiftId(null);
      }
    },
    [session, matchId, sendingGiftId],
  );

  const keyExtractor = useCallback(
    (item: ChatListItem) =>
      item.type === 'date' ? `date-${item.dateKey}` : item.message.id,
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ChatListItem>) => {
      if (item.type === 'date') {
        return <DateSeparator label={item.label} />;
      }

      const mine = item.message.senderId === session?.user.id;
      const prev = index > 0 ? chatItems[index - 1] : null;
      const showAvatar =
        !mine &&
        (prev?.type !== 'message' ||
          prev.message.senderId !== item.message.senderId);
      const replyToMessage = item.message.replyToId
        ? messageById.get(item.message.replyToId) ?? null
        : null;

      return (
        <MessageBubble
          message={item.message}
          mine={mine}
          showAvatar={showAvatar}
          otherUserName={resolvedOtherUserName}
          otherUserAvatarUrl={resolvedOtherUserAvatarUrl}
          currentUserId={session?.user.id ?? ''}
          replyToMessage={replyToMessage}
          highlighted={highlightedId === item.message.id}
          onReply={handleReply}
          onPressReplyPreview={handleJumpToReply}
          onOpenImage={setViewerImageUrl}
        />
      );
    },
    [
      session,
      chatItems,
      resolvedOtherUserAvatarUrl,
      resolvedOtherUserName,
      messageById,
      highlightedId,
      handleJumpToReply,
      handleReply,
    ],
  );

  const sendDisabled = sending || input.trim().length === 0;

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View
        style={styles.topBar}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
          <Pressable
            onPress={openProfile}
            hitSlop={4}
            style={({ pressed }) => [
              styles.headerPressable,
              pressed && styles.pressed,
            ]}>
            <LinearGradient
              colors={avatarGradientFor(resolvedOtherUserGender).colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerAvatarWrap}>
              <Avatar
                url={resolvedOtherUserAvatarUrl}
                size={30}
                style={styles.headerAvatar}
              />
            </LinearGradient>
            <View style={styles.headerCenter}>
              {hydratingUser ? (
                <View style={styles.headerLoading}>
                  <ActivityIndicator color={Colors.white} size="small" />
                  <AppText
                    variant="caption"
                    color={Colors.white}
                    style={styles.onlineStatus}>
                    Cargando...
                  </AppText>
                </View>
              ) : (
                <>
                <AppText
                  variant="h3"
                  color={Colors.white}
                  numberOfLines={1}
                  style={styles.headerName}>
                  {resolvedOtherUserName ? titleCase(resolvedOtherUserName) : 'Conversación'}
                </AppText>
                {isRecipientOnline ? (
                  <AppText
                    variant="caption"
                    color={Colors.online}
                    style={styles.onlineStatus}>
                    En línea
                  </AppText>
                ) : resolvedOtherUserLastSeen ? (
                  <AppText
                    variant="caption"
                    color={Colors.white}
                    style={styles.onlineStatus}>
                    {formatLastSeen(resolvedOtherUserLastSeen)}
                  </AppText>
                ) : null}
                </>
              )}
            </View>
          </Pressable>
          {resolvedOtherUserId ? (
            <Pressable
              onPress={() => void handleAiIcebreaker()}
              disabled={aiLoading}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Sugerencias con IA"
              style={({ pressed }) => [
                styles.headerAiButton,
                pressed && styles.pressed,
                aiLoading && styles.headerAiButtonDisabled,
              ]}>
              {aiLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <AppText variant="body" color={Colors.white} style={styles.headerAiText}>
                  ✨
                </AppText>
              )}
            </Pressable>
          ) : null}
          {resolvedOtherUserId ? (
            <Pressable
              onPress={() => setShowUserActions(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Más opciones"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}>
              <Ionicons
                name="ellipsis-vertical"
                size={22}
                color={Colors.white}
              />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={
            Platform.OS === 'ios' ? insets.top + headerHeight : headerHeight
          }>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.white} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <AppText variant="h3" color={Colors.white} style={styles.emptyTitle}>
                ¡Es un Match! 🎉
              </AppText>
              <AppText variant="caption" color={Colors.white} style={styles.emptyHint}>
                {resolvedOtherUserName
                  ? `Saluda a ${titleCase(resolvedOtherUserName)} para empezar la conversación.`
                  : 'Saluda a tu match para empezar la conversación.'}
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.listArea}>
            <FlatList
              ref={listRef}
              data={chatItems}
              inverted
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              initialNumToRender={20}
            />
            {showFab && (
              <Pressable
                onPress={scrollToLatest}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.fab,
                  pressed && styles.fabPressed,
                ]}>
                <AntDesign name="down" size={18} color={Colors.white} />
              </Pressable>
            )}
          </View>
        )}

        {replyTo && (
          <View style={styles.replyBanner}>
            <View style={styles.replyAccent} />
            <View style={styles.replyBody}>
              <AppText
                variant="caption"
                color={Colors.white}
                numberOfLines={1}
                style={styles.replyName}>
                {replyTo.senderId === session?.user.id
                  ? 'Tú'
                  : resolvedOtherUserName
                    ? titleCase(resolvedOtherUserName)
                    : 'Respuesta'}
              </AppText>
              <AppText
                variant="caption"
                color="rgba(255,255,255,0.8)"
                numberOfLines={1}
                style={styles.replyText}>
                {replyTo.content}
              </AppText>
            </View>
            <Pressable
              onPress={() => setReplyTo(null)}
              hitSlop={10}
              style={styles.replyCancel}>
              <AntDesign name="close" size={16} color={Colors.white} />
            </Pressable>
          </View>
        )}

        {isRecording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <AppText variant="bodyMedium" color={Colors.white} style={styles.recordingText}>
              Grabando… {Math.min(recordSeconds, 10)}s / 10s
            </AppText>
            <Pressable
              onPress={() => void cancelRecording()}
              hitSlop={8}
              style={styles.recordingCancel}>
              <AntDesign name="close" size={18} color={Colors.white} />
            </Pressable>
            <Pressable
              onPress={() => void stopRecordingAndSend()}
              hitSlop={8}
              style={styles.recordingSend}>
              <AntDesign name="arrow-up" size={18} color={Colors.white} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.giftStrip}>
              <Pressable
                onPress={() => void handleSendZumbido()}
                disabled={zumbidoCooldown}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.stripButton,
                  pressed && styles.stripButtonPressed,
                  zumbidoCooldown && styles.stripButtonDisabled,
                ]}>
                <Image
                  source={require('@/assets/images/zumbidoo.png')}
                  style={styles.stripIcon}
                  contentFit="contain"
                />
                {dailyZumbidosLeft > 0 ? (
                  <View style={styles.stripFreeDot} />
                ) : null}
              </Pressable>
              <Pressable
                onPress={openGiftModal}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.stripButton,
                  pressed && styles.stripButtonPressed,
                ]}>
                <AntDesign name="gift" size={22} color={Colors.primary} />
              </Pressable>
            </View>
            <View style={styles.inputWrap}>
              <View style={styles.inputFieldWrap}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Escribe un mensaje..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  style={styles.input}
                />
                <Pressable
                  onPress={() => void handlePickPhoto()}
                  disabled={uploadingMedia}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.inputIconButton,
                    pressed && styles.actionButtonPressed,
                    uploadingMedia && styles.actionButtonDisabled,
                  ]}>
                  <AntDesign name="picture" size={20} color={Colors.primary} />
                </Pressable>
              </View>
              <Pressable
                onLongPress={() => void startRecording()}
                delayLongPress={200}
                disabled={uploadingMedia}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                  uploadingMedia && styles.actionButtonDisabled,
                ]}>
                <MaterialIcons name="mic" size={24} color={Colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => void handleSend()}
                disabled={sendDisabled}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.sendButton,
                  sendDisabled && styles.sendButtonDisabled,
                  { transform: [{ scale: pressed && !sendDisabled ? 0.9 : 1 }] },
                ]}>
                <AntDesign name="arrow-up" size={20} color={Colors.white} />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {viewerImageUrl ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setViewerImageUrl(null)}>
          <Pressable
            style={styles.imageViewerOverlay}
            onPress={() => setViewerImageUrl(null)}>
            <Image
              source={{ uri: viewerImageUrl }}
              style={styles.imageViewerImage}
              contentFit="contain"
            />
            <Pressable
              onPress={() => setViewerImageUrl(null)}
              hitSlop={12}
              style={styles.imageViewerClose}>
              <AntDesign name="close" size={22} color={Colors.white} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <GiftSelectorModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        sendingGiftId={sendingGiftId}
        onGiftPress={(gift) => void handleGiftPress(gift)}
      />

      <PublicProfileModal
        visible={isProfileVisible}
        loading={profileLoading}
        onClose={() => {
          setIsProfileVisible(false);
          setProfileLoading(false);
        }}
        profile={fullProfile ?? chatUser}
        showActions={false}
        onUserBlocked={handleBack}
      />

      <UserActionsModal
        visible={showUserActions}
        onClose={() => setShowUserActions(false)}
        userName={resolvedOtherUserName ? titleCase(resolvedOtherUserName) : 'este usuario'}
        onBlock={() => void handleBlockUser()}
        onReport={(reason) => void handleReportUser(reason)}
      />

      <AiIcebreakerModal
        visible={showAiModal}
        suggestions={aiSuggestions}
        onSelect={handleSelectAiSuggestion}
        onClose={() => setShowAiModal(false)}
      />

      <AiQuotaUpsellModal
        visible={showAiUpsell}
        onClose={() => setShowAiUpsell(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%',
  },
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  headerPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAiButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: Spacing.xs,
  },
  headerAiButtonDisabled: {
    opacity: 0.45,
  },
  headerAiText: {
    fontSize: 18,
  },
  headerAvatar: {
    width: 30,
    height: 30,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: Spacing.sm,
  },
  headerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerName: {
    textAlign: 'left',
  },
  onlineStatus: {
    textAlign: 'left',
    fontSize: 12,
    marginTop: 1,
  },
  headerSpacer: {
    width: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    textAlign: 'left',
  },
  emptyHint: {
    textAlign: 'left',
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  listArea: {
    flex: 1,
    width: '100%',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  dateSepWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dateSepPill: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  dateSepText: {
    textAlign: 'center',
    fontSize: 11,
  },
  systemMessageRow: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  systemMessageText: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 12,
  },
  giftRow: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  giftCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.45)',
  },
  giftIcon: {
    width: 88,
    height: 88,
  },
  giftText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: MESSAGE_AVATAR_SIZE,
    height: MESSAGE_AVATAR_SIZE,
    marginRight: Spacing.sm,
  },
  messageSpacer: {
    width: MESSAGE_AVATAR_SIZE,
    marginRight: Spacing.sm,
  },
  bubblePressable: {
    flexShrink: 1,
    maxWidth: '85%',
  },
  bubble: {
    minWidth: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  bubbleShadow: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    },
  }),
  bubbleMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  bubbleMineHighlighted: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  bubbleOtherHighlighted: {
    backgroundColor: '#FFE1E6',
  },
  replyPreview: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  replyPreviewMine: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  replyPreviewOther: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  replyPreviewPressed: {
    opacity: 0.6,
  },
  replyPreviewAccent: {
    width: 3,
    alignSelf: 'stretch',
  },
  replyPreviewAccentMine: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  replyPreviewAccentOther: {
    backgroundColor: Colors.primary,
  },
  replyPreviewBody: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 1,
  },
  replyPreviewName: {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: '600',
  },
  replyPreviewSnippet: {
    textAlign: 'left',
    fontSize: 12,
  },
  replyButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyButtonPressed: {
    opacity: 0.4,
    transform: [{ scale: 0.85 }],
  },
  bubbleText: {
    textAlign: 'left',
    fontSize: 15,
    lineHeight: 20,
  },
  imageBubbleWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 2,
  },
  bubbleImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 160,
    paddingVertical: 2,
  },
  voiceTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    overflow: 'hidden',
  },
  voiceTrackFill: {
    height: '100%',
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    minWidth: 34,
    textAlign: 'right',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  recordingText: {
    flex: 1,
  },
  recordingCancel: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  recordingSend: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  bubbleTime: {
    textAlign: 'left',
    fontSize: 10,
    flexShrink: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  replyAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
  },
  replyBody: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },
  replyName: {
    fontSize: 11,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
  },
  replyCancel: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  giftStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  stripButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    ...Shadows.button,
  },
  stripButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  stripButtonDisabled: {
    opacity: 0.45,
  },
  stripIcon: {
    width: 28,
    height: 28,
  },
  stripFreeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  inputFieldWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingLeft: Spacing.lg,
    paddingRight: 4,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 16,
  },
  inputIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    ...Shadows.button,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  zumbidoIcon: {
    width: 28,
    height: 28,
  },
  freeBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.success,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  freeBadgeText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});