// Interactive Map View — Food Rescues
// Drop into: src/app/(tabs)/map.tsx
//
// NOTE: This is a static, styled layout matching your Stitch design.
// For a REAL interactive map (pan/zoom, live GPS), install and swap in
// react-native-maps or expo-maps, then place these same pin/legend
// components as overlays on top of the <MapView>.
// Install: npx expo install react-native-maps

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { FoodImage } from '@/components/food-image';
import { AuthRequiredModal } from '@/components/auth-required-modal';

export default function MapScreen() {
  const { listings, user, createConversation } = useAppState();
  const [showLegend, setShowLegend] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(listings[0]?.id ?? '');
  const [locationMessage, setLocationMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listings.filter((listing) => listing.status !== 'completed' && listing.status !== 'expired' && (!normalized || `${listing.title} ${listing.description} ${listing.donorName} ${listing.category}`.toLowerCase().includes(normalized)));
  }, [listings, query]);
  const selectedListing = filteredListings.find((listing) => listing.id === selectedId) ?? filteredListings[0];
  const openListingConversation = () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!selectedListing) return;
    const conversationId = createConversation({ listingId: selectedListing.id, participantIds: [user.email, selectedListing.donorId], status: 'donation' });
    router.push({ pathname: '/chat-thread', params: { conversationId, listingId: selectedListing.id, name: selectedListing.donorName, image: selectedListing.image, item: selectedListing.title } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[typography.headlineSm, styles.headerTitle]}>FOODLOOP</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.secondary} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            const match = listings.find((listing) => listing.status !== 'completed' && listing.status !== 'expired' && `${listing.title} ${listing.donorName}`.toLowerCase().includes(text.trim().toLowerCase()));
            if (match) setSelectedId(match.id);
          }}
          placeholder="Search food or location..."
          placeholderTextColor={colors.secondary}
          style={[typography.bodyMd, styles.searchInput]}
        />
      </View>

      <View style={styles.mapArea}>
        {/* Placeholder map canvas. Swap this View for <MapView> once react-native-maps is installed. */}
        <View style={styles.mapCanvas}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1524666041070-9c876c7a2c1b?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.mapImage}
          />
          <View style={styles.mapTint} />
          {filteredListings.map((listing, index) => {
            const top = 48 + (index % 4) * 58;
            const left = 28 + (index % 3) * 112;
            return (
              <Pressable key={listing.id} onPress={() => setSelectedId(listing.id)}>
                <View style={[styles.pin, styles.pinDonor, { top, left }, selectedListing?.id === listing.id && styles.pinSelected]}>
                  <Ionicons name="storefront" size={14} color={colors.white} />
                </View>
                <Text style={[typography.labelSm, styles.pinLabel, { top: top - 20, left: Math.max(8, left - 12) }]} numberOfLines={1}>
                  {listing.donorName} · {listing.distance}
                </Text>
              </Pressable>
            );
          })}

        </View>

        <View style={styles.rightControls}>
          <Pressable style={styles.controlButton} onPress={() => {
            const closest = listings.find((listing) => listing.status !== 'completed' && listing.status !== 'expired');
            if (closest) setSelectedId(closest.id);
            setLocationMessage('Showing listings closest to your location.');
          }}>
            <Ionicons name="locate" size={18} color={colors.onSurface} />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setShowLegend((visible) => !visible)}>
            <Ionicons name="options" size={18} color={colors.onSurface} />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setLocationMessage(`${filteredListings.length} food listing${filteredListings.length === 1 ? '' : 's'} found.`)}>
            <Ionicons name="information-circle" size={18} color={colors.onSurface} />
          </Pressable>
        </View>

        {showLegend && (
          <View style={styles.legendCard}>
            <Text style={[typography.labelLg, styles.legendTitle]}>Map Legend</Text>
            <LegendRow color={colors.primaryContainer} label="Donor listing (person-to-person)" />
          </View>
        )}

        {!!locationMessage && (
          <View style={styles.locationToast}>
            <Text style={[typography.bodySm, styles.locationToastText]}>{locationMessage}</Text>
          </View>
        )}

        {selectedListing && <View style={styles.previewCard}>
          <View style={styles.previewHandle} />
          <View style={styles.previewRow}>
            <FoodImage image={selectedListing.image} style={styles.previewImage} />
            <View style={styles.previewInfo}>
              <Text style={[typography.headlineSm, styles.previewTitle]} numberOfLines={1}>{selectedListing.title}</Text>
              <Text style={[typography.bodySm, styles.previewSubtitle]}>{selectedListing.donorName} · {selectedListing.distance}</Text>
              <Text style={[typography.labelMd, styles.previewPickup]}>{selectedListing.portionsLabel} · {selectedListing.expiresLabel}</Text>
            </View>
            <Pressable style={styles.viewDetailsButton} onPress={openListingConversation}>
              <Ionicons name="chatbubble-ellipses" size={15} color={colors.onPrimary} />
              <Text style={[typography.labelMd, styles.viewDetailsText]}>Send Message</Text>
            </Pressable>
          </View>
        </View>}
      </View>
      <AuthRequiredModal visible={showAuthModal} title="Sign in to message a donor" body="Log in or create an account before starting a FoodLoop conversation." onClose={() => setShowAuthModal(false)} onAuthenticated={() => { setShowAuthModal(false); openListingConversation(); }} />
    </SafeAreaView>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[typography.bodySm, styles.legendLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.screenGutter, paddingVertical: spacing.sm },
  headerTitle: { color: colors.onSurface, textTransform: 'uppercase' },
  searchRow: { position: 'relative', marginHorizontal: spacing.screenGutter, marginBottom: spacing.sm },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  searchInput: {
    height: 44,
    paddingLeft: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
  },
  mapArea: { flex: 1, position: 'relative' },
  mapCanvas: { flex: 1, backgroundColor: colors.surfaceContainerLowest, position: 'relative', overflow: 'hidden' },
  mapImage: { ...StyleSheet.absoluteFill, opacity: 0.72 },
  mapTint: { ...StyleSheet.absoluteFill, backgroundColor: '#10252566' },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDonor: { backgroundColor: colors.primaryContainer },
  pinSelected: { borderWidth: 3, borderColor: colors.tertiary },
  pinBox: { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1.5, borderColor: colors.tertiary },
  pinLabel: {
    position: 'absolute',
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  clusterBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: { color: colors.onSurface },
  youMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  rightControls: { position: 'absolute', right: spacing.sm, top: spacing.lg, gap: spacing.xs },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendCard: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.sm,
    right: 56,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  locationToast: { position: 'absolute', left: spacing.sm, right: 56, bottom: 108, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.tertiaryContainer },
  locationToastText: { color: colors.onTertiary },
  legendTitle: { color: colors.onSurface, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  legendLabel: { color: colors.secondary, flex: 1 },
  previewCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
  },
  previewHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  previewRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  previewImage: { width: 56, height: 56, borderRadius: radius.md },
  previewInfo: { flex: 1, gap: 2 },
  previewTitle: { color: colors.onSurface },
  previewSubtitle: { color: colors.secondary },
  previewPickup: { color: colors.tertiary },
  viewDetailsButton: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: { color: colors.onPrimary },
});
