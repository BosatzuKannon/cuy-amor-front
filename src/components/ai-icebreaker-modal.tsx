import { AntDesign } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  visible: boolean;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
};

export function AiIcebreakerModal({
  visible,
  suggestions,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <AntDesign name="bulb" size={18} color={Colors.gold} />
            </View>
            <AppText variant="h3" color={Colors.text} style={styles.title}>
              Ideas para romper el hielo
            </AppText>
          </View>

          <AppText variant="caption" color={Colors.textMuted} style={styles.subtitle}>
            Toca una para usarla en el chat
          </AppText>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}>
            {suggestions.map((suggestion, index) => (
              <Pressable
                key={`${index}-${suggestion.slice(0, 12)}`}
                onPress={() => onSelect(suggestion)}
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && styles.suggestionPressed,
                ]}>
                <AppText variant="body" color={Colors.text} style={styles.suggestionText}>
                  {suggestion}
                </AppText>
                <AntDesign name="arrow-right" size={16} color={Colors.primary} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}>
            <AppText variant="label" color={Colors.primary}>
              Cerrar
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.14)',
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginTop: -Spacing.sm,
  },
  list: {
    gap: Spacing.md,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  suggestionPressed: {
    opacity: 0.7,
  },
  suggestionText: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
});
