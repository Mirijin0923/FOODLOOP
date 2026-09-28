import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/foodloop-theme';

export function VerifiedPickupBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return <View style={styles.badge}><Ionicons name="checkmark-circle" size={13} color={colors.tertiary} /><Text style={[typography.labelSm, styles.text]}>VERIFIED PICKUP</Text></View>;
}

const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: colors.tertiaryContainer + '33' }, text: { color: colors.tertiary } });
