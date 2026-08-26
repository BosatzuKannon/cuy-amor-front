import { AntDesign } from '@expo/vector-icons';
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

import { AppBackground } from '@/components/ui/app-background';
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
            numberOfLines={1}>
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

      <AppText variant="bodyMedium" color={Colors.text} style={styles.packageName}>
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
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <AppText
            variant="bodyMedium"
            color={Colors.primary}
            style={styles.buyButtonText}>
            Comprar
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

export default function BuyCoinsScreen() {
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
      <AppBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
          <AppText variant="h3" color={Colors.white} style={styles.title}>
            Tienda de Cuy Coins
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
    gap: Spacing.lg,
  },
  packageCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: Spacing.lg,
    elevation: 0,
    shadowOpacity: 0,
  },
  badgeChip: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    zIndex: 5,
    elevation: 3,
    backgroundColor: Colors.gold,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    maxWidth: '60%',
    ...Shadows.button,
  },
  badgeText: {
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  coinIcon: {
    width: 24,
    height: 24,
  },
  coinsAmount: {
    textAlign: 'left',
    fontWeight: '700',
  },
  packageName: {
    textAlign: 'left',
    marginBottom: Spacing.xs,
  },
  packagePrice: {
    textAlign: 'left',
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  buyButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 6,
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
