import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import type { VirtualGiftSummary } from '@/services/matches-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useGiftStore } from '@/store/useGiftStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type GiftSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  sendingGiftId: string | null;
  onGiftPress: (gift: VirtualGiftSummary) => void;
};

const GiftCell = memo(function GiftCell({
  gift,
  disabled,
  onPress,
}: {
  gift: VirtualGiftSummary;
  disabled: boolean;
  onPress: (gift: VirtualGiftSummary) => void;
}) {
  const handlePress = useCallback(
    () => onPress(gift),
    [onPress, gift],
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cell,
        disabled && styles.cellDisabled,
        pressed && !disabled && styles.cellPressed,
      ]}>
      <Image
        source={{ uri: gift.iconUrl }}
        style={styles.cellIcon}
        contentFit="contain"
        recyclingKey={gift.id}
      />
      <AppText variant="caption" color={Colors.text} numberOfLines={1}>
        {gift.name}
      </AppText>
      <View style={styles.costRow}>
        <AntDesign name="star" size={11} color={Colors.gold} />
        <AppText variant="tag" color={Colors.gold}>
          {gift.coinCost}
        </AppText>
      </View>
    </Pressable>
  );
});

export function GiftSelectorModal({
  visible,
  onClose,
  sendingGiftId,
  onGiftPress,
}: GiftSelectorModalProps) {
  const insets = useSafeAreaInsets();
  const gifts = useGiftStore((state) => state.gifts);
  const loading = useGiftStore((state) => state.isLoading);
  const coinsBalance = useAuthStore(
    (state) => state.profile?.coinsBalance ?? 0,
  );
  const renderItem = useCallback(
    ({ item }: { item: VirtualGiftSummary }) => (
      <GiftCell
        gift={item}
        disabled={sendingGiftId !== null}
        onPress={onGiftPress}
      />
    ),
    [onGiftPress, sendingGiftId],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}
          onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <AppText variant="h3" color={Colors.text}>
              Envía un regalo
            </AppText>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <AntDesign name="close" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.balancePill}>
            <AntDesign name="star" size={13} color={Colors.gold} />
            <AppText variant="tag" color={Colors.text}>
              {coinsBalance} Cuy Coins disponibles
            </AppText>
          </View>

          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <AppText variant="caption" color={Colors.textMuted}>
                Cargando regalos...
              </AppText>
            </View>
          ) : !gifts || gifts.length === 0 ? (
            <View style={styles.stateWrap}>
              <AppText variant="caption" color={Colors.textMuted}>
                No hay regalos disponibles por ahora.
              </AppText>
            </View>
          ) : (
            <FlatList
              data={gifts}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={3}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.neutral,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    maxHeight: '75%',
    ...Shadows.card,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,27,31,0.06)',
  },
  balancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,215,0,0.18)',
  },
  gridContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  gridRow: {
    gap: Spacing.md,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.secondary,
    ...Shadows.card,
  },
  cellPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  cellDisabled: {
    opacity: 0.4,
  },
  cellIcon: {
    width: 64,
    height: 64,
    marginBottom: Spacing.xs,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stateWrap: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
