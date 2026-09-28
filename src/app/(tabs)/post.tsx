// Post Surplus Food — Pass It On
// Drop into: src/app/(tabs)/post.tsx

import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

// Same category names as the Home Feed filters, so a new post shows up
// under the matching category there.
const CATEGORIES = ['Fresh Bakery', 'Prepared Meals', 'Groceries & Veg', 'Pantry', 'Beverages'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free'];

export default function PostSurplusScreen() {
  const { addListing, updateListing, listings, isSignedIn } = useAppState();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const editingListing = editId ? listings.find((listing) => listing.id === editId) : undefined;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [servings, setServings] = useState(4);
  const [address, setAddress] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Vegan']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [justPosted, setJustPosted] = useState(false);

  React.useEffect(() => {
    if (!editingListing) return;
    setTitle(editingListing.title);
    setDescription(editingListing.description);
    setCategory(editingListing.category);
    setServings(Number.parseInt(editingListing.portionsLabel, 10) || 1);
    setAddress(editingListing.address);
    setSelectedTags(editingListing.tags);
    setPhotos(editingListing.image ? [editingListing.image] : []);
  }, [editingListing?.id]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setServings(4);
    setAddress('');
    setSelectedTags(['Vegan']);
    setPhotos([]);
    setErrors([]);
    setJustPosted(false);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!editId) resetForm();
  }, [editId, resetForm]));

  const pickPhotos = async () => {
    if (!isSignedIn) {
      router.push('/?auth=login');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos(result.assets.slice(0, 3).map((asset) => asset.uri));
  };

  const handleSubmit = () => {
    if (!isSignedIn) {
      router.push('/?auth=login');
      return;
    }
    const nextErrors: string[] = [];
    if (!title.trim()) nextErrors.push('Food title is required.');
    if (!address.trim()) nextErrors.push('Pickup address is required.');
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const data = {
      title: title.trim(),
      image: photos[0] ?? editingListing?.image,
      description: description.trim() || 'Fresh surplus food, ready for pickup.',
      category,
      portionsLabel: `${servings} Serving${servings === 1 ? '' : 's'}`,
      distance: '0.1 km away',
      expiresLabel: 'Expires in 6h',
      tags: selectedTags,
      address: address.trim(),
    };

    if (editingListing) {
      const save = () => {
        updateListing(editingListing.id, { ...data, pickupDeadline: editingListing.pickupDeadline });
        router.replace('/(tabs)');
      };
      const criticalChanged = editingListing.status !== 'available' && (data.portionsLabel !== editingListing.portionsLabel || data.expiresLabel !== editingListing.expiresLabel);
      if (criticalChanged) {
        Alert.alert('Claimed item', 'This item has already been claimed. Editing may affect the pickup. Continue?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: save }]);
      } else save();
      return;
    }

    addListing(data);

    resetForm();
    setJustPosted(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[typography.labelSm, styles.passItOn]}>PASS IT ON</Text>
          <Text style={[typography.headlineLg, styles.headerTitle]}>Share Surplus Food</Text>
          <Text style={[typography.bodyMd, styles.headerSubtitle]}>
            Turn wholesome surplus into a warm community meal in your neighborhood.
          </Text>
        </View>

        {errors.length > 0 && (
          <View style={styles.errorBanner}>
            {errors.map((err) => (
              <Text key={err} style={[typography.bodySm, styles.errorText]}>
                • {err}
              </Text>
            ))}
          </View>
        )}

        {justPosted && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.onTertiary} />
            <Text style={[typography.bodySm, styles.successText]}>
              Posted! Taking you to the Feed...
            </Text>
          </View>
        )}

        <Pressable style={styles.uploadZone} onPress={pickPhotos}>
          {photos.length > 0 ? (
            <View style={styles.photoRow}>
              {photos.map((photo) => <Image key={photo} source={{ uri: photo }} style={styles.photoPreview} />)}
            </View>
          ) : <Ionicons name="camera" size={28} color={colors.primaryContainer} />}
          <Text style={[typography.labelLg, styles.uploadTitle]}>{photos.length ? 'Change Food Photos' : 'Add Food Photos'}</Text>
          <Text style={[typography.bodySm, styles.uploadHint]}>Choose up to 3 clear photos showing the food and original packaging (PNG, JPG)</Text>
        </Pressable>

        <Field label="Food Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fresh Artisan Sourdough & Croissants"
            placeholderTextColor={colors.secondary}
            style={[typography.bodyMd, styles.input, !title && errors.length > 0 && styles.inputError]}
          />
        </Field>

        <Field label="Description (optional)">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's included, how it was stored, best-by details..."
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={3}
            style={[typography.bodyMd, styles.input, styles.textArea]}
          />
        </Field>

        <Field label="Category">
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[typography.labelMd, category === c ? styles.chipTextActive : styles.chipText]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Portions Available">
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperButton} onPress={() => setServings((s) => Math.max(1, s - 1))}>
              <Ionicons name="remove" size={18} color={colors.onSurface} />
            </Pressable>
            <Text style={[typography.headlineSm, styles.stepperValue]}>{servings} servings</Text>
            <Pressable style={styles.stepperButton} onPress={() => setServings((s) => s + 1)}>
              <Ionicons name="add" size={18} color={colors.onSurface} />
            </Pressable>
          </View>
        </Field>

        <Field label="Pickup Address & Neighborhood">
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="742 Evergreen Terrace (Porch Box #4)"
            placeholderTextColor={colors.secondary}
            style={[typography.bodyMd, styles.input, !address && errors.length > 0 && styles.inputError]}
          />
        </Field>

        <Field label="Dietary & Safety Tags">
          <View style={styles.chipRow}>
            {DIETARY_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[typography.labelMd, active ? styles.chipTextActive : styles.chipText]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={[typography.labelLg, styles.submitButtonText]}>Share Food Now</Text>
        </Pressable>
        <Text style={[typography.bodySm, styles.pledgeText]}>
          By sharing, you affirm the food was handled safely in accordance with the Community Fresh Pledge.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[typography.labelMd, styles.fieldLabel]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.screenGutter, paddingBottom: spacing.xxxxl, gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  passItOn: { color: colors.primaryContainer, textTransform: 'uppercase' },
  headerTitle: { color: colors.onSurface },
  headerSubtitle: { color: colors.secondary },
  errorBanner: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  errorText: { color: colors.onError },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  successText: { color: colors.onTertiary },
  textArea: { height: 88, paddingTop: spacing.sm, textAlignVertical: 'top' },
  uploadZone: {
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  uploadTitle: { color: colors.onSurface },
  uploadHint: { color: colors.secondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  photoRow: { flexDirection: 'row', gap: spacing.sm },
  photoPreview: { width: 72, height: 72, borderRadius: radius.md },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.secondary },
  input: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
  },
  inputError: { borderWidth: 1, borderColor: colors.error },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipActive: { backgroundColor: colors.primaryContainer },
  chipText: { color: colors.onSurface },
  chipTextActive: { color: colors.onPrimary },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { color: colors.onSurface },
  submitButton: {
    height: 52,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: { color: colors.onPrimary },
  pledgeText: { color: colors.secondary, textAlign: 'center' },
});
