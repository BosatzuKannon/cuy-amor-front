import { AntDesign } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  updateUrl: string;
  onDismiss: () => void;
};

export function SoftUpdateBanner({ updateUrl, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  function handleUpdate() {
    void Linking.openURL(updateUrl).catch(() => {});
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + Spacing.sm }]}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <AntDesign name="arrow-up" size={18} color={Colors.primary} />
        </View>
        <View style={styles.body}>
          <AppText variant="bodyMedium" color={Colors.text}>
            Hay una nueva versión
          </AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            Actualiza para disfrutar las últimas mejoras.
          </AppText>
        </View>
        <Pressable onPress={handleUpdate} style={styles.updateLink}>
          <AppText variant="label" color={Colors.primary}>
            Actualizar
          </AppText>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}>
          <AntDesign name="close" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(220,20,60,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  updateLink: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
});
