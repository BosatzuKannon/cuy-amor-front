import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuyLeyendaModal } from '@/components/cuy-leyenda-modal';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { formatCoins, formatCop } from '@/lib/currency';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

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
      {chevron ? (
        <AntDesign name="right" size={16} color={Colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function BalanceTile({
  icon,
  imageSource,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof AntDesign>['name'];
  imageSource?: number;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.balanceTile}>
      <View style={styles.balanceIconWrap}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.balanceCoinIcon}
            contentFit="contain"
          />
        ) : (
          <AntDesign name={icon} size={18} color={Colors.primary} />
        )}
      </View>
      <View style={styles.balanceBody}>
        <AppText
          variant="caption"
          color={Colors.textMuted}
          style={styles.balanceLabel}>
          {label}
        </AppText>
        <AppText
          variant="h3"
          color={Colors.text}
          style={styles.balanceValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLeyendaModal, setShowLeyendaModal] = useState(false);

  const firstName = profile?.firstName ?? '';
  const lastName = profile?.lastName ?? '';
  const gender = profile?.gender ?? null;
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  const coinsBalance = profile?.coinsBalance ?? 0;
  const cashBalance = formatCop(profile?.cashBalanceInCents ?? 0);
  const isLeyenda = profile?.isLeyenda ?? false;
  const leyendaDaysLeft = profile?.leyendaDaysLeft ?? 0;
  const referralCode = profile?.referralCode ?? null;

  const SHARE_INVITE_MESSAGE = `¡Descubre gente nueva en Cuy Amor y gana dinero en el proceso! Descarga la app aquí: https://play.google.com/store/apps/details?id=com.bosatzu.frontcuyamor y usa mi código exclusivo: ${referralCode ?? 'XXXX-XXXX'} durante tu registro para ganar juntos.`;

  const profilePhoto =
    profile?.photos.find((p) => p.isProfile)?.url ??
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

  function handleConfirmLogout() {
    void useAuthStore
      .getState()
      .logout()
      .then(() => {
        setShowLogoutModal(false);
        router.replace('/');
      });
  }

  async function handleShareInvite() {
    if (!referralCode) {
      return;
    }
    try {
      await Share.share({ message: SHARE_INVITE_MESSAGE });
    } catch (err) {
      console.log('[profile] share invite error:', err);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}>
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
                <AppText
                  variant="h2"
                  color={Colors.white}
                  style={styles.avatarInitials}>
                  {initials || 'C'}
                </AppText>
              </View>
            )}
          </LinearGradient>
          <AppText variant="h2" color={Colors.white} style={styles.headerName}>
            {profile?.fullName ?? 'Mi Perfil'}
          </AppText>
          <View style={styles.coinsBadge}>
            <Image
              source={require('@/assets/images/coinn.png')}
              style={styles.coinsBadgeIcon}
              contentFit="contain"
            />
            <AppText
              variant="caption"
              color={Colors.white}
              style={styles.coinsBadgeText}>
              {formatCoins(coinsBalance)} Cuy Coins
            </AppText>
          </View>
        </View>

        <Pressable
          onPress={handleShareInvite}
          disabled={!referralCode}
          style={({ pressed }) => [
            styles.inviteCardWrap,
            pressed && styles.inviteCardPressed,
            !referralCode && styles.inviteCardDisabled,
          ]}>
          <LinearGradient
            colors={['#40E0D0', '#007FFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inviteCard}>
            <View style={styles.inviteIconWrap}>
              <AntDesign name="share-alt" size={20} color={Colors.white} />
            </View>
            <View style={styles.inviteBody}>
              <AppText
                variant="bodyMedium"
                color={Colors.white}
                style={styles.inviteTitle}>
                Invita amigos y gana dinero
              </AppText>
              <AppText
                variant="caption"
                color="rgba(255,255,255,0.85)"
                style={styles.inviteSubtitle}>
                Comparte tu código exclusivo: {referralCode ?? '---'}
              </AppText>
            </View>
            <AntDesign name="right" size={16} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
            Mi Cuenta
          </AppText>
          <ProfileRow
            icon="edit"
            label="Editar perfil"
            onPress={() => router.push('/edit-profile')}
          />
          <Divider />
          <ProfileRow
            icon="setting"
            label="Ajustes de búsqueda"
            onPress={() => router.push('/search-preferences')}
          />
        </View>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
            Mi Billetera
          </AppText>
          <View style={styles.balanceStack}>
            <BalanceTile
              icon="wallet"
              label="Saldo disponible"
              value={cashBalance}
            />
          </View>
          <ProfileRow
            icon="team"
            label="Cuyes referidos"
            onPress={() => router.push('/referrals')}
          />
          <Divider />

          <Pressable
            onPress={() => setShowLeyendaModal(true)}
            style={({ pressed }) => [
              styles.vipRow,
              pressed && styles.vipRowPressed,
            ]}>
            <View style={styles.vipIconWrap}>
              <Image
                source={require('@/assets/images/iconvip.png')}
                style={styles.vipIcon}
                contentFit="contain"
              />
            </View>
            <View style={styles.vipBody}>
              <View style={styles.vipTitleRow}>
                <AppText
                  variant="bodyMedium"
                  color={isLeyenda ? Colors.gold : Colors.text}
                  style={styles.vipTitle}>
                  Cuy Leyenda
                </AppText>
                {isLeyenda && (
                  <View style={styles.vipBadge}>
                    <AppText variant="tag" color={Colors.white}>
                      VIP
                    </AppText>
                  </View>
                )}
              </View>
              <AppText
                variant="caption"
                color={isLeyenda ? Colors.success : Colors.textMuted}>
                {isLeyenda
                  ? `Tienes ${leyendaDaysLeft} d\u00EDas restantes como leyenda`
                  : 'Convi\u00E9rtete en Leyenda'}
              </AppText>
            </View>
            <AntDesign name="right" size={16} color={Colors.textMuted} />
          </Pressable>

          <Divider />
          <ProfileRow
            icon="profile"
            label="Historial de transacciones"
            onPress={() => router.push('/wallet/wallet-history')}
          />
          <Divider />
          <ProfileRow
            icon="export"
            label="Solicitar retiro"
            onPress={() => router.push('/wallet/payout')}
          />
          <Divider />
          <ProfileRow
            icon="shopping-cart"
            label="Comprar Cuy Coins"
            onPress={() => router.push('/wallet/buy-coins')}
          />
        </View>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
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
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
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
        onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="h3" color={Colors.text} style={styles.modalTitle}>
              Cerrar sesión
            </AppText>
            <AppText
              variant="body"
              color={Colors.textMuted}
              style={styles.modalBody}>
              ¿Estás seguro que deseas salir?
            </AppText>
            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="outlined"
                style={styles.modalButton}
                onPress={() => setShowLogoutModal(false)}
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

      <CuyLeyendaModal
        visible={showLeyendaModal}
        onClose={() => setShowLeyendaModal(false)}
      />
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
  inviteCardWrap: {
    width: '100%',
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...Shadows.card,
  },
  inviteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  inviteCardPressed: {
    opacity: 0.85,
  },
  inviteCardDisabled: {
    opacity: 0.55,
  },
  inviteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  inviteBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  inviteTitle: {
    textAlign: 'left',
  },
  inviteSubtitle: {
    textAlign: 'left',
    lineHeight: 18,
  },
  coinsBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.button,
  },
  coinsBadgeIcon: {
    width: 28,
    height: 28,
  },
  coinsBadgeText: {
    textAlign: 'left',
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
    ...Shadows.button,
  },
  balanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  balanceCoinIcon: {
    width: 24,
    height: 24,
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
  vipRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  vipRowPressed: {
    opacity: 0.6,
  },
  vipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  vipIcon: {
    width: 22,
    height: 22,
  },
  vipBody: {
    flex: 1,
    gap: 2,
  },
  vipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vipTitle: {
    textAlign: 'left',
  },
  vipBadge: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
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
