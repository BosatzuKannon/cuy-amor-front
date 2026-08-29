import Slider from '@react-native-community/slider';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { toast } from '@/lib/toast';
import { updateUserPreferences } from '@/services/profile-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <AppText variant="bodyMedium" color={Colors.text} style={styles.toggleLabel}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color={Colors.textMuted} style={styles.toggleDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.border}
      />
    </View>
  );
}

export default function SearchPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);

  const prefs = profile?.preferences;

  const [minAge, setMinAge] = useState(prefs?.minAgePreference?.toString() ?? '18');
  const [maxAge, setMaxAge] = useState(prefs?.maxAgePreference?.toString() ?? '99');
  const [maxDistance, setMaxDistance] = useState(
    Math.min(500, Math.max(5, prefs?.maxDistanceKm ?? 50)),
  );
  const [showLocation, setShowLocation] = useState(prefs?.showLocation ?? true);
  const [invisibleMode, setInvisibleMode] = useState(
    prefs?.invisibleMode ?? false,
  );
  const [saving, setSaving] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  async function handleSave() {
    if (!session || saving) {
      return;
    }

    const minAgeNumber = Number(minAge);
    const maxAgeNumber = Number(maxAge);

    if (!Number.isInteger(minAgeNumber) || minAgeNumber < 18 || minAgeNumber > 99) {
      toast.error('Edad mínima no válida', 'Debe ser un número entre 18 y 99.');
      return;
    }
    if (!Number.isInteger(maxAgeNumber) || maxAgeNumber < 18 || maxAgeNumber > 99) {
      toast.error('Edad máxima no válida', 'Debe ser un número entre 18 y 99.');
      return;
    }
    if (maxAgeNumber < minAgeNumber) {
      toast.error(
        'Rango de edad no válido',
        'La edad máxima debe ser mayor o igual a la mínima.',
      );
      return;
    }
    if (maxDistance < 5 || maxDistance > 500) {
      toast.error('Distancia no válida', 'Debe estar entre 5 y 500 kilómetros.');
      return;
    }

    setSaving(true);
    try {
      const fresh = await updateUserPreferences(
        session.user.id,
        {
          minAgePreference: minAgeNumber,
          maxAgePreference: maxAgeNumber,
          maxDistanceKm: maxDistance,
          showLocation,
          invisibleMode,
        },
        session,
      );

      const current = useAuthStore.getState().profile;
      if (current) {
        useAuthStore.getState().setProfile({ ...current, preferences: fresh });
      }

      toast.success(
        'Ajustes guardados',
        'Tus preferencias se actualizaron correctamente.',
      );
      router.back();
    } catch (error) {
      console.error('[search-preferences] save failed:', error);
      toast.error(
        'No se pudieron guardar los ajustes',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AppText variant="h2" color={Colors.white} style={styles.title}>
            Ajustes de búsqueda
          </AppText>

          <View style={styles.card}>
            <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
              Rango de edad
            </AppText>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <AppText variant="tag" color={Colors.textMuted} style={styles.inputLabel}>
                  Edad mínima
                </AppText>
                <TextInput
                  value={minAge}
                  onChangeText={setMinAge}
                  placeholder="18"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <AppText variant="tag" color={Colors.textMuted} style={styles.inputLabel}>
                  Edad máxima
                </AppText>
                <TextInput
                  value={maxAge}
                  onChangeText={setMaxAge}
                  placeholder="99"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
              Distancia
            </AppText>
            <AppText variant="h3" color={Colors.text} style={styles.distanceValue}>
              {maxDistance} kilómetros
            </AppText>
            <Slider
              minimumValue={5}
              maximumValue={500}
              step={1}
              value={maxDistance}
              onValueChange={setMaxDistance}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
            <AppText variant="caption" color={Colors.textMuted} style={styles.hint}>
              Entre 5 y 500 km
            </AppText>
          </View>

          <View style={styles.card}>
            <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
              Privacidad
            </AppText>
            <ToggleRow
              label="Mostrar mi ubicación"
              value={showLocation}
              onValueChange={setShowLocation}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Modo Cuy Ninja 🥷"
              description="Evita que otros usuarios te vean en Explorar. Costo: 50 Cuy Coins a la semana."
              value={invisibleMode}
              onValueChange={setInvisibleMode}
            />
          </View>

          <AppButton
            label="Guardar Cambios"
            variant="solid"
            color="primary"
            size="lg"
            pill
            fullWidth
            loading={saving}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

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
  flex: {
    flex: 1,
  },
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
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    textAlign: 'left',
    marginBottom: Spacing.xs,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 16,
  },
  hint: {
    textAlign: 'left',
    marginTop: Spacing.sm,
  },
  distanceValue: {
    textAlign: 'left',
    marginBottom: Spacing.md,
  },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    flex: 1,
    textAlign: 'left',
  },
  toggleDescription: {
    textAlign: 'left',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});