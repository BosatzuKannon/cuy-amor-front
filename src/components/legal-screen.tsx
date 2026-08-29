import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalScreenProps = {
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export function LegalScreen({ title, intro, sections }: LegalScreenProps) {
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}>
        <AppText variant="h2" color={Colors.white} style={styles.title}>
          {title}
        </AppText>

        {intro ? (
          <AppText variant="body" color="rgba(255,255,255,0.9)" style={styles.intro}>
            {intro}
          </AppText>
        ) : null}

        {sections.map((section, index) => (
          <View key={index} style={styles.card}>
            <AppText variant="h3" color={Colors.text} style={styles.sectionHeading}>
              {section.heading}
            </AppText>
            <AppText variant="body" color={Colors.text} style={styles.paragraph}>
              {section.body}
            </AppText>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={handleBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={({ pressed }) => [
          styles.backButton,
          { top: insets.top + Spacing.sm, right: Spacing.lg },
          pressed && styles.pressed,
        ]}>
        <AntDesign name="left" size={20} color={Colors.white} />
      </Pressable>
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
  backButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 50,
    elevation: 50,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.lg,
  },
  intro: {
    textAlign: 'left',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    ...Shadows.card,
  },
  sectionHeading: {
    textAlign: 'left',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  paragraph: {
    textAlign: 'left',
  },
});