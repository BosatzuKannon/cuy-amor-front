import { StyleSheet, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ComingSoonScreen() {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.title}>
            Cuy Amor - En Desarrollo
          </ThemedText>

          <ThemedText style={styles.description}>
            Estamos preparando algo increíble. Esta aplicación se encuentra actualmente
            en fase de pruebas cerradas. Muy pronto podrás encontrar tu conexión local.
          </ThemedText>

          <Pressable
            onPress={() => console.log('Entendido')}
            accessibilityRole="button"
            accessibilityLabel="Entendido"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.buttonText}>Entendido</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.six,
    gap: Spacing.four,
    alignItems: 'flex-start',
  },
  title: {
    color: '#DC143C',
    fontWeight: '800',
  },
  description: {
    color: '#212529',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: Spacing.two,
    backgroundColor: '#DC143C',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});