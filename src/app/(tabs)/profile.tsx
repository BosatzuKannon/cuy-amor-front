import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const WALLET = {
  cashBalance: '$50.000 COP',
};

const AVATAR_GRADIENT_MALE = { colors: ['#40E0D0', '#007FFF'] as const };
const AVATAR_GRADIENT_FEMALE = { colors: ['#e2725b', '#FFD700'] as const };
const AVATAR_GRADIENT_OTHER = { colors: ['#DC143C', '#E2725B'] as const };

type ProfileRowProps = {
  icon: React.ComponentProps<typeof AntDesign>['name'];
  label: string;
  labelColor?: string;
  chevron?: boolean;
  onPress?: () => void;
};

function ProfileRow({
  icon,
  label,
  labelColor = Colors.text,
  chevron = true,
  onPress,
}: ProfileRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIcon}>
        <AntDesign name={icon} size={18} color={Colors.primary} />
      </View>
      <AppText variant="bodyMedium" color={labelColor} style={styles.rowLabel}>
        {label}
      </AppText>
      {chevron ? <AntDesign name="right" size={16} color={Colors.textMuted} /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function BalanceTile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof AntDesign>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.balanceTile}>
      <View style={styles.balanceIconWrap}>
        <AntDesign name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.balanceBody}>
        <AppText variant="caption" color={Colors.textMuted} style={styles.balanceLabel}>
          {label}
        </AppText>
        <AppText variant="h3" color={Colors.text} style={styles.balanceValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const firstName = profile?.firstName ?? '';
  const lastName = profile?.lastName ?? '';
  const gender = profile?.gender ?? null;
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const coinsBalance = profile?.coinsBalance ?? 0;

  const profilePhoto =
    profile?.photos.find((photo) => photo.isProfile)?.url ??
    profile?.photos[0]?.url ??
    null;

  const avatarGradient =
    gender === 'FEMALE'
      ? AVATAR_GRADIENT_FEMALE
      : gender === 'OTHER'
        ? AVATAR_GRADIENT_OTHER
        : AVATAR_GRADIENT_MALE;

  function handleLogout() {
    setShowLogoutModal(true);
  }

  function handleCancelLogout() {
    setShowLogoutModal(false);
  }

  function handleConfirmLogout() {
    void useAuthStore
      .getState()
      .logout()
      .then(() => {
        setShowLogoutModal(false);
        router.replace('/');
      });
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <AppText variant="tag" color="rgba(255,255,255,0.9)" style={styles.brandText}>
            CUY AMOR
          </AppText>
        </View>

        <View style={styles.header}>
          <LinearGradient
            colors={avatarGradient.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <AppText variant="h2" color={Colors.white} style={styles.avatarInitials}>
                  {initials || 'C'}
                </AppText>
              </View>
            )}
          </LinearGradient>
          <AppText variant="h2" color={Colors.white} style={styles.headerName}>
            {profile?.fullName ?? 'Mi Perfil'}
          </AppText>
          <AppText
            variant="caption"
            color="rgba(255,255,255,0.9)"
            style={styles.headerCoins}>
            🪙 {coinsBalance} Cuy Coins
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText variant="tag" color={Colors.textMuted} style={styles.cardTitle}>
            Mi Cuenta
          </AppText>
          <ProfileRow icon="edit" label="Editar perfil" onPress={() => router.push('/edit-profile')} />
          <Divider />
          <ProfileRow icon="setting" label="Ajustes de búsqueda" onPress={() => router.push('/search-preferences')} />
        </View>

        <View style={styles.card}>
          <AppText variant="tag" color={Colors.textMuted} style={styles.cardTitle}>
            Mi Billetera
          </AppText>
          <View style={styles.balanceStack}>
            <BalanceTile
              icon="wallet"
              label="Saldo disponible"
              value={WALLET.cashBalance}
            />
            <BalanceTile icon="star" label="Cuy Coins" value={`${coinsBalance}`} />
          </View>
          <Divider />
          <ProfileRow icon="profile" label="Historial de transacciones" />
          <Divider />
          <ProfileRow icon="export" label="Solicitar retiro" />
          <Divider />
          <ProfileRow icon="import" label="Depositar dinero" />
        </View>

        <View style={styles.card}>
          <AppText variant="tag" color={Colors.textMuted} style={styles.cardTitle}>
            Legal
          </AppText>
          <ProfileRow
            icon="file-text"
            label="Términos y condiciones"
            onPress={() => router.push('/terms')}
          />
          <Divider />
          <ProfileRow
            icon="lock"
            label="Políticas de privacidad"
            onPress={() => router.push('/privacy')}
          />
        </View>

        <View style={styles.card}>
          <AppText variant="tag" color={Colors.textMuted} style={styles.cardTitle}>
            Acciones
          </AppText>
          <ProfileRow
            icon="logout"
            label="Cerrar sesión"
            labelColor={Colors.danger}
            chevron={false}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={handleCancelLogout}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="h3" color={Colors.text} style={styles.modalTitle}>
              Cerrar sesión
            </AppText>
            <AppText variant="body" color={Colors.textMuted} style={styles.modalBody}>
              ¿Estás seguro que deseas salir?
            </AppText>
            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="outlined"
                style={styles.modalButton}
                onPress={handleCancelLogout}
              />
              <AppButton
                label="Salir"
                variant="solid"
                color="primary"
                style={styles.modalButton}
                onPress={handleConfirmLogout}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: 24,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D166',
  },
  brandText: {
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  avatarGradient: {
    padding: 3,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
    ...Shadows.button,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  avatarInitials: {
    textAlign: 'center',
  },
  headerName: {
    textAlign: 'center',
  },
  headerCoins: {
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.neutral,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  rowLabel: {
    flex: 1,
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 46,
  },
  balanceStack: {
    width: '100%',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  balanceTile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  balanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  balanceBody: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.xxs,
  },
  balanceLabel: {
    textAlign: 'left',
  },
  balanceValue: {
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 24,
  },
  modalTitle: {
    textAlign: 'left',
  },
  modalBody: {
    textAlign: 'left',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});