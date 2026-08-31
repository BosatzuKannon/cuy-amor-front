import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { formatCop } from '@/lib/currency';
import { getWalletHistory, WalletHistoryEntry } from '@/services/wallet-service';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

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

const INCOME_TYPES = new Set([
  'REFERRAL_COMMISSION',
  'COIN_RECHARGE',
  'WELCOME_GIFT',
  'VIP_SUBSCRIPTION',
  'GIFT_RECEIVED',
]);
const EXPENSE_TYPES = new Set([
  'GIFT_SENT',
  'PRIORITY_MESSAGE',
  'BOOST_PURCHASE',
  'NINJA_ACTIVATED',
  'ZUMBIDO_SENT',
  'PAYOUT_REQUEST',
]);

const INCOME_COLOR = '#4CAF50';
const EXPENSE_COLOR = '#F44336';

function getTransactionConfig(
  type: string,
): { kind: 'income' | 'expense'; color: string; sign: '+' | '-' } {
  if (INCOME_TYPES.has(type)) {
    return { kind: 'income', color: INCOME_COLOR, sign: '+' };
  }
  if (EXPENSE_TYPES.has(type)) {
    return { kind: 'expense', color: EXPENSE_COLOR, sign: '-' };
  }
  return { kind: 'income', color: INCOME_COLOR, sign: '+' };
}

function getEntryIcon(entry: WalletHistoryEntry): React.ComponentProps<typeof AntDesign>['name'] {
  if (entry.type === 'PAYOUT_REQUEST') return 'export';
  if (entry.type === 'REFERRAL_COMMISSION') return 'team';
  if (entry.type === 'WELCOME_GIFT') return 'gift';
  if (entry.type === 'GIFT_RECEIVED') return 'gift';
  if (entry.type === 'COIN_RECHARGE') return 'shopping-cart';
  if (entry.type === 'VIP_SUBSCRIPTION') return 'star';
  if (entry.type === 'ZUMBIDO_SENT') return 'notification';
  if (entry.type === 'NINJA_ACTIVATED') return 'eye';
  return 'wallet';
}

const COIN_AMOUNT_REGEX = /\(([+-]?\d+)\s*monedas?\)/i;

function extractCoinAmount(description: string): number | null {
  const match = COIN_AMOUNT_REGEX.exec(description);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

function HistoryItem({
  entry,
  isCoinTab,
}: {
  entry: WalletHistoryEntry;
  isCoinTab: boolean;
}) {
  const config = getTransactionConfig(entry.type);

  const coinAmount = isCoinTab
    ? extractCoinAmount(entry.description ?? '')
    : null;
  const cleanDescription = (entry.description ?? '')
    .replace(COIN_AMOUNT_REGEX, '')
    .trim();

  const displayAmount = isCoinTab
    ? `${Math.abs(coinAmount ?? entry.amountInCents)}`
    : formatCop(Math.abs(entry.amountInCents));

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyIconWrap}>
        <AntDesign name={getEntryIcon(entry)} size={18} color={Colors.primary} />
      </View>
      <View style={styles.historyBody}>
        <AppText variant="bodyMedium" color={Colors.text} style={styles.historyDesc} numberOfLines={2}>
          {cleanDescription || 'Transacción'}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {dateFormatter.format(new Date(entry.createdAt))}
        </AppText>
      </View>
      <View style={styles.historyAmountRow}>
        <AppText
          variant="bodyMedium"
          color={config.color}
          style={styles.historyAmount}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {config.sign}{displayAmount}
        </AppText>
        {isCoinTab ? (
          <Image
            source={require('@/assets/images/coinn.png')}
            style={styles.coinIcon}
            contentFit="contain"
          />
        ) : null}
      </View>
    </View>
  );
}

export default function WalletHistoryScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.topBar, { paddingTop: insets.top + 0 }]}>
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
            renderItem={({ item }) => (
              <HistoryItem entry={item} isCoinTab={activeTab === 'CUY_COINS'} />
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
    marginHorizontal: Spacing.sm,
    gap: Spacing.xxs,
  },
  historyDesc: {
    textAlign: 'left',
  },
  historyAmount: {
    textAlign: 'right',
    fontWeight: '700',
    flexShrink: 1,
  },
  historyAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xxs,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(226, 114, 91, 0.15)',
    marginLeft: 52,
    marginVertical: Spacing.sm,
  },
});
