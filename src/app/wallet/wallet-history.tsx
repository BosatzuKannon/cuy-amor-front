import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { getWalletHistory, WalletHistoryEntry } from '@/services/wallet-service';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type Tab = 'REAL_MONEY' | 'CUY_COINS';

const TABS: { key: Tab; label: string }[] = [
  { key: 'REAL_MONEY', label: 'Dinero Real' },
  { key: 'CUY_COINS', label: 'Cuy Coins' },
];

function getEntryIcon(entry: WalletHistoryEntry): React.ComponentProps<typeof AntDesign>['name'] {
  if (entry.type === 'PAYOUT_REQUEST') return 'export';
  if (entry.description?.toLowerCase().includes('referid')) return 'team';
  if (entry.description?.toLowerCase().includes('bienvenida')) return 'gift';
  if (entry.description?.toLowerCase().includes('compra')) return 'shopping-cart';
  if (entry.description?.toLowerCase().includes('retiro')) return 'export';
  return 'wallet';
}

function HistoryItem({ entry }: { entry: WalletHistoryEntry }) {
  const isNegative =
    entry.type === 'TRANSACTION' &&
    !entry.description?.toLowerCase().includes('bienvenida') &&
    !entry.description?.toLowerCase().includes('referid') &&
    entry.amountInCents < 0;

  const displayAmount =
    entry.currencyType === 'CUY_COINS'
      ? `${Math.abs(entry.amountInCents)} Cuy Coins`
      : copFormatter.format(Math.abs(entry.amountInCents));

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyIconWrap}>
        <AntDesign name={getEntryIcon(entry)} size={18} color={Colors.primary} />
      </View>
      <View style={styles.historyBody}>
        <AppText variant="bodyMedium" color={Colors.text} style={styles.historyDesc} numberOfLines={2}>
          {entry.description || 'Transacción'}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {dateFormatter.format(new Date(entry.createdAt))}
        </AppText>
      </View>
      <AppText
        variant="bodyMedium"
        color={isNegative ? Colors.danger : Colors.success}
        style={styles.historyAmount}>
        {isNegative ? '-' : '+'}{displayAmount}
      </AppText>
    </View>
  );
}

export default function WalletHistoryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('REAL_MONEY');
  const [entries, setEntries] = useState<WalletHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHistory = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getWalletHistory({ currencyType: tab });
      setEntries(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory(activeTab);
  }, [activeTab, fetchHistory]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <AntDesign name="left" size={20} color={Colors.white} />
        </Pressable>
        <AppText variant="h3" color={Colors.white} style={styles.title}>
          Historial
        </AppText>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              pressed && styles.pressed,
            ]}>
            <AppText
              variant="bodyMedium"
              color={activeTab === tab.key ? Colors.white : 'rgba(255,255,255,0.7)'}
              style={styles.tabLabel}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <AppText variant="body" color={Colors.white} style={styles.stateText}>
            No pudimos cargar el historial.
          </AppText>
          <Pressable
            onPress={() => void fetchHistory(activeTab)}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <AppText variant="bodyMedium" color={Colors.primary} style={styles.retryText}>
              Reintentar
            </AppText>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerWrap}>
          <AntDesign name="clock-circle" size={48} color="rgba(255,255,255,0.4)" />
          <AppText variant="body" color="rgba(255,255,255,0.7)" style={styles.stateText}>
            No hay movimientos todavía.
          </AppText>
        </View>
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryItem entry={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: 70,
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
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  title: {
    textAlign: 'left',
    flexShrink: 1,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  tabLabel: {
    textAlign: 'center',
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    elevation: 0,
    shadowOpacity: 0,
  },
  listContent: {
    padding: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  historyBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  historyDesc: {
    textAlign: 'left',
  },
  historyAmount: {
    textAlign: 'right',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
});
