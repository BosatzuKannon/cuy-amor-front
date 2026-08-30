import { AntDesign } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const LEYENDA_PRICE = '$24.999 COP';

const PERKS = [
  { icon: 'thunderbolt' as const, text: '3 Zumbidos gratis al día' },
  { icon: 'star' as const, text: '1 Cuyazo gratis al día' },
  { icon: 'safety' as const, text: 'Modo Cuy Ninja gratis y sin expiración' },
  { icon: 'search' as const, text: 'Perfil destacado en búsquedas' },
  { icon: 'gift' as const, text: '100 Cuy Coins de bienvenida' },
] as const;

type CheckoutResponse = {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
};

type VerifyResponse = {
  status: string;
  message: string;
  isLeyenda?: boolean;
  leyendaExpiresAt?: string;
  coinsBalance?: number;
  dailyZumbidosLeft?: number;
  dailyCuyazosLeft?: number;
  leyendaDaysLeft?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

function extractErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error
  ) {
    const msg = (error as { response?: { data?: { message?: string } } })
      .response?.data?.message;
    if (typeof msg === 'string' && msg.length > 0) {
      return msg;
    }
  }
  return fallback;
}

export function CuyLeyendaModal({ visible, onClose }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(false);
  const pendingReferenceRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  const isLeyenda = profile?.isLeyenda ?? false;
  const leyendaDaysLeft = profile?.leyendaDaysLeft ?? 0;
  const dailyZumbidosLeft = profile?.dailyZumbidosLeft ?? 0;
  const dailyCuyazosLeft = profile?.dailyCuyazosLeft ?? 0;

  useEffect(() => {
    if (!visible) {
      pendingReferenceRef.current = null;
      isProcessingRef.current = false;
      setLoading(false);
    }
  }, [visible]);

  async function verifyPayment(reference: string) {
    if (!session) {
      return;
    }
    try {
      const { data } = await api.post<VerifyResponse>(
        '/users/leyenda/verify',
        { reference },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      if (data.status === 'APPROVED') {
        if (data.isLeyenda) {
          useAuthStore.getState().updateProfile({
            isLeyenda: data.isLeyenda,
            leyendaExpiresAt: data.leyendaExpiresAt,
            coinsBalance: data.coinsBalance,
            dailyZumbidosLeft: data.dailyZumbidosLeft,
            dailyCuyazosLeft: data.dailyCuyazosLeft,
            leyendaDaysLeft: data.leyendaDaysLeft,
          });
        }

        onClose();
        toast.success(
          '¡Bienvenido Cuy Leyenda!',
          '100 Cuy Coins acreditados. Disfruta de tus beneficios.',
        );
      } else if (data.status === 'PENDING') {
        toast.info(
          'Pago en proceso',
          'Tu pago está siendo verificado. Te notificaremos cuando se confirme.',
        );
      } else {
        toast.error(
          'Pago no completado',
          data.message || 'El pago no fue aprobado.',
        );
      }
    } catch (error) {
      console.error('[CuyLeyendaModal] verify failed:', error);
      toast.error(
        'No se pudo verificar',
        extractErrorMessage(error, 'Error al verificar el pago'),
      );
    } finally {
      pendingReferenceRef.current = null;
      isProcessingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!visible || !session) {
      return;
    }

    let isRefreshing = false;

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState !== 'active' || isRefreshing) {
          return;
        }

        const pendingRef = pendingReferenceRef.current;
        if (!pendingRef) {
          return;
        }

        pendingReferenceRef.current = null;
        isRefreshing = true;
        try {
          await verifyPayment(pendingRef);
        } finally {
          isRefreshing = false;
        }
      },
    );

    return () => subscription.remove();
  }, [visible, session]);

  async function handleSubscribe() {
    if (!session || loading || isProcessingRef.current) {
      return;
    }
    setLoading(true);
    isProcessingRef.current = true;
    try {
      const { data } = await api.post<CheckoutResponse>(
        '/users/leyenda/checkout',
        {},
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      pendingReferenceRef.current = data.reference;

      const deepLink = Linking.createURL('/(tabs)/profile');
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
      console.error('[CuyLeyendaModal] checkout failed:', error);
      pendingReferenceRef.current = null;
      isProcessingRef.current = false;
      setLoading(false);
      toast.error(
        'No pudimos iniciar el pago',
        'Inténtalo de nuevo en unos momentos.',
      );
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
              <Image
                source={require('@/assets/images/iconvip.png')}
                style={styles.headerIcon}
                contentFit="contain"
              />
              <AppText variant="h2" color={Colors.gold} style={styles.headerTitle}>
                Cuy Leyenda
              </AppText>
              {isLeyenda && (
                <View style={styles.activePill}>
                  <AntDesign name="check-circle" size={12} color={Colors.success} />
                  <AppText variant="tag" color={Colors.success}>ACTIVO</AppText>
                </View>
              )}
            </View>

            {isLeyenda ? (
              <ActiveContent
                daysLeft={leyendaDaysLeft}
                zumbidosLeft={dailyZumbidosLeft}
                cuyazosLeft={dailyCuyazosLeft}
              />
            ) : (
              <InactiveContent loading={loading} onSubscribe={handleSubscribe} />
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}>
            <AppText variant="label" color={Colors.primary}>
              {isLeyenda ? 'Cerrar' : 'Ahora no'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ActiveContent({
  daysLeft,
  zumbidosLeft,
  cuyazosLeft,
}: {
  daysLeft: number;
  zumbidosLeft: number;
  cuyazosLeft: number;
}) {
  return (
    <View style={styles.body}>
      <View style={styles.daysBanner}>
        <AppText variant="h1" color={Colors.primary} style={styles.daysNumber}>
          {daysLeft}
        </AppText>
        <AppText variant="bodyMedium" color={Colors.textMuted}>
          días restantes
        </AppText>
      </View>

      <View style={styles.perksCard}>
        <AppText variant="tag" color={Colors.textMuted} style={styles.perksCardTitle}>
          TUS BENEFICIOS ACTIVOS
        </AppText>

        <View style={styles.perkRow}>
          <View style={[styles.perkIconWrap, styles.perkIconActive]}>
            <AntDesign name="thunderbolt" size={14} color={Colors.success} />
          </View>
          <View style={styles.perkBody}>
            <AppText variant="bodyMedium" color={Colors.text}>3 Zumbidos gratis al día</AppText>
            <AppText variant="caption" color={Colors.textMuted}>Quedan {zumbidosLeft} de 3</AppText>
          </View>
        </View>

        <View style={styles.perkDivider} />

        <View style={styles.perkRow}>
          <View style={[styles.perkIconWrap, styles.perkIconActive]}>
            <AntDesign name="star" size={14} color={Colors.success} />
          </View>
          <View style={styles.perkBody}>
            <AppText variant="bodyMedium" color={Colors.text}>1 Cuyazo gratis al día</AppText>
            <AppText variant="caption" color={Colors.textMuted}>Queda {cuyazosLeft} de 1</AppText>
          </View>
        </View>

        <View style={styles.perkDivider} />

        <PerkCheckRow text="Modo Cuy Ninja gratis y sin expiración" />
        <PerkCheckRow text="Perfil destacado en búsquedas" />
        <PerkCheckRow text="100 Cuy Coins de bienvenida" />
      </View>
    </View>
  );
}

function InactiveContent({
  loading,
  onSubscribe,
}: {
  loading: boolean;
  onSubscribe: () => void;
}) {
  return (
    <View style={styles.body}>
      <AppText
        variant="body"
        color={Colors.textMuted}
        style={styles.subtitle}>
        Desbloquea todos los beneficios premium
      </AppText>

      <View style={styles.perksCard}>
        <AppText variant="tag" color={Colors.textMuted} style={styles.perksCardTitle}>
          INCLUYE
        </AppText>
        {PERKS.map((perk) => (
          <View key={perk.text} style={styles.perkRow}>
            <View style={styles.perkIconWrap}>
              <AntDesign name={perk.icon} size={14} color={Colors.gold} />
            </View>
            <AppText variant="bodyMedium" color={Colors.text} style={styles.perkText}>
              {perk.text}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.priceBlock}>
        <AppText variant="h2" color={Colors.text} style={styles.priceAmount}>
          {LEYENDA_PRICE}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          por mes · incluye 100 Cuy Coins
        </AppText>
      </View>

      <AppButton
        label={loading ? 'Procesando...' : 'Suscribirme por $24.999'}
        variant="solid"
        color="primary"
        fullWidth
        loading={loading}
        disabled={loading}
        onPress={onSubscribe}
      />
    </View>
  );
}

function PerkCheckRow({ text }: { text: string }) {
  return (
    <View style={styles.perkRow}>
      <View style={[styles.perkIconWrap, styles.perkIconActive]}>
        <AntDesign name="check" size={12} color={Colors.success} />
      </View>
      <AppText variant="bodyMedium" color={Colors.text} style={styles.perkText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    ...Shadows.card,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 56,
    height: 56,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    textAlign: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  body: {
    gap: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
  },
  daysBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(220,20,60,0.06)',
    borderRadius: Radius.lg,
  },
  daysNumber: {
    textAlign: 'center',
  },
  perksCard: {
    backgroundColor: Colors.neutral,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  perksCardTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  perkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  perkIconActive: {
    backgroundColor: 'rgba(22,163,74,0.10)',
  },
  perkBody: {
    flex: 1,
    gap: 2,
  },
  perkText: {
    flex: 1,
    textAlign: 'left',
  },
  perkDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  priceBlock: {
    alignItems: 'center',
  },
  priceAmount: {
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
});
