import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { isAdminEmail } from '@/lib/admin';
import { titleCase } from '@/lib/text';
import { toast } from '@/lib/toast';
import {
  approvePayout,
  approveVerification,
  getPayoutRequests,
  getVerificationRequests,
  rejectPayout,
  rejectVerification,
  type AdminPayoutRequest,
  type AdminVerificationRequest,
} from '@/services/admin-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: '#F59E0B',
    PROCESSING: '#3B82F6',
    APPROVED: Colors.success,
    PAID: Colors.success,
    REJECTED: Colors.danger,
  };
  const color = map[status] ?? Colors.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <AppText variant="tag" color={color} style={styles.badgeText}>
        {status}
      </AppText>
    </View>
  );
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const email = useAuthStore((state) => state.profile?.email ?? null);
  const authorized = isAdminEmail(email);

  const [tab, setTab] = useState<'verifications' | 'payouts'>('verifications');
  const [verifications, setVerifications] = useState<
    AdminVerificationRequest[]
  >([]);
  const [payouts, setPayouts] = useState<AdminPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const [verifData, payoutData] = await Promise.all([
        getVerificationRequests(session),
        getPayoutRequests(session),
      ]);
      setVerifications(verifData);
      setPayouts(payoutData);
      setError(false);
    } catch (err) {
      console.error('[admin] fetch failed:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (authorized) {
        setLoading(true);
        void fetchAll();
      }
    }, [authorized, fetchAll]),
  );

  if (!authorized) {
    return (
      <ScreenWrapper background="transparent" style={styles.wrapper}>
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
          <AppText variant="h3" color={Colors.white}>
            Panel Admin
          </AppText>
        </View>
        <View style={styles.centerWrap}>
          <AntDesign name="lock" size={48} color="rgba(255,255,255,0.4)" />
          <AppText variant="body" color="rgba(255,255,255,0.7)" style={styles.stateText}>
            No tienes acceso a este panel.
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  async function handleVerification(
    requestId: string,
    action: 'approve' | 'reject',
  ) {
    if (!session || actionId) {
      return;
    }
    setActionId(requestId);
    try {
      if (action === 'approve') {
        await approveVerification(session, requestId);
        toast.success('Verificación aprobada', 'El usuario ya está verificado.');
      } else {
        await rejectVerification(session, requestId);
        toast.success('Verificación rechazada', 'La selfie fue eliminada.');
      }
      setVerifications((prev) =>
        prev.filter((item) => item.id !== requestId),
      );
    } catch (err) {
      console.error(`[admin] verification ${action} failed:`, err);
      toast.error(
        'No se pudo procesar la solicitud',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function handlePayout(
    payoutId: string,
    action: 'approve' | 'reject',
  ) {
    if (!session || actionId) {
      return;
    }
    setActionId(payoutId);
    try {
      if (action === 'approve') {
        await approvePayout(session, payoutId);
        toast.success('Retiro aprobado', 'En proceso de pago.');
      } else {
        await rejectPayout(session, payoutId);
        toast.success(
          'Retiro rechazado',
          'El monto volvió al saldo del usuario.',
        );
      }
      setPayouts((prev) => prev.filter((item) => item.id !== payoutId));
    } catch (err) {
      console.error(`[admin] payout ${action} failed:`, err);
      toast.error(
        'No se pudo procesar el retiro',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <AntDesign name="left" size={20} color={Colors.white} />
        </Pressable>
        <View style={styles.titleWrap}>
          <AppText variant="h3" color={Colors.white}>
            Panel Admin
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            {email}
          </AppText>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['verifications', 'payouts'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={({ pressed }) => [
              styles.tab,
              tab === key && styles.tabActive,
              pressed && styles.pressed,
            ]}>
            <AppText
              variant="label"
              color={tab === key ? Colors.white : 'rgba(255,255,255,0.75)'}>
              {key === 'verifications'
                ? `Verificaciones (${verifications.length})`
                : `Retiros (${payouts.length})`}
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
            No pudimos cargar los datos.
          </AppText>
          <AppButton
            label="Reintentar"
            variant="solid"
            color="primary"
            onPress={() => {
              setLoading(true);
              void fetchAll();
            }}
          />
        </View>
      ) : tab === 'verifications' ? (
        <FlatList
          data={verifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchAll();
              }}
              tintColor={Colors.white}
              colors={[Colors.white]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <AntDesign name="check-circle" size={48} color="rgba(255,255,255,0.4)" />
              <AppText
                variant="body"
                color="rgba(255,255,255,0.7)"
                style={styles.stateText}>
                No hay solicitudes de verificación.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() => setPhotoModal(item.selfieUrl)}
                style={({ pressed }) => [styles.photoWrap, pressed && styles.pressed]}>
                <Image
                  source={{ uri: item.selfieUrl }}
                  style={styles.photo}
                  contentFit="cover"
                />
              </Pressable>
              <View style={styles.cardBody}>
                <AppText variant="bodyMedium" color={Colors.text}>
                  {titleCase(
                    [item.user.firstName, item.user.lastName]
                      .filter(Boolean)
                      .join(' '),
                  ) || 'Usuario'}
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  {item.user.email}
                </AppText>
                <View style={styles.cardMeta}>
                  <StatusBadge status={item.status} />
                  <AppText variant="caption" color={Colors.textMuted}>
                    {new Date(item.createdAt).toLocaleString('es-CO')}
                  </AppText>
                </View>
              </View>
              <View style={styles.cardActions}>
                <AppButton
                  label="Aprobar"
                  variant="solid"
                  color="primary"
                  size="sm"
                  loading={actionId === item.id}
                  disabled={actionId !== null && actionId !== item.id}
                  onPress={() => void handleVerification(item.id, 'approve')}
                />
                <AppButton
                  label="Rechazar"
                  variant="outlined"
                  color="primary"
                  size="sm"
                  disabled={actionId !== null}
                  onPress={() => void handleVerification(item.id, 'reject')}
                />
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={payouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchAll();
              }}
              tintColor={Colors.white}
              colors={[Colors.white]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <AntDesign name="wallet" size={48} color="rgba(255,255,255,0.4)" />
              <AppText
                variant="body"
                color="rgba(255,255,255,0.7)"
                style={styles.stateText}>
                No hay solicitudes de retiro.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <AppText variant="bodyMedium" color={Colors.text}>
                  {titleCase(
                    [item.user.firstName, item.user.lastName]
                      .filter(Boolean)
                      .join(' '),
                  ) || 'Usuario'}
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  {item.user.email}
                </AppText>
                <AppText variant="h3" color={Colors.text} style={styles.amount}>
                  {money(item.amountInCents)}
                </AppText>
                <View style={styles.cardMeta}>
                  <StatusBadge status={item.status} />
                  <AppText variant="caption" color={Colors.textMuted}>
                    {new Date(item.createdAt).toLocaleString('es-CO')}
                  </AppText>
                </View>
                {item.payoutProofUrl ? (
                  <Pressable
                    onPress={() => setPhotoModal(item.payoutProofUrl ?? null)}
                    style={({ pressed }) => [styles.proofLink, pressed && styles.pressed]}>
                    <AntDesign name="picture" size={14} color={Colors.primary} />
                    <AppText variant="caption" color={Colors.primary}>
                      Ver comprobante
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              {item.status === 'PENDING' ? (
                <View style={styles.cardActions}>
                  <AppButton
                    label="Aprobar"
                    variant="solid"
                    color="primary"
                    size="sm"
                    loading={actionId === item.id}
                    disabled={actionId !== null && actionId !== item.id}
                    onPress={() => void handlePayout(item.id, 'approve')}
                  />
                  <AppButton
                    label="Rechazar"
                    variant="outlined"
                    color="primary"
                    size="sm"
                    disabled={actionId !== null}
                    onPress={() => void handlePayout(item.id, 'reject')}
                  />
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      <Modal
        transparent
        visible={photoModal !== null}
        animationType="fade"
        onRequestClose={() => setPhotoModal(null)}>
        <Pressable
          style={styles.photoOverlay}
          onPress={() => setPhotoModal(null)}>
          {photoModal ? (
            <Image
              source={{ uri: photoModal }}
              style={styles.photoFull}
              contentFit="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
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
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  titleWrap: {
    flex: 1,
    gap: Spacing.xxs,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadows.card,
  },
  photoWrap: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: 88,
    height: 110,
    backgroundColor: Colors.neutral,
  },
  cardBody: {
    flex: 1,
    minWidth: 140,
    gap: Spacing.xxs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xxs,
  },
  amount: {
    marginTop: Spacing.xs,
  },
  proofLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cardActions: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontWeight: '700',
  },
  photoOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  photoFull: {
    width: '90%',
    height: '80%',
  },
});
