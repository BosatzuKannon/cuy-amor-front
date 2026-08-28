import { AntDesign } from '@expo/vector-icons';
import type { AxiosError } from 'axios';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { api } from '@/lib/api';
import { uploadProfilePhoto } from '@/lib/photo-upload';
import { toast } from '@/lib/toast';
import {
  DEFAULT_COINS_BALANCE,
  useAuthStore,
  type GenderCode,
  type InterestedInCode,
  type RelationshipGoalCode,
  type UserProfile,
} from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const GENDER_OPTIONS: { label: string; value: GenderCode }[] = [
  { label: 'Mujer', value: 'FEMALE' },
  { label: 'Hombre', value: 'MALE' },
  { label: 'Otro', value: 'OTHER' },
];

const INTERESTED_IN_OPTIONS: { label: string; value: InterestedInCode }[] = [
  { label: 'Mujeres', value: 'WOMEN' },
  { label: 'Hombres', value: 'MEN' },
  { label: 'Ambos', value: 'BOTH' },
];

const RELATIONSHIP_OPTIONS: {
  label: string;
  value: RelationshipGoalCode;
}[] = [
  { label: 'Parchar', value: 'CASUAL' },
  { label: 'Amistad', value: 'FRIENDSHIP' },
  { label: 'Relación', value: 'RELATIONSHIP' },
  { label: 'Solo conversar', value: 'CHAT' },
  { label: 'Dejar que fluya', value: 'LET_IT_FLOW' },
  { label: 'Algo casual', value: 'LIGHT_CASUAL' },
];

const HOBBIES = [
  'Música',
  'Cine',
  'Cocinar',
  'Fútbol',
  'Senderismo',
  'Lectura',
  'Rumba',
  'Arte',
  'Videojuegos',
  'Mascotas',
  'Viajes',
  'Fotografía',
];

const TOTAL_STEPS = 6;

type ProfilePayload = {
  birthDate: string;
  gender: GenderCode;
  interestedIn: InterestedInCode | null;
  relationshipGoal: RelationshipGoalCode | null;
  hobbies: string[];
  bio?: string;
  latitude?: number;
  longitude?: number;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAge(date: Date) {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

function SelectChip({
  label,
  selected,
  onPress,
  style,
  labelStyle,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        style,
        pressed && styles.chipPressed,
      ]}>
      <AppText
        variant="tag"
        color={selected ? Colors.white : Colors.text}
        style={[
          selected ? styles.chipLabelSelected : undefined,
          labelStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {label}
      </AppText>
      {selected ? (
        <AntDesign name="check" size={12} color={Colors.white} />
      ) : null}
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);

  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [focusedDobField, setFocusedDobField] = useState<
    'day' | 'month' | 'year' | null
  >(null);
  const [gender, setGender] = useState<GenderCode | null>(null);
  const [interestedIn, setInterestedIn] = useState<InterestedInCode | null>(
    null,
  );
  const [relationshipGoal, setRelationshipGoal] =
    useState<RelationshipGoalCode | null>(null);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [promptingLocation, setPromptingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);

  const locationRequested = useRef(false);

  const dayInputRef = useRef<TextInput>(null);
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step === TOTAL_STEPS && !locationRequested.current) {
      locationRequested.current = true;
      void promptForLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function toggleHobby(hobby: string) {
    setHobbies((current) =>
      current.includes(hobby)
        ? current.filter((item) => item !== hobby)
        : [...current, hobby],
    );
  }

  function parseDob(): Date | null {
    const day = Number(dobDay);
    const month = Number(dobMonth);
    const year = Number(dobYear);

    if (
      dobDay.length === 0 ||
      dobMonth.length === 0 ||
      dobYear.length === 0 ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      year > new Date().getFullYear()
    ) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function handleDobDayChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setDobDay(digits.slice(0, 2));
    if (digits.length >= 2) {
      monthInputRef.current?.focus();
    }
  }

  function handleDobMonthChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setDobMonth(digits.slice(0, 2));
    if (digits.length >= 2) {
      yearInputRef.current?.focus();
    }
  }

  function handleDobYearChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setDobYear(digits.slice(0, 4));
  }

  async function promptForLocation() {
    if (location) {
      return;
    }

    setPromptingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        toast.info(
          'Ubicación opcional',
          'Puedes activarla más tarde desde tu perfil.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toast.success(
        'Ubicación detectada',
        'Ahora podrás encontrar cuyes cerca de ti.',
      );
    } catch (err) {
      console.log('[onboarding] location error:', err);
      toast.error(
        'No pudimos obtener tu ubicación',
        'Inténtalo de nuevo más tarde.',
      );
    } finally {
      setPromptingLocation(false);
    }
  }

  async function uploadPhoto(asset: ImagePicker.ImagePickerAsset) {
    if (!session) {
      return;
    }

    setPhotoUploading(true);

    try {
      const publicUrl = await uploadProfilePhoto(session, asset);

      const headers = { Authorization: `Bearer ${session.access_token}` };
      await api.post(
        '/users/photos',
        { photos: [{ url: publicUrl, order: 0, isProfile: true }] },
        { headers },
      );

      setPhotoUrl(publicUrl);
      console.log('[onboarding] photo uploaded:', publicUrl);
    } catch (err) {
      console.log('[onboarding] photo upload error:', err);
      setPhotoUrl(null);
      setPhotoUri(null);
      toast.error(
        'No se pudo subir la foto',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error(
        'Permiso de galería necesario',
        'Activa el acceso a tus fotos para elegir tu foto de perfil.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    await uploadPhoto(asset);
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function goNext() {
    if (step === 1) {
      const parsedDob = parseDob();
      if (!parsedDob) {
        toast.error(
          'Información incompleta',
          'Ingresa una fecha de nacimiento válida en formato DD / MM / AAAA.',
        );
        return;
      }
      if (getAge(parsedDob) < 18) {
        toast.error(
          'Debes ser mayor de 18 años',
          'La fecha de nacimiento debe indicar al menos 18 años.',
        );
        return;
      }
      if (!gender) {
        toast.error(
          'Información incompleta',
          'Selecciona tu género para continuar.',
        );
        return;
      }
      setBirthDate(parsedDob);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!interestedIn || !relationshipGoal) {
        toast.error(
          'Información incompleta',
          'Cuéntanos a quién buscas y qué esperas encontrar.',
        );
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3 || step === 4) {
      setStep(step + 1);
      return;
    }

    if (step === 5) {
      if (!photoUrl) {
        toast.error(
          'Falta tu foto',
          'Agrega una foto de perfil para completar tu registro.',
        );
        return;
      }
      setStep(6);
      return;
    }

    void handleSubmit();
  }

  async function handleSubmit() {
    if (!session || photoUploading || submitting) {
      return;
    }

    if (!birthDate || !gender || !photoUrl) {
      toast.error(
        'Perfil incompleto',
        'Completa todos los pasos para continuar.',
      );
      return;
    }

    setSubmitting(true);

    const payload: ProfilePayload = {
      birthDate: toIsoDate(birthDate),
      gender,
      interestedIn,
      relationshipGoal,
      hobbies,
      bio: bio.trim() || undefined,
      ...(location
        ? {
            latitude: Number(location.latitude.toFixed(6)),
            longitude: Number(location.longitude.toFixed(6)),
          }
        : {}),
    };

    console.log('[onboarding] Sending payload:', payload);

    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };

      await api.patch('/users/profile', payload, { headers });

      const metadata = session.user.user_metadata ?? {};
      const profile: UserProfile = {
        id: session.user.id,
        email: session.user.email ?? '',
        firstName:
          typeof metadata.full_name === 'string'
            ? metadata.full_name.split(' ')[0] || null
            : null,
        lastName: null,
        fullName:
          typeof metadata.full_name === 'string'
            ? metadata.full_name.trim()
            : null,
        birthDate: toIsoDate(birthDate),
        gender,
        interestedIn,
        relationshipGoal,
        hobbies,
        bio: bio.trim() || null,
        city: null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        preferences: null,
        photos: photoUrl
          ? [{ id: '', url: photoUrl, order: 0, isProfile: true }]
          : [],
        coinsBalance: DEFAULT_COINS_BALANCE,
        cashBalanceInCents: 0,
        referralCode: null,
        referralEarnings: 0,
        isNinja: false,
        isLeyenda: false,
        leyendaExpiresAt: null,
        leyendaDaysLeft: 0,
        dailyZumbidosLeft: 0,
        dailyCuyazosLeft: 0,
        ninjaDaysLeft: 0,
      };

      useAuthStore.getState().setProfile(profile);
      useAuthStore.getState().markProfileComplete();

      setShowWelcomeGift(true);
    } catch (err) {
      console.error('[onboarding] PATCH /users/profile failed:', err);
      const axiosError = err as Partial<AxiosError<unknown>>;
      console.error('[onboarding] HTTP status:', axiosError.response?.status);
      console.error('[onboarding] Server validation response:', axiosError.response?.data);
      toast.error(
        'No se pudo guardar el perfil',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = photoUploading || submitting;

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <AppText variant="tag" color="rgba(255,255,255,0.85)">
                CUY AMOR
              </AppText>
            </View>

            <AppText variant="display" color={Colors.white} style={styles.title}>
              Completa tu perfil
            </AppText>
            <AppText
              variant="body"
              color="rgba(255,255,255,0.9)"
              style={styles.subtitle}>
              Cuéntanos un poco sobre ti para encontrar tu cuy ideal en Nariño.
            </AppText>

            <View style={styles.progressRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map(
                (index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index <= step && styles.progressDotActive,
                    ]}
                  />
                ),
              )}
              <AppText variant="caption" color="rgba(255,255,255,0.9)">
                Paso {step} de {TOTAL_STEPS}
              </AppText>
            </View>

            <View style={styles.card}>
              {step === 1 ? (
                <>
                  <View style={styles.field}>
                    <AppText
                      variant="tag"
                      color={Colors.textMuted}
                      style={styles.label}>
                      Fecha de nacimiento
                    </AppText>
                    <View style={styles.dobRow}>
                      <TextInput
                        ref={dayInputRef}
                        value={dobDay}
                        onChangeText={handleDobDayChange}
                        onFocus={() => setFocusedDobField('day')}
                        onBlur={() => setFocusedDobField(null)}
                        placeholder="DD"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        maxLength={2}
                        selectTextOnFocus
                        style={[
                          styles.dobInput,
                          focusedDobField === 'day' && styles.dobInputFocused,
                        ]}
                      />
                      <TextInput
                        ref={monthInputRef}
                        value={dobMonth}
                        onChangeText={handleDobMonthChange}
                        onFocus={() => setFocusedDobField('month')}
                        onBlur={() => setFocusedDobField(null)}
                        placeholder="MM"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        maxLength={2}
                        selectTextOnFocus
                        style={[
                          styles.dobInput,
                          focusedDobField === 'month' && styles.dobInputFocused,
                        ]}
                      />
                      <TextInput
                        ref={yearInputRef}
                        value={dobYear}
                        onChangeText={handleDobYearChange}
                        onFocus={() => setFocusedDobField('year')}
                        onBlur={() => setFocusedDobField(null)}
                        placeholder="AAAA"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        maxLength={4}
                        selectTextOnFocus
                        style={[
                          styles.dobInput,
                          focusedDobField === 'year' && styles.dobInputFocused,
                        ]}
                      />
                    </View>
                    {(() => {
                      const parsedDob = parseDob();
                      return parsedDob ? (
                        <AppText variant="caption" color={Colors.textMuted}>
                          Tienes {getAge(parsedDob)} años
                        </AppText>
                      ) : null;
                    })()}
                  </View>

                  <View style={styles.field}>
                    <AppText
                      variant="tag"
                      color={Colors.textMuted}
                      style={styles.label}>
                      Género
                    </AppText>
                    <View style={styles.chipRow}>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectChip
                          key={option.value}
                          label={option.label}
                          selected={gender === option.value}
                          onPress={() => setGender(option.value)}
                        />
                      ))}
                    </View>
                  </View>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <View style={styles.field}>
                    <AppText
                      variant="tag"
                      color={Colors.textMuted}
                      style={styles.label}>
                      ¿A quién buscas?
                    </AppText>
                    <View style={styles.chipRow}>
                      {INTERESTED_IN_OPTIONS.map((option) => (
                        <SelectChip
                          key={option.value}
                          label={option.label}
                          selected={interestedIn === option.value}
                          onPress={() => setInterestedIn(option.value)}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.field}>
                    <AppText
                      variant="tag"
                      color={Colors.textMuted}
                      style={styles.label}>
                      ¿Qué buscas?
                    </AppText>
                    <View style={styles.chipGrid}>
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <SelectChip
                          key={option.value}
                          label={option.label}
                          selected={relationshipGoal === option.value}
                          onPress={() => setRelationshipGoal(option.value)}
                          style={styles.gridChip}
                          labelStyle={styles.gridChipLabel}
                        />
                      ))}
                    </View>
                  </View>
                </>
              ) : null}

              {step === 3 ? (
                <View style={styles.field}>
                  <AppText
                    variant="tag"
                    color={Colors.textMuted}
                    style={styles.label}>
                    Tus gustos / hobbies
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    Elige los que más te representan.
                  </AppText>
                  <View style={styles.chipRowWrap}>
                    {HOBBIES.map((hobby) => (
                      <SelectChip
                        key={hobby}
                        label={hobby}
                        selected={hobbies.includes(hobby)}
                        onPress={() => toggleHobby(hobby)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {step === 4 ? (
                <View style={styles.field}>
                  <AppText
                    variant="tag"
                    color={Colors.textMuted}
                    style={styles.label}>
                    Sobre ti
                  </AppText>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Cuéntanos de ti, tus gustos, tu música…"
                    placeholderTextColor={Colors.textMuted}
                    style={[styles.input, styles.inputMultiline]}
                    multiline
                    numberOfLines={5}
                    maxLength={500}
                  />
                  <AppText variant="caption" color={Colors.textMuted}>
                    Opcional · hasta 500 caracteres
                  </AppText>
                </View>
              ) : null}

              {step === 5 ? (
                <View style={styles.field}>
                  <AppText
                    variant="tag"
                    color={Colors.textMuted}
                    style={styles.label}>
                    Foto de perfil
                  </AppText>

                  <View style={styles.photoRow}>
                    {photoUri ? (
                      <View style={styles.photoItem}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.photoPreview}
                          contentFit="cover"
                        />
                        {photoUploading ? (
                          <View style={styles.photoOverlay}>
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    <Pressable
                      onPress={handlePickPhoto}
                      disabled={isBusy}
                      style={({ pressed }) => [
                        styles.photoAction,
                        pressed && styles.photoActionPressed,
                        isBusy && styles.photoActionDisabled,
                      ]}>
                      {photoUploading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <AntDesign
                          name={photoUrl ? 'edit' : 'camera'}
                          size={16}
                          color={Colors.primary}
                        />
                      )}
                      <AppText variant="tag" color={Colors.primary}>
                        {photoUploading
                          ? 'Subiendo…'
                          : photoUrl
                            ? 'Reemplazar'
                            : 'Elegir foto'}
                      </AppText>
                    </Pressable>
                  </View>

                  <AppText
                    variant="caption"
                    color={Colors.textMuted}
                    style={styles.photoHint}>
                    {photoUploading
                      ? 'Subiendo tu foto…'
                      : photoUrl
                        ? 'Tu foto está lista para usar.'
                        : 'Elige una foto desde tu galería para completar tu perfil.'}
                  </AppText>
                </View>
              ) : null}

              {step === 6 ? (
                <View style={styles.field}>
                  <AppText
                    variant="tag"
                    color={Colors.textMuted}
                    style={styles.label}>
                    Tu ubicación
                  </AppText>

                  <View style={styles.locationRow}>
                    {location ? (
                      <View style={styles.locationState}>
                        <View
                          style={[
                            styles.locationIcon,
                            { backgroundColor: '#22c55e' },
                          ]}>
                          <AntDesign
                            name="check"
                            size={16}
                            color={Colors.white}
                          />
                        </View>
                        <View style={styles.locationStateBody}>
                          <AppText variant="label" color={Colors.text}>
                            Ubicación activada
                          </AppText>
                          <AppText variant="caption" color={Colors.textMuted}>
                            {`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                          </AppText>
                        </View>
                      </View>
                    ) : (
                      <AppButton
                        label={
                          promptingLocation
                            ? 'Solicitando permiso…'
                            : 'Usar mi ubicación'
                        }
                        variant="outlined"
                        color="primary"
                        size="md"
                        pill
                        disabled={promptingLocation}
                        loading={promptingLocation}
                        onPress={() => void promptForLocation()}
                        iconLeft={
                          <AntDesign
                            name="environment"
                            size={16}
                            color={Colors.primary}
                          />
                        }
                      />
                    )}
                  </View>

                  <AppText
                    variant="caption"
                    color={Colors.textMuted}
                    style={styles.photoHint}>
                    Usamos tu ubicación solo para mostrarte perfiles cercanos.
                    Es opcional y puedes cambiarla cuando quieras.
                  </AppText>
                </View>
              ) : null}

              <View style={styles.navRow}>
                {step > 1 ? (
                  <AppButton
                    label="Atrás"
                    variant="outlined"
                    color="primary"
                    size="lg"
                    pill
                    disabled={isBusy}
                    onPress={goBack}
                  />
                ) : null}
                <AppButton
                  label={step === TOTAL_STEPS ? 'Finalizar' : 'Siguiente'}
                  variant="solid"
                  color="primary"
                  size="lg"
                  pill
                  loading={submitting}
                  disabled={photoUploading || promptingLocation}
                  onPress={goNext}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showWelcomeGift}
        animationType="fade"
        onRequestClose={() => {
          setShowWelcomeGift(false);
          router.replace('/(tabs)/home');
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCoinWrap}>
              <Image
                source={require('@/assets/images/coinn.png')}
                style={styles.modalCoinIcon}
                contentFit="contain"
              />
            </View>
            <AppText
              variant="h3"
              color={Colors.text}
              style={styles.modalTitle}>
              ¡Regalo de bienvenida!
            </AppText>
            <AppText
              variant="body"
              color={Colors.textMuted}
              style={styles.modalBody}>
              Has recibido 100 Cuy Coins para comenzar tu aventura en Cuy Amor.
            </AppText>
            <AppText
              variant="caption"
              color={Colors.textMuted}
              style={styles.modalHint}>
              Úsalas para enviar Cuyazos especiales o activar el modo
              incógnito Cuy Ninja.
            </AppText>
            <AppButton
              label="¡Genial!"
              variant="solid"
              pill
              fullWidth
              style={styles.modalButton}
              onPress={() => {
                setShowWelcomeGift(false);
                router.replace('/(tabs)/home');
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrapper: {
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  inner: {
    width: '100%',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
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
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 340,
    marginBottom: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressDotActive: {
    backgroundColor: Colors.white,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.neutral,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  field: {
    width: '100%',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  dobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dobInput: {
    width: '30%',
    height: 34,
    paddingVertical: 0,
    includeFontPadding: false,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  dobInputFocused: {
    borderColor: Colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
    width: '100%',
  },
  gridChip: {
    width: '48%',
    justifyContent: 'center',
  },
  gridChipLabel: {
    textAlign: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabelSelected: {
    fontWeight: '600',
  },
  chipPressed: {
    opacity: 0.75,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.md,
  },
  photoItem: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  photoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  photoActionPressed: {
    opacity: 0.75,
  },
  photoActionDisabled: {
    opacity: 0.55,
  },
  photoHint: {
    maxWidth: 320,
  },
  locationRow: {
    width: '100%',
    alignItems: 'flex-start',
  },
  locationState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignSelf: 'flex-start',
  },
  locationStateBody: {
    gap: Spacing.xxs,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  modalCoinWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    marginBottom: Spacing.lg,
  },
  modalCoinIcon: {
    width: 52,
    height: 52,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalBody: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  modalHint: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
  },
});