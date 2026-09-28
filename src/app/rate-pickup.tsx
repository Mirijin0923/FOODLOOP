import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { StarRating } from '@/components/star-rating';

export default function RatePickupScreen() {
  const { listingId = '', revieweeId = '', name } = useLocalSearchParams<{ listingId?: string; revieweeId?: string; name?: string }>();
  const { user, listings, addReview } = useAppState();
  const listing = listings.find((entry) => entry.id === listingId);
  const [food, setFood] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState('');

  const submit = () => {
    if (!user || !food || !punctuality || !communication || !comment.trim() || !listing?.image) return;
    addReview({ listingId, reviewerId: user.email, revieweeId, foodQualityRating: food, punctualityRating: punctuality, communicationRating: communication, comment: comment.trim(), photo: listing.image });
    router.replace('/(tabs)/community');
  };

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[typography.labelSm, styles.kicker]}>PICKUP COMPLETE</Text>
    <Text style={[typography.headlineLg, styles.title]}>How was your exchange?</Text>
    <Text style={[typography.bodyMd, styles.subtitle]}>Your verified feedback helps the FoodLoop community trust one another.</Text>
    <RatingField label="Food Quality" value={food} onChange={setFood} />
    <RatingField label="Punctuality" value={punctuality} onChange={setPunctuality} />
    <RatingField label="Communication" value={communication} onChange={setCommunication} />
    <Text style={[typography.labelMd, styles.label]}>Feedback (required)</Text>
    <TextInput value={comment} onChangeText={setComment} multiline numberOfLines={4} placeholder={`Share a note about ${name ?? 'this pickup'}...`} placeholderTextColor={colors.secondary} style={[typography.bodyMd, styles.input, styles.textArea]} />
    <Pressable style={[styles.submit, (!food || !punctuality || !communication || !comment.trim() || !listing?.image) && styles.submitDisabled]} disabled={!food || !punctuality || !communication || !comment.trim() || !listing?.image} onPress={submit}><Text style={[typography.labelLg, styles.submitText]}>Submit Rating</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function RatingField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <View style={styles.ratingField}><Text style={[typography.labelLg, styles.ratingLabel]}>{label}</Text><StarRating value={value} onChange={onChange} /></View>; }

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.surface }, content: { padding: spacing.screenGutter, gap: spacing.lg, paddingBottom: spacing.xxxxl }, kicker: { color: colors.tertiary }, title: { color: colors.onSurface }, subtitle: { color: colors.secondary }, ratingField: { backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm }, ratingLabel: { color: colors.onSurface }, label: { color: colors.secondary }, input: { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurface, borderRadius: radius.lg, paddingHorizontal: spacing.md }, textArea: { minHeight: 100, paddingTop: spacing.md, textAlignVertical: 'top' }, submit: { height: 52, borderRadius: radius.DEFAULT, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }, submitDisabled: { opacity: 0.45 }, submitText: { color: colors.onPrimary }, skip: { alignItems: 'center', padding: spacing.sm }, skipText: { color: colors.secondary } });
