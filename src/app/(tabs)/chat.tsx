import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { FoodImage } from '@/components/food-image';
import { AuthRequiredModal } from '@/components/auth-required-modal';

const FILTERS = ['All', 'Active Pickups', 'Donations', 'Completed'] as const;

function formatTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatListScreen() {
  const { conversations, listings, user } = useAppState();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const [query, setQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const rows = useMemo(() => conversations
    .filter((conversation) => !!user && conversation.participantIds.includes(user.email))
    .map((conversation) => {
    const listing = conversation.listingId ? listings.find((item) => item.id === conversation.listingId) : undefined;
    return { conversation, listing, name: listing?.donorName ?? conversation.participantIds.find((id) => id !== 'demo@foodloop.com') ?? 'FoodLoop neighbor', role: listing ? 'FoodLoop Donor' : 'Community Member', item: listing?.title ?? 'Community conversation', image: listing?.image, statusLabel: conversation.status === 'active_pickup' ? 'Active Pickup' : conversation.status === 'completed' ? 'Completed' : undefined };
    }), [conversations, listings, user]);
  const filteredRows = rows.filter((row) => {
    const normalized = query.trim().toLowerCase();
    const matchesSearch = !normalized || `${row.name} ${row.item} ${row.conversation.listingId ?? ''}`.toLowerCase().includes(normalized);
    const matchesFilter = activeFilter === 'All' || (activeFilter === 'Active Pickups' && row.conversation.status === 'active_pickup') || (activeFilter === 'Donations' && row.conversation.status === 'donation') || (activeFilter === 'Completed' && row.conversation.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}><Text style={[typography.headlineSm, styles.headerTitle]}>Chat</Text></View>
    <View style={styles.searchRow}><Ionicons name="search" size={18} color={colors.secondary} style={styles.searchIcon} /><TextInput value={query} onChangeText={setQuery} placeholder="Search conversations or items..." placeholderTextColor={colors.secondary} style={[typography.bodyMd, styles.searchInput]} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{FILTERS.map((filter) => <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}><Text style={[typography.labelMd, activeFilter === filter ? styles.filterTextActive : styles.filterText]}>{filter}</Text></Pressable>)}</ScrollView>
    <ScrollView contentContainerStyle={styles.list}>
      {filteredRows.map(({ conversation, name, role, item, image, statusLabel }) => <Pressable key={conversation.id} style={styles.row} onPress={() => router.push({ pathname: '/chat-thread', params: { conversationId: conversation.id, listingId: conversation.listingId ?? undefined, name, image, item } })}>
        {image ? <FoodImage image={image} style={styles.avatar} /> : <View style={styles.avatar}><Text style={[typography.labelMd, styles.avatarText]}>{name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View>}
        <View style={styles.rowBody}><View style={styles.rowTop}><View style={styles.nameRow}><Text style={[typography.labelLg, styles.name]}>{name}</Text><Text style={[typography.labelSm, styles.role]}>{role.toUpperCase()}</Text></View><Text style={[typography.bodySm, styles.time]}>{formatTime(conversation.lastMessageAt)}</Text></View>
          {conversation.onBehalfOf && <Text style={[typography.labelSm, styles.onBehalf]}>On behalf of {conversation.onBehalfOf}</Text>}
          <View style={styles.itemRow}><Text style={[typography.bodySm, styles.itemLabel]}>{item}</Text>{statusLabel && <Text style={[typography.labelSm, styles.statusPill]}>{statusLabel}</Text>}</View>
          <View style={styles.previewRow}><Text style={[typography.bodySm, styles.preview]} numberOfLines={1}>{conversation.lastMessage || 'No messages yet — say hello!'}</Text>{conversation.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={[typography.labelSm, styles.unreadText]}>{conversation.unreadCount}</Text></View>}</View>
        </View>
      </Pressable>)}
      {filteredRows.length === 0 && <Text style={[typography.bodyMd, styles.emptyState]}>{query.trim() ? 'No conversations match your search.' : 'No conversations yet — claim food or post a donation to start chatting.'}</Text>}
      <Text style={[typography.bodySm, styles.footerNote]}>Direct encrypted messaging for safe food sharing</Text>
    </ScrollView>
    {!user && <AuthRequiredModal visible={showAuthModal} title="Sign in to open Chat" body="Log in or create an account to view and continue your conversations." onClose={() => setShowAuthModal(false)} onAuthenticated={() => { setShowAuthModal(false); }} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.surface }, header: { paddingHorizontal: spacing.screenGutter, paddingVertical: spacing.sm }, headerTitle: { color: colors.onSurface }, searchRow: { position: 'relative', marginHorizontal: spacing.screenGutter, marginBottom: spacing.sm }, searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 }, searchInput: { height: 44, paddingLeft: 40, borderRadius: radius.xl, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurface }, filterRow: { gap: spacing.xs, paddingHorizontal: spacing.screenGutter, paddingBottom: spacing.sm }, filterPill: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }, filterPillActive: { backgroundColor: colors.primaryContainer }, filterText: { color: colors.onSurface }, filterTextActive: { color: colors.onPrimary }, list: { paddingHorizontal: spacing.screenGutter, paddingBottom: spacing.xxxl, gap: spacing.md }, emptyState: { color: colors.secondary, textAlign: 'center', paddingVertical: spacing.xxxl }, row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm }, avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.onSurface }, rowBody: { flex: 1, gap: 2 }, rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }, name: { color: colors.onSurface }, role: { color: colors.tertiary }, time: { color: colors.secondary }, onBehalf: { color: colors.primary }, itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, itemLabel: { color: colors.secondary }, statusPill: { color: colors.tertiary, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm }, previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, preview: { color: colors.secondary, flex: 1 }, unreadBadge: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs }, unreadText: { color: colors.onPrimary }, footerNote: { color: colors.secondary, textAlign: 'center', marginTop: spacing.lg } });
