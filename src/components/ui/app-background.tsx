import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

function FloatingShape({
  style,
  color,
}: {
  style: object;
  color: string;
}) {
  return <View style={[styles.shape, { backgroundColor: color }, style]} />;
}

const ROUTES_WITHOUT_BRAND = new Set([
  '/edit-profile',
  '/search-preferences',
  '/wallet/wallet-history',
  '/wallet/payout',
  '/wallet/buy-coins',
  '/terms',
  '/privacy',
  '/referrals',
]);

const ROUTE_PREFIXES_WITHOUT_BRAND = ['/chat/'];

export function AppBackground({ hideBrand = false }: { hideBrand?: boolean }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isLeyenda = useAuthStore((s) => s.profile?.isLeyenda ?? false);

  const shouldHideBrand =
    hideBrand ||
    ROUTES_WITHOUT_BRAND.has(pathname) ||
    ROUTE_PREFIXES_WITHOUT_BRAND.some((prefix) => pathname.startsWith(prefix));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <FloatingShape color="rgba(255,255,255,0.14)" style={styles.shapeOne} />
      <FloatingShape color="rgba(139,69,19,0.28)" style={styles.shapeTwo} />
      <FloatingShape color="rgba(255,255,255,0.10)" style={styles.shapeThree} />

      {!shouldHideBrand ? (
        <View style={[styles.brandHeader, { paddingTop: insets.top + Spacing.sm }]}>
          <Image
            source={
              isLeyenda
                ? require('@/assets/images/iconvip.png')
                : require('@/assets/images/icon1.png')
            }
            style={styles.brandLogo}
            contentFit="contain"
          />
          <AppText
            variant="tag"
            color={isLeyenda ? '#FFD700' : 'rgba(255,255,255,0.9)'}
            style={[styles.brandText, isLeyenda ? styles.brandTextLeyenda : null]}>
            {isLeyenda ? 'CUY LEYENDA' : 'CUY AMOR'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  shapeOne: {
    width: 260,
    height: 260,
    top: -70,
    right: -80,
  },
  shapeTwo: {
    width: 180,
    height: 180,
    top: 200,
    left: -70,
  },
  shapeThree: {
    width: 120,
    height: 120,
    top: '55%',
    right: -40,
  },
  brandHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingLeft: Spacing.lg,
  },
  brandLogo: {
    width: 55,
    height: 55,
  },
  brandText: {
    textAlign: 'left',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: -6,
  },
  brandTextLeyenda: {
    color: '#FFD700',
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
