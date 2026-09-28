// Community & Impact Hub
// Drop into: src/app/(tabs)/community.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { VerifiedPickupBadge } from '@/components/verified-pickup-badge';
import { RatingSummaryCard } from '@/components/rating-summary-card';
import { StarRating } from '@/components/star-rating';

export default function CommunityImpactScreen() {
  const { reviews, user, listings } = useAppState();
  const completedPickups = listings.filter((listing) => listing.status === 'completed').length;
  const goalPercent = Math.min(100, Math.round((completedPickups / 200) * 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[typography.labelSm, styles.livePulse]}>● LIVE METRO PULSE</Text>
        <Text style={[typography.headlineLg, styles.title]}>Community</Text>
        <Text style={[typography.bodyMd, styles.subtitle]}>Together we close the food loop.</Text>

        {user && <RatingSummaryCard userId={reviews[0]?.revieweeId ?? user.email} />}

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={[typography.labelMd, styles.goalTitle]}>Monthly Neighborhood Goal</Text>
            <Text style={[typography.labelSm, styles.goalPercent]}>{goalPercent}% Reached</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goalPercent}%` }]} />
          </View>
          <View style={styles.goalFooter}>
            <Text style={[typography.bodySm, styles.goalFooterText]}>{completedPickups} of 200 completed pickups</Text>
            <Text style={[typography.bodySm, styles.goalFooterText]}>Community goal</Text>
          </View>
        </View>

        <Text style={[typography.headlineMd, styles.reviewsTitle]}>Thank-you notes</Text>
        {reviews.length === 0 ? <Text style={[typography.bodySm, styles.emptyReviews]}>Completed pickups will appear here with verified community feedback.</Text> : reviews.map((review) => {
          const average = (review.foodQualityRating + review.punctualityRating + review.communicationRating) / 3;
          const reviewerName = review.reviewerId === user?.email ? user.name : review.reviewerId;
          return <View key={review.id} style={styles.reviewCard}>
            {review.photo && <Image source={{ uri: review.photo }} style={styles.reviewPhoto} />}
            <View style={styles.reviewHeader}><View style={styles.reviewAuthor}><Text style={[typography.labelLg, styles.reviewName]}>{reviewerName}</Text><VerifiedPickupBadge verified={review.verifiedPickup} /></View><StarRating value={Math.round(average)} readOnly /></View>
            <Text style={[typography.bodyMd, styles.reviewText]}>{`${reviewerName} confirmed pickup from ${review.revieweeId} ⭐${average.toFixed(1)} — "${review.comment}"`}</Text>
          </View>;
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.screenGutter, paddingBottom: spacing.xxxxl, gap: spacing.md },
  livePulse: { color: colors.primaryContainer },
  title: { color: colors.onSurface },
  subtitle: { color: colors.secondary, marginBottom: spacing.sm },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  networkLabel: { color: colors.secondary },
  networkValue: { color: colors.onSurface },
  divertedBadge: {
    color: colors.tertiary,
    backgroundColor: colors.tertiaryContainer + '33',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBlock: { flex: 1, backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing.sm, gap: 2 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { color: colors.secondary },
  statValue: { color: colors.primaryContainer },
  statSub: { color: colors.secondary },
  infoTooltip: { backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  infoTooltipTitle: { color: colors.tertiary },
  infoTooltipBody: { color: colors.secondary },
  goalCard: { backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalTitle: { color: colors.onSurface },
  goalPercent: { color: colors.tertiary },
  progressTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primaryContainer },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalFooterText: { color: colors.secondary },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  rosterTitle: { color: colors.onSurface },
  monthDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHigh,
  },
  monthDropdownText: { color: colors.secondary },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: 4 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.DEFAULT },
  tabButtonActive: { backgroundColor: colors.surfaceContainerHighest },
  tabText: { color: colors.secondary },
  tabTextActive: { color: colors.onSurface },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  donorRowYou: { backgroundColor: colors.primaryContainer + '22', borderWidth: 1, borderColor: colors.primaryContainer },
  donorRank: { color: colors.secondary, width: 24 },
  donorName: { color: colors.onSurface },
  donorBadge: { color: colors.tertiary },
  donorMeals: { color: colors.primaryContainer },
  donorMealsLabel: { color: colors.secondary },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  privacyText: { color: colors.secondary },
  reviewsTitle: { color: colors.onSurface, marginTop: spacing.md },
  emptyReviews: { color: colors.secondary },
  reviewCard: { backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  reviewPhoto: { width: '100%', height: 150, borderRadius: radius.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  reviewAuthor: { flex: 1, gap: spacing.xs },
  reviewName: { color: colors.onSurface },
  reviewText: { color: colors.secondary },
});
