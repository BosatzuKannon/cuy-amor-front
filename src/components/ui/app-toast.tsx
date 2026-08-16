import { AntDesign } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type {
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type ToastKind = 'success' | 'error' | 'info';
type IconName = keyof typeof AntDesign.glyphMap;

const TOAST_META: Record<ToastKind, { icon: IconName; color: string }> = {
  success: { icon: 'check-circle', color: '#22c55e' },
  error: { icon: 'close-circle', color: Colors.danger },
  info: { icon: 'info-circle', color: Colors.primary },
};

function ToastCard({
  kind,
  text1,
  text2,
}: {
  kind: ToastKind;
  text1?: string;
  text2?: string;
}) {
  const meta = TOAST_META[kind];

  return (
    <View style={styles.container}>
      <View style={[styles.iconBadge, { backgroundColor: meta.color }]}>
        <AntDesign name={meta.icon} size={16} color={Colors.white} />
      </View>

      <View style={styles.content}>
        {text1 ? (
          <AppText variant="label" color={Colors.white}>
            {text1}
          </AppText>
        ) : null}
        {text2 ? (
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            {text2}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function createToastRenderer(kind: ToastKind) {
  function ToastRenderer({ text1, text2 }: ToastConfigParams<unknown>) {
    return <ToastCard kind={kind} text1={text1} text2={text2} />;
  }
  ToastRenderer.displayName = `Toast_${kind}`;
  return ToastRenderer;
}

export const toastConfig: ToastConfig = {
  success: createToastRenderer('success'),
  error: createToastRenderer('error'),
  info: createToastRenderer('info'),
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    maxWidth: 400,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(31,31,38,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.card,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xxs,
  },
});
