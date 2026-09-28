import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import type { FoodListing } from '@/context/app-state';

export function ClaimConfirmationModal({ listing, visible, onCancel, onConfirm, error }: { listing: FoodListing | null; visible: boolean; onCancel: () => void; onConfirm: () => void; error?: string }) {
  if (!visible || !listing) return null;
  return <View style={styles.overlay}><View style={styles.modal}>
    <Image source={{ uri: listing.image }} style={styles.image} />
    <Text style={[typography.headlineMd, styles.title]}>Claim this food?</Text>
    <Text style={[typography.bodyMd, styles.description]}>{listing.title}</Text>
    <View style={styles.details}><Detail label="Portions" value={listing.portionsLabel} /><Detail label="Pickup window" value={listing.expiresLabel} /><Detail label="General area" value={`${listing.distance} from you`} /></View>
    {!!error && <Text style={[typography.bodySm, styles.error]}>{error}</Text>}
    <Pressable style={styles.confirm} onPress={onConfirm}><Text style={[typography.labelLg, styles.confirmText]}>Confirm Claim</Text></Pressable>
    <Pressable style={styles.cancel} onPress={onCancel}><Text style={[typography.labelMd, styles.cancelText]}>Cancel</Text></Pressable>
  </View></View>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={[typography.labelSm, styles.label]}>{label}</Text><Text style={[typography.bodySm, styles.value]}>{value}</Text></View>; }

const styles = StyleSheet.create({ overlay: { position: 'absolute', inset: 0, backgroundColor: '#00000099', justifyContent: 'center', padding: spacing.lg, zIndex: 5 }, modal: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md }, image: { width: '100%', height: 150, borderRadius: radius.lg }, title: { color: colors.onSurface }, description: { color: colors.secondary }, details: { gap: spacing.sm, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: spacing.md }, detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, label: { color: colors.secondary }, value: { color: colors.onSurface, textAlign: 'right', flex: 1 }, error: { color: colors.error }, confirm: { height: 48, borderRadius: radius.DEFAULT, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }, confirmText: { color: colors.onPrimary }, cancel: { alignItems: 'center', padding: spacing.sm }, cancelText: { color: colors.secondary } });
