import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppBackground } from '@/components/ui/app-background';
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
  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <AppBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <AppText
              variant="tag"
              color="rgba(255,255,255,0.9)"
              style={styles.brandText}>
              CUY AMOR
            </AppText>
          </View>
        </View>

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pressed: {
    opacity: 0.7,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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