// Home Feed — Browse Surplus Food
// Drop into: src/app/(tabs)/index.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState, type FoodListing } from '@/context/app-state';
import { authApi } from '@/services/auth-api';
import { ClaimConfirmationModal } from '@/components/claim-confirmation-modal';
import { FoodImage } from '@/components/food-image';

const CATEGORIES = ['All', 'Fresh Bakery', 'Prepared Meals', 'Groceries & Veg', 'Pantry', 'Beverages'];

export default function HomeFeedScreen() {
  const { listings, isSignedIn, user, claimListing, expireListings, notifyDonor, sendConversationMessage, logout, login } = useAppState();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [claimNotice, setClaimNotice] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [claimCandidate, setClaimCandidate] = useState<FoodListing | null>(null);
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    expireListings();
    if (isSignedIn) return;
    setActiveCategory(CATEGORIES[0]);
    setQuery('');
    setShowNotifications(false);
    setClaimNotice('');
  }, [isSignedIn, expireListings]);

  const filteredCards = useMemo(() => {
    return listings.filter((card) => {
      const matchesCategory = activeCategory === 'All' || card.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery && card.status !== 'completed' && card.status !== 'expired';
    });
  }, [listings, activeCategory, query]);

  const handleClaim = (id: string) => {
    if (!isSignedIn) {
      setShowSignInModal(true);
      return;
    }
    setClaimError('');
    setClaimCandidate(listings.find((item) => item.id === id) ?? null);
  };

  const confirmClaim = () => {
    if (!claimCandidate || !user) return;
    const claimerId = user.email;
    const conversationId = claimListing(claimCandidate.id, claimerId);
    if (!conversationId) {
      setClaimError('This item was just claimed by someone else');
      return;
    }
    notifyDonor(claimCandidate.id, claimerId);
    sendConversationMessage(conversationId, `Claim request sent for ${claimCandidate.title}. I will coordinate pickup here.`);
    setClaimCandidate(null);
    setClaimNotice(`You claimed ${claimCandidate.title}. Your pickup chat is ready.`);
    router.push({ pathname: '/chat-thread', params: { conversationId, listingId: claimCandidate.id, name: claimCandidate.donorName, image: claimCandidate.image, item: claimCandidate.title } });
  };

  const handleSignIn = async () => {
    try {
      const { user: authenticatedUser } = await authApi.login(loginEmail, loginPassword);
      login(authenticatedUser.email ?? loginEmail.trim(), authenticatedUser.name);
      setLoginError('');
      setShowLoginModal(false);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to log in.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/foodloop_logo.png')} style={styles.logoDot} resizeMode="contain" />
          <Text style={[typography.headlineSm, styles.headerTitle]}>FOODLOOP</Text>
        </View>
        <Pressable
          style={styles.signInButton}
          onPress={() => (isSignedIn ? setShowAccountMenu(true) : setShowLoginModal(true))}
        >
          <View style={styles.signInAvatar}>
            {isSignedIn ? (
              user!.avatar ? <Image source={{ uri: user!.avatar }} style={styles.signInAvatarImage} /> : <Text style={[typography.labelSm, styles.signInAvatarText]}>{user!.initials}</Text>
            ) : (
              <Ionicons name="person" size={14} color={colors.onPrimary} />
            )}
          </View>
          <Text style={[typography.labelSm, styles.signInText]}>
            {isSignedIn ? user!.name.split(' ')[0] : 'Sign In'}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={colors.secondary} style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search fresh produce, meals, bakery..."
              placeholderTextColor={colors.secondary}
              style={[typography.bodyMd, styles.searchInput]}
            />
            <Pressable style={styles.filterButton} onPress={() => setActiveCategory('All')}>
              <MaterialIcons name="tune" size={16} color={colors.secondary} />
            </Pressable>
          </View>
          <Pressable style={styles.bellButton} onPress={() => setShowNotifications((visible) => !visible)}>
            <Ionicons name="notifications" size={20} color={colors.onSurface} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {showNotifications && (
          <View style={styles.notificationBanner}>
            <Text style={[typography.bodySm, styles.notificationText]}>New surplus listings are available near you.</Text>
          </View>
        )}

        {!!claimNotice && (
          <Pressable style={styles.claimNotice} onPress={() => setClaimNotice('')}>
            <Ionicons name="checkmark-circle" size={16} color={colors.onTertiary} />
            <Text style={[typography.bodySm, styles.claimNoticeText]}>{claimNotice}</Text>
          </Pressable>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            const count = category === 'All' ? listings.length : listings.filter((l) => l.category === category).length;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Text style={[typography.labelMd, isActive ? styles.categoryTextActive : styles.categoryText]}>
                  {category} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.cardsContainer}>
          {filteredCards.length === 0 ? (
            <Text style={[typography.bodyMd, styles.emptyText]}>
              No listings match your search yet — try a different category or keyword.
            </Text>
          ) : (
            filteredCards.map((card) => (
              <FoodCardItem key={card.id} card={card} isOwner={user?.email === card.donorId} onClaim={() => handleClaim(card.id)} onEdit={() => router.push({ pathname: '/post', params: { editId: card.id } })} />
            ))
          )}
        </View>
      </ScrollView>

      {showSignInModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineMd, styles.modalTitle]}>Sign in to claim food</Text>
            <Text style={[typography.bodyMd, styles.modalBody]}>
              Create a free account or sign in to coordinate pickup with the donor.
            </Text>
            <Pressable
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSignInModal(false);
                setShowSignInModal(false);
                setShowLoginModal(true);
              }}
            >
              <Text style={[typography.labelLg, styles.claimButtonText]}>Log In</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => setShowSignInModal(false)}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => { setShowSignInModal(false); router.push('/signup'); }}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Create an Account</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showAccountMenu && user && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineMd, styles.modalTitle]}>{user.name}</Text>
            <Text style={[typography.bodySm, styles.modalBody]}>{user.email}</Text>
            <Pressable
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowAccountMenu(false);
                router.push('/profile');
              }}
            >
              <Text style={[typography.labelLg, styles.claimButtonText]}>View Profile</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => { logout(); setShowAccountMenu(false); router.replace('/'); }}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Log Out</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => setShowAccountMenu(false)}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showLoginModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineMd, styles.modalTitle]}>Log In to FoodLoop</Text>
            <TextInput
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="Email address"
              placeholderTextColor={colors.secondary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[typography.bodyMd, styles.loginInput]}
            />
            <TextInput
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Password"
              placeholderTextColor={colors.secondary}
              secureTextEntry
              style={[typography.bodyMd, styles.loginInput]}
            />
            {!!loginError && <Text style={[typography.bodySm, styles.loginError]}>{loginError}</Text>}
            <Pressable style={styles.modalPrimaryButton} onPress={handleSignIn}>
              <Text style={[typography.labelLg, styles.claimButtonText]}>Log In</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => { setShowLoginModal(false); router.push('/signup'); }}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Create an Account</Text>
            </Pressable>
            <Pressable style={styles.modalSecondaryButton} onPress={() => setShowLoginModal(false)}>
              <Text style={[typography.labelMd, styles.modalSecondaryText]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
      <ClaimConfirmationModal
        listing={claimCandidate}
        visible={!!claimCandidate}
        error={claimError}
        onCancel={() => { setClaimCandidate(null); setClaimError(''); }}
        onConfirm={confirmClaim}
      />
    </SafeAreaView>
  );
}

function FoodCardItem({ card, isOwner, onClaim, onEdit }: { card: FoodListing; isOwner: boolean; onClaim: () => void; onEdit: () => void }) {
  const claimed = !!card.claimedBy;
  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrapper}>
        <FoodImage image={card.image} style={styles.cardImage} />
        <View style={styles.expiryBadge}>
          <View style={styles.expiryDot} />
          <Text style={[typography.labelSm, styles.expiryText]}>{card.expiresLabel.toUpperCase()}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Ionicons name="location-sharp" size={12} color={colors.tertiary} />
          <Text style={[typography.labelSm, styles.distanceText]}>{card.distance}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.donorRow}>
          <View style={styles.donorLeft}>
            <View style={styles.donorAvatar}>
              <Text style={[typography.labelSm, styles.donorInitials]}>{card.donorInitials}</Text>
            </View>
            <Text style={[typography.labelMd, styles.donorName]}>{card.donorName}</Text>
            <Ionicons name="checkmark-circle" size={14} color={colors.tertiary} />
          </View>
          <Text style={[typography.labelSm, styles.portionsBadge]}>{card.portionsLabel.toUpperCase()}</Text>
        </View>

        <Text style={[typography.headlineMd, styles.cardTitle]}>{card.title}</Text>
        <Text style={[typography.bodySm, styles.cardDescription]} numberOfLines={1}>
          {card.description}
        </Text>

        <View style={styles.tagsRow}>
          <View style={styles.tagsLeft}>
            {card.tags.map((tag) => (
              <Text key={tag} style={[typography.labelSm, styles.tag]}>
                {tag}
              </Text>
            ))}
          </View>
          {isOwner ? (
            <Pressable style={styles.editButton} onPress={onEdit}><Text style={[typography.labelLg, styles.editButtonText]}>Edit</Text></Pressable>
          ) : (
            <Pressable style={[styles.claimButton, claimed && styles.claimButtonDisabled]} onPress={onClaim} disabled={claimed}>
              <Text style={[typography.labelLg, styles.claimButtonText, claimed && styles.claimedButtonText]}>{claimed ? 'Claimed' : 'Claim Food'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.screenGutter,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoDot: { width: 24, height: 24, borderRadius: radius.full },
  headerTitle: { color: colors.onSurface, textTransform: 'uppercase' },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  signInAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInAvatarText: { color: colors.onPrimary, fontWeight: '700' },
  signInAvatarImage: { width: 24, height: 24, borderRadius: radius.full },
  signInText: { color: colors.onSurface },
  editButton: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.DEFAULT, borderWidth: 1, borderColor: colors.tertiary, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { color: colors.tertiary },
  scrollContent: { paddingBottom: spacing.xxxxl },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing.sm,
  },
  searchInputWrapper: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  searchInput: {
    height: 44,
    paddingLeft: 40,
    paddingRight: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
  },
  filterButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
  },
  notificationBanner: { marginHorizontal: spacing.screenGutter, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.tertiaryContainer },
  notificationText: { color: colors.onTertiary },
  claimNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.screenGutter, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.tertiaryContainer },
  claimNoticeText: { color: colors.onTertiary, flex: 1 },
  categoryRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  categoryPillActive: { backgroundColor: colors.primaryContainer },
  categoryText: { color: colors.onSurface },
  categoryTextActive: { color: colors.onPrimary },
  cardsContainer: { paddingHorizontal: spacing.screenGutter, gap: spacing.lg, marginTop: spacing.sm },
  emptyText: { color: colors.secondary, textAlign: 'center', paddingVertical: spacing.xxl },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: radius.xl, overflow: 'hidden' },
  cardImageWrapper: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceContainerLowest },
  cardImage: { width: '100%', height: '100%' },
  expiryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.DEFAULT,
    backgroundColor: 'rgba(255,82,93,0.9)',
  },
  expiryDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.onPrimary },
  expiryText: { color: colors.onPrimary, textTransform: 'uppercase' },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.DEFAULT,
    backgroundColor: 'rgba(13,14,15,0.8)',
  },
  distanceText: { color: colors.onSurface },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  donorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  donorAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorInitials: { color: colors.onSurface, fontWeight: '700' },
  donorName: { color: colors.onSurface },
  portionsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHighest,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  cardTitle: { color: colors.onSurface },
  cardDescription: { color: colors.secondary, marginTop: 2 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  tagsLeft: { flexDirection: 'row', gap: 6, flex: 1 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.surfaceContainerHighest,
    color: colors.onSurface,
  },
  claimButton: {
    paddingHorizontal: spacing.lg,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.primaryContainer,
  },
  claimButtonDisabled: { backgroundColor: colors.surfaceContainerHighest },
  claimButtonText: { color: colors.onPrimary },
  claimedButtonText: { color: colors.onSurface },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: { color: colors.onSurface },
  modalBody: { color: colors.secondary },
  modalPrimaryButton: {
    height: 48,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { color: colors.secondary },
  loginInput: { height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: spacing.md, color: colors.onSurface },
  loginError: { color: colors.error },
});
