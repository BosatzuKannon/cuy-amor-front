import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type CoinPackage = {
  id: string;
  name: string;
  coinsAmount: number;
  priceInCents: number;
  badge?: string | null;
};

type CheckoutResponse = {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
};

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function formatPrice(priceInCents: number): string {
  return copFormatter.format(priceInCents / 100);
}

function PackageCard({
  coinPackage,
  isCheckingOut,
  onBuy,
}: {
  coinPackage: CoinPackage;
  isCheckingOut: boolean;
  onBuy: (coinPackage: CoinPackage) => void;
}) {
  return (
    <View style={styles.packageCard}>
      {coinPackage.badge ? (
        <View style={styles.badgeChip}>
          <AppText
            variant="tag"
            color={Colors.text}
            style={styles.badgeText}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {coinPackage.badge}
          </AppText>
        </View>
      ) : null}

      <View style={styles.coinsRow}>
        <Image
          source={require('@/assets/images/coinn.png')}
          style={styles.coinIcon}
          contentFit="contain"
        />
        <AppText
          variant="h2"
          color={Colors.text}
          style={styles.coinsAmount}>
          {coinPackage.coinsAmount.toLocaleString('es-CO')}
        </AppText>
      </View>

      <AppText variant="caption" color={Colors.textMuted} style={styles.packageName}>
        {coinPackage.name}
      </AppText>

      <AppText variant="h3" color={Colors.primary} style={styles.packagePrice}>
        {formatPrice(coinPackage.priceInCents)}
      </AppText>

      <Pressable
        onPress={() => onBuy(coinPackage)}
        disabled={isCheckingOut}
        accessibilityRole="button"
        accessibilityLabel={`Comprar ${coinPackage.name}`}
        style={({ pressed }) => [
          styles.buyButton,
          isCheckingOut && styles.buyButtonDisabled,
          pressed && styles.buyButtonPressed,
        ]}>
        {isCheckingOut ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <AppText
            variant="label"
            color={Colors.white}
            style={styles.buyButtonText}>
            Comprar
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

export default function BuyCoinsScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      setLoading(true);
      try {
        const response = await api.get<CoinPackage[]>('/coin-packages');
        if (active) {
          setPackages(response.data);
          setHasError(false);
        }
      } catch (error) {
        console.error('[buy-coins] fetch failed:', error);
        if (active) {
          setHasError(true);
          toast.error(
            'No se pudieron cargar los paquetes',
            'Revisa tu conexión e inténtalo de nuevo.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPackages();
    return () => {
      active = false;
    };
  }, []);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }

  async function handleBuy(coinPackage: CoinPackage) {
    if (!session || checkoutLoadingId) {
      return;
    }

    setCheckoutLoadingId(coinPackage.id);
    try {
      const { data } = await api.post<CheckoutResponse>(
        '/transactions/checkout',
        { packageId: coinPackage.id },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const deepLink = Linking.createURL('/wallet/buy-coins');
      const redirectUrl =
        process.env.EXPO_PUBLIC_API_URL +
        '/transactions/return?url=' +
        encodeURIComponent(deepLink);

      const wompiUrl =
        'https://checkout.wompi.co/p/?public-key=' +
        process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY +
        '&currency=COP&amount-in-cents=' +
        data.amountInCents +
        '&reference=' +
        data.reference +
        '&signature:integrity=' +
        data.signature +
        '&redirect-url=' +
        encodeURIComponent(redirectUrl);

      await WebBrowser.openAuthSessionAsync(wompiUrl, deepLink);
    } catch (error) {
      console.error('[buy-coins] checkout failed:', error);
      toast.error(
        'No pudimos iniciar el pago',
        'Inténtalo de nuevo en unos momentos.',
      );
    } finally {
      setCheckoutLoadingId(null);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    let isRefreshing = false;

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState !== 'active' || isRefreshing) {
          return;
        }

        isRefreshing = true;
        try {
          const { data: balance } = await api.get<{
            coinsBalance?: number;
          }>('/users/me/balance', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (
            typeof balance.coinsBalance !== 'number' ||
            !Number.isFinite(balance.coinsBalance)
          ) {
            return;
          }

          const currentBalance =
            useAuthStore.getState().profile?.coinsBalance ?? 0;
          if (balance.coinsBalance > currentBalance) {
            useAuthStore
              .getState()
              .setCoinsBalance(balance.coinsBalance);
            toast.success(
              '¡Compra Exitosa!',
              'Tus Cuy Coins han sido acreditados a tu billetera.',
            );
            setCheckoutLoadingId(null);
          }
        } catch (error) {
          console.error('[buy-coins] balance refresh failed:', error);
        } finally {
          isRefreshing = false;
        }
      },
    );

    return () => subscription.remove();
  }, [session]);

  function handleRetry() {
    void (async () => {
      setLoading(true);
      try {
        const response = await api.get<CoinPackage[]>('/coin-packages');
        setPackages(response.data);
        setHasError(false);
      } catch (error) {
        console.error('[buy-coins] retry failed:', error);
        toast.error(
          'No se pudieron cargar los paquetes',
          'Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 0 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="storefront" size={32} color={Colors.white} />
          </View>
          <AppText variant="h2" color={Colors.white} style={styles.heroTitle}>
            Tienda de Cuy Coins
          </AppText>
          <AppText
            variant="body"
            color="rgba(255,255,255,0.9)"
            style={styles.heroSubtitle}>
            Recarga tus Cuy Coins para destacar tu perfil y conectar con más
            personas.
          </AppText>
        </View>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        ) : hasError ? (
          <View style={styles.centerWrap}>
            <AppText
              variant="body"
              color={Colors.white}
              style={styles.stateText}>
              No pudimos cargar la tienda en este momento.
            </AppText>
            <Pressable onPress={handleRetry} style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}>
              <AppText
                variant="bodyMedium"
                color={Colors.primary}
                style={styles.retryText}>
                Reintentar
              </AppText>
            </Pressable>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.centerWrap}>
            <AppText
              variant="body"
              color={Colors.white}
              style={styles.stateText}>
              No hay paquetes disponibles por ahora. Vuelve pronto.
            </AppText>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {packages.map((coinPackage) => (
              <PackageCard
                key={coinPackage.id}
                coinPackage={coinPackage}
                isCheckingOut={checkoutLoadingId === coinPackage.id}
                onBuy={(pkg) => void handleBuy(pkg)}
              />
            ))}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxs,
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
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: Spacing.lg,
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
  listWrap: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  packageCard: {
    width: '47.5%',
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: Spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: Spacing.sm,
  },
  badgeChip: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    zIndex: 5,
    elevation: 3,
    backgroundColor: Colors.gold,
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    maxWidth: '88%',
  },
  badgeText: {
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 9,
    lineHeight: 13,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  coinIcon: {
    width: 22,
    height: 22,
  },
  coinsAmount: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 30,
  },
  packageName: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    minHeight: 17,
    flexShrink: 1,
  },
  packagePrice: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  buyButton: {
    minWidth: '80%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  buyButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: Colors.white,
  },
  retryText: {
    textAlign: 'center',
    fontWeight: '700',
  },
});
