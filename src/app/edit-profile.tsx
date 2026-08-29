import { AntDesign, FontAwesome } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { toast } from '@/lib/toast';
import {
  deleteAccount,
  getUserProfile,
  updateUserProfile,
  type GenderCode,
  type InterestedInCode,
  type PhotoDraft,
  type ProfilePhoto,
  type RelationshipGoalCode,
} from '@/services/profile-service';
import {
  toUserProfile,
  useAuthStore,
} from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/layout';

const MAX_PHOTOS = 3;

type PhotoState =
  | { kind: 'existing'; id: string; url: string }
  | { kind: 'new'; asset: ImagePicker.ImagePickerAsset };

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

const RELATIONSHIP_OPTIONS: { label: string; value: RelationshipGoalCode }[] = [
  { label: 'Parchar', value: 'CASUAL' },
  { label: 'Amistad', value: 'FRIENDSHIP' },
  { label: 'Relación', value: 'RELATIONSHIP' },
  { label: 'Solo conversar', value: 'CHAT' },
  { label: 'Dejar que fluya', value: 'LET_IT_FLOW' },
  { label: 'Algo casual', value: 'LIGHT_CASUAL' },
];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
      {children}
    </AppText>
  );
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
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="tag"
        color={selected ? Colors.white : Colors.text}
        style={[styles.chipText, selected && styles.chipTextSelected, labelStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {label}
      </AppText>
      {selected ? <AntDesign name="check" size={12} color={Colors.white} /> : null}
    </Pressable>
  );
}

function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
}

function EditProfileSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.card}>
        <Skeleton style={styles.skeletonLabel} />
        <View style={styles.photoRow}>
          <Skeleton style={styles.skeletonPhoto} />
          <Skeleton style={styles.skeletonPhoto} />
          <Skeleton style={styles.skeletonPhoto} />
        </View>
      </View>

      <View style={styles.card}>
        <Skeleton style={styles.skeletonLabel} />
        <Skeleton style={styles.skeletonInput} />
        <Skeleton style={styles.skeletonInput} />
        <Skeleton style={styles.skeletonInput} />
      </View>

      <View style={styles.card}>
        <Skeleton style={styles.skeletonLabel} />
        <Skeleton style={styles.skeletonBio} />
      </View>

      <View style={styles.card}>
        <Skeleton style={styles.skeletonLabel} />
        <View style={styles.chipRow}>
          <Skeleton style={styles.skeletonChip} />
          <Skeleton style={styles.skeletonChip} />
          <Skeleton style={styles.skeletonChip} />
        </View>
      </View>

      <Skeleton style={styles.skeletonButton} />
    </View>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<GenderCode | null>(null);
  const [interestedIn, setInterestedIn] = useState<InterestedInCode | null>(null);
  const [relationshipGoal, setRelationshipGoal] =
    useState<RelationshipGoalCode | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<PhotoState[]>([]);

  const maxBirthDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const profile = await getUserProfile(session.user.id, session);
        if (cancelled) {
          return;
        }
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
        setBio(profile.bio ?? '');
        setGender(profile.gender);
        setInterestedIn(profile.interestedIn);
        setRelationshipGoal(profile.relationshipGoal);
        setBirthDate(profile.birthDate);
        setPhotos(
          (profile.photos ?? [])
            .filter(
              (photo): photo is ProfilePhoto & { id: string } => photo.id !== null,
            )
            .map((photo) => ({
              kind: 'existing',
              id: photo.id,
              url: photo.url,
            })),
        );
      } catch (error) {
        console.error('[edit-profile] load failed:', error);
        toast.error(
          'No se pudo cargar tu perfil',
          'Inténtalo de nuevo más tarde.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session]);

  function handleBack() {
    setShowDatePicker(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  function handleDateChange(
    _event: DateTimePickerChangeEvent,
    selectedDate: Date,
  ) {
    setBirthDate(toIsoDate(selectedDate));
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  async function handleAddPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(
        'Permiso de galería necesario',
        'Activa el acceso a tus fotos para agregar una foto de perfil.',
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

    setPhotos((current) => [...current, { kind: 'new', asset: result.assets[0] }]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSetProfile(index: number) {
    setPhotos((current) => {
      if (index <= 0) {
        return current;
      }
      const photo = current[index];
      if (!photo) {
        return current;
      }
      return [photo, ...current.filter((_, itemIndex) => itemIndex !== index)];
    });
  }

  async function handleSave() {
    if (!session || saving) {
      return;
    }

    if (!firstName.trim()) {
      toast.error('Falta tu nombre', 'Escribe tu nombre para continuar.');
      return;
    }
    if (!birthDate) {
      toast.error(
        'Falta tu fecha de nacimiento',
        'Selecciona tu fecha de nacimiento para continuar.',
      );
      return;
    }
    if (!gender) {
      toast.error(
        'Falta tu género',
        'Selecciona tu género para continuar.',
      );
      return;
    }

    setSaving(true);
    try {
      const photoDrafts: PhotoDraft[] = photos.map((photo) =>
        photo.kind === 'existing'
          ? { kind: 'existing', id: photo.id, url: photo.url }
          : { kind: 'new', asset: photo.asset },
      );

      const saved = await updateUserProfile(
        session.user.id,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          gender,
          birthDate,
          ...(interestedIn ? { interestedIn } : {}),
          ...(relationshipGoal ? { relationshipGoal } : {}),
        },
        photoDrafts,
        session,
      );

      toast.success(
        'Cambios guardados',
        'Tu perfil se actualizó correctamente.',
      );

      const current = useAuthStore.getState().profile;
      useAuthStore.getState().setProfile(
        toUserProfile(saved, {
          id: session.user.id,
          email: session.user.email ?? null,
          coinsBalance: current?.coinsBalance,
        }),
      );

      router.back();
    } catch (error) {
      console.error('[edit-profile] save failed:', error);
      toast.error(
        'No se pudieron guardar los cambios',
        'Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    if (!session || deleting) return;
    setShowDeleteModal(true);
  }

  async function confirmDeleteAccount() {
    if (!session || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(session);
      setShowDeleteModal(false);
      await useAuthStore.getState().logout();
      toast.success('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.');
      router.replace('/');
    } catch (error) {
      console.error('[edit-profile] delete account failed:', error);
      toast.error(
        'No se pudo eliminar la cuenta',
        'Int\u00E9ntalo de nuevo m\u00E1s tarde.',
      );
    } finally {
      setDeleting(false);
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
            { paddingTop: insets.top + 0 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}>
              <AntDesign name="left" size={20} color={Colors.white} />
            </Pressable>
            <AppText variant="h2" color={Colors.white} style={styles.title}>
              Editar perfil
            </AppText>
          </View>

          {loading ? (
            <EditProfileSkeleton />
          ) : (
            <>
              <View style={styles.card}>
                <FieldLabel>Fotos</FieldLabel>
                <View style={styles.photoRow}>
                  {photos.map((photo, index) => (
                    <View key={photo.kind === 'existing' ? photo.id : `new-${index}`} style={styles.photoItem}>
                      <Image
                        source={{
                          uri:
                            photo.kind === 'existing'
                              ? photo.url
                              : photo.asset.uri,
                        }}
                        style={styles.photoPreview}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() => handleSetProfile(index)}
                        hitSlop={8}
                        accessibilityLabel={
                          index === 0
                            ? 'Foto principal'
                            : 'Establecer como foto principal'
                        }
                        style={({ pressed }) => [
                          styles.photoStar,
                          pressed && styles.pressed,
                        ]}>
                        <FontAwesome
                          name={index === 0 ? 'star' : 'star-o'}
                          size={13}
                          color={Colors.gold}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemovePhoto(index)}
                        hitSlop={8}
                        accessibilityLabel="Quitar foto"
                        style={({ pressed }) => [
                          styles.photoRemove,
                          pressed && styles.pressed,
                        ]}>
                        <AntDesign name="close" size={13} color={Colors.white} />
                      </Pressable>
                    </View>
                  ))}
                  {photos.length < MAX_PHOTOS ? (
                    <Pressable
                      onPress={() => void handleAddPhoto()}
                      accessibilityLabel="Agregar foto"
                      style={({ pressed }) => [
                        styles.photoAdd,
                        pressed && styles.pressed,
                      ]}>
                      <AntDesign name="plus" size={28} color={Colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.card}>
                <FieldLabel>Datos personales</FieldLabel>

                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />

                <Pressable
                  onPress={() => setShowDatePicker((visible) => !visible)}
                  style={({ pressed }) => [
                    styles.dateButton,
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    variant="label"
                    color={birthDate ? Colors.text : Colors.textMuted}>
                    {birthDate ?? 'Selecciona tu fecha'}
                  </AppText>
                  <AntDesign name="calendar" size={16} color={Colors.textMuted} />
                </Pressable>

                {showDatePicker ? (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={birthDate ? new Date(`${birthDate}T00:00:00`) : maxBirthDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={maxBirthDate}
                      minimumDate={new Date(1940, 0, 1)}
                      themeVariant="dark"
                      textColor={Colors.white}
                      accentColor={Colors.primary}
                      onValueChange={handleDateChange}
                      onDismiss={() => setShowDatePicker(false)}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
                <FieldLabel>Sobre ti</FieldLabel>
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
                <AppText variant="caption" color={Colors.textMuted} style={styles.hint}>
                  Opcional · hasta 500 caracteres
                </AppText>
              </View>

              <View style={styles.card}>
                <FieldLabel>Preferencias básicas</FieldLabel>

                <View style={styles.field}>
                  <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
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

                <View style={styles.field}>
                  <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
                    Interesado en
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
                  <AppText variant="tag" color={Colors.textMuted} style={styles.fieldLabel}>
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

              <View style={styles.dangerSection}>
                <View style={styles.dangerDivider} />
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.pressed,
                    deleting && styles.dangerButtonDisabled,
                  ]}>
                  <AntDesign name="delete" size={18} color={Colors.white} />
                  <AppText
                    variant="bodyMedium"
                    color={Colors.white}
                    style={styles.dangerButtonText}>
                    {deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="h3" color={Colors.text} style={styles.modalTitle}>
              Eliminar Cuenta
            </AppText>
            <AppText
              variant="bodyMedium"
              color={Colors.textMuted}
              style={styles.modalText}>
              {'\u26A0\uFE0F Est\u00E1s seguro? Esta acci\u00F3n es irreversible y perder\u00E1s todos tus Cuy Coins, matches y chats para siempre.'}
            </AppText>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonCancel,
                  pressed && styles.pressed,
                ]}>
                <AppText variant="bodyMedium" color={Colors.text} style={styles.modalButtonText}>
                  Cancelar
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => void confirmDeleteAccount()}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonDelete,
                  pressed && styles.pressed,
                  deleting && styles.dangerButtonDisabled,
                ]}>
                <AppText variant="bodyMedium" color={Colors.white} style={styles.modalButtonText}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </AppText>
              </Pressable>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignSelf: 'stretch',
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
  title: {
    textAlign: 'left',
  },
  skeleton: {
    backgroundColor: '#E6E8EB',
    borderRadius: Radius.md,
  },
  skeletonWrap: {
    width: '100%',
  },
  skeletonLabel: {
    width: 120,
    height: 14,
    marginBottom: Spacing.md,
  },
  skeletonPhoto: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
  },
  skeletonInput: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  skeletonBio: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
  },
  skeletonChip: {
    width: 140,
    height: 36,
    borderRadius: Radius.pill,
  },
  skeletonButton: {
    width: '100%',
    height: 56,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
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
    marginBottom: Spacing.xs,
  },
  photoRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoItem: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoStar: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoAdd: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
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
    marginBottom: Spacing.md,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    textAlign: 'left',
  },
  dateButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  datePickerContainer: {
    width: '100%',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(27,27,31,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  field: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  chipRow: {
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
  chipText: {
    textAlign: 'left',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  dangerSection: {
    width: '100%',
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  dangerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: Spacing.lg,
  },
  dangerButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  dangerButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    width: '85%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
  },
  modalButtonCancel: {
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonDelete: {
    backgroundColor: Colors.danger,
  },
  modalButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});