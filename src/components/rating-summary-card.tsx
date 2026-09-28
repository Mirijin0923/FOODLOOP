import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { StarRating } from './star-rating';

export function RatingSummaryCard({ userId }: { userId: string }) {
  const { reviews } = useAppState();
  const summary = useMemo(() => {
    const relevant = reviews.filter((review) => review.revieweeId === userId && review.verifiedPickup);
    if (!relevant.length) return { overall: 0, food: 0, punctuality: 0, communication: 0, count: 0 };
    const average = (key: 'foodQualityRating' | 'punctualityRating' | 'communicationRating') => relevant.reduce((sum, review) => sum + review[key], 0) / relevant.length;
    const food = average('foodQualityRating');
    const punctuality = average('punctualityRating');
    const communication = average('communicationRating');
    return { food, punctuality, communication, overall: (food + punctuality + communication) / 3, count: relevant.length };
  }, [reviews, userId]);
  return <View style={styles.card}>
    <View style={styles.top}><View><Text style={[typography.labelSm, styles.kicker]}>COMMUNITY TRUST</Text><Text style={[typography.headlineMd, styles.overall]}>{summary.overall.toFixed(1)} <Text style={styles.outOf}>/ 5</Text></Text></View><StarRating value={Math.round(summary.overall)} readOnly /></View>
    <View style={styles.scores}><Score label="Food Quality" value={summary.food} /><Score label="Punctuality" value={summary.punctuality} /><Score label="Communication" value={summary.communication} /></View>
    <Text style={[typography.bodySm, styles.count]}>{summary.count} completed pickup{summary.count === 1 ? '' : 's'}</Text>
  </View>;
}

function Score({ label, value }: { label: string; value: number }) { return <View style={styles.score}><Text style={[typography.labelSm, styles.label]}>{label}</Text><Text style={[typography.labelMd, styles.value]}>{value ? value.toFixed(1) : '--'}</Text></View>; }

const styles = StyleSheet.create({ card: { backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kicker: { color: colors.tertiary }, overall: { color: colors.onSurface }, outOf: { color: colors.secondary, fontSize: 13 }, scores: { flexDirection: 'row', gap: spacing.sm }, score: { flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.md, padding: spacing.sm, gap: 3 }, label: { color: colors.secondary }, value: { color: colors.primary }, count: { color: colors.secondary } });
