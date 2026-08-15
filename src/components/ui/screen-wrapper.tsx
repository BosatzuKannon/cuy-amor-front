import { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/layout';

export type ScreenWrapperProps = PropsWithChildren<{
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  background?: string;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  style?: ViewStyle | ViewStyle[];
}>;

export function ScreenWrapper({
  children,
  background = Colors.neutral,
  contentContainerStyle,
  style,
}: ScreenWrapperProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <View
        style={[styles.container, { backgroundColor: background }, contentContainerStyle, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});