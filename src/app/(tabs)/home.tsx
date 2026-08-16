import { AntDesign } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type FeatureCardProps = {
  icon: 'heart' | 'message' | 'gift';
  title: string;
  description: string;
  accent: string;
};

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: accent }]}>
        <AntDesign name={icon} size={22} color={Colors.white} />
      </View>
      <View style={styles.cardBody}>
        <AppText variant="label" color={Colors.text}>
          {title}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenWrapper background="transparent">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <AppText variant="tag" color="rgba(255,255,255,0.85)">
            CUY AMOR
          </AppText>
        </View>

        <AppText variant="display" color={Colors.white} style={styles.title}>
          Encuentra a tu cuy ideal
        </AppText>
        <AppText variant="body" color="rgba(255,255,255,0.9)" style={styles.subtitle}>
          Matches locales, citas en vivo y momentos reales en Nariño.
        </AppText>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <AppText variant="tag" color={Colors.white}>
              100% local
            </AppText>
          </View>
          <View style={styles.chip}>
            <AppText variant="tag" color={Colors.white}>
              En vivo
            </AppText>
          </View>
          <View style={styles.chip}>
            <AppText variant="tag" color={Colors.white}>
              Privado
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="tag" color="rgba(255,255,255,0.85)">
            DESTACADOS
          </AppText>

          <FeatureCard
            icon="heart"
            accent="rgba(220,20,60,0.9)"
            title="Conexiones"
            description="Descubre perfiles afines cerca de tu ciudad y encuentra tu match."
          />
          <FeatureCard
            icon="message"
            accent="rgba(226,114,91,0.95)"
            title="Chats en vivo"
            description="Conversa al instante con tus cuyes y rompe el hielo sin excusas."
          />
          <FeatureCard
            icon="gift"
            accent="rgba(139,69,19,0.85)"
            title="Regalos"
            description="Sorpresa a tu crush con regalos virtuales y destaca en su feed."
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#22c55e',
  },
  title: {
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 340,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  section: {
    width: '100%',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
});