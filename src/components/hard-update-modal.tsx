import { AntDesign } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useUpdateGateStore } from '@/store/useUpdateGateStore';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

export function HardUpdateModal() {
  const config = useUpdateGateStore((s) => s.config);

  const updateUrl =
    config?.updateUrl || 'market://details?id=com.bosatzu.frontcuyamor';

  function handleUpdate() {
    void Linking.openURL(updateUrl).catch(() => {});
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon2.png')}
        style={styles.brandIcon}
        contentFit="contain"
      />
      <AppText variant="h2" color={Colors.white} style={styles.title}>
        ¡Nueva versión disponible!
      </AppText>
      <AppText
        variant="body"
        color={Colors.white}
        style={styles.description}>
        Para continuar usando Cuy Amor necesitas actualizar la app desde la
        tienda.
      </AppText>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <AntDesign name="rocket" size={22} color={Colors.white} />
        </View>
        <AppText variant="caption" color={Colors.white} style={styles.versionHint}>
          Compatibilidad y nuevas funciones
        </AppText>
      </View>
      <Pressable
        onPress={handleUpdate}
        style={({ pressed }) => [
          styles.updateButton,
          pressed && styles.updateButtonPressed,
        ]}>
        <AppText variant="label" color={Colors.primary}>
          Actualizar ahora
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.primary,
  },
  brandIcon: {
    width: 96,
    height: 96,
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xxl,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionHint: {
    opacity: 0.9,
  },
  updateButton: {
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
  updateButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
