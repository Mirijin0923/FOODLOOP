import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

export default function ChatThreadScreen() {
  const { conversationId, listingId, name, image, item } = useLocalSearchParams<{ conversationId?: string; listingId?: string; name?: string; image?: string; item?: string }>();
  const { conversations, conversationMessages, sendConversationMessage, markConversationRead, checkForNewMessages, listings, completeListing, onCompleted, user, isSignedIn } = useAppState();
  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState(conversationId ? checkForNewMessages(conversationId) : []);
  const scrollRef = useRef<ScrollView>(null);
  const conversation = conversations.find((entry) => entry.id === conversationId);
  const isParticipant = !!user && !!conversation && conversation.participantIds.includes(user.email);
  const resolvedListingId = listingId ?? conversation?.listingId ?? undefined;
  const listing = resolvedListingId ? listings.find((entry) => entry.id === resolvedListingId) : undefined;

  useEffect(() => {
    if (!isSignedIn) router.replace('/?auth=login');
    else if (conversation && !isParticipant) router.replace('/(tabs)/chat');
  }, [isSignedIn, conversation, isParticipant]);

  useEffect(() => {
    if (!conversationId) return;
    markConversationRead(conversationId);
    const poll = setInterval(() => setLiveMessages(checkForNewMessages(conversationId)), 3000);
    return () => clearInterval(poll);
  }, [conversationId, markConversationRead, checkForNewMessages]);

  useEffect(() => {
    if (conversationId) setLiveMessages(conversationMessages[conversationId] ?? []);
  }, [conversationId, conversationMessages]);

  const handleSend = () => {
    if (!isSignedIn) {
      router.push('/?auth=login');
      return;
    }
    if (!conversationId || !draft.trim()) return;
    sendConversationMessage(conversationId, draft);
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handlePickedUp = () => {
    if (!resolvedListingId || !listing || listing.status !== 'claimed') return;
    if (completeListing(resolvedListingId)) {
      onCompleted(resolvedListingId);
      router.push({ pathname: '/rate-pickup', params: { listingId: resolvedListingId, revieweeId: listing.donorId, name: listing.donorName } });
    }
  };

  if (!isSignedIn || (conversation && !isParticipant)) return null;

  return <SafeAreaView style={styles.safeArea}><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={22} color={colors.onSurface} /></Pressable><View style={styles.headerProfile}>{image ? <Image source={{ uri: image }} style={styles.headerAvatar} /> : <View style={styles.headerAvatarFallback}><Ionicons name="person" size={16} color={colors.onPrimary} /></View>}<View style={styles.headerCopy}><Text style={[typography.headlineSm, styles.headerTitle]} numberOfLines={1}>{name ?? conversation?.participantIds[1] ?? 'FoodLoop conversation'}</Text><Text style={[typography.labelSm, styles.headerItem]} numberOfLines={1}>{item ?? 'FoodLoop conversation'}</Text></View></View><View style={{ width: 22 }} /></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.messagesList} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {liveMessages.length === 0 ? <Text style={[typography.bodyMd, styles.emptyText]}>No messages yet — say hello!</Text> : liveMessages.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((message) => { const mine = message.senderId === (user?.email ?? 'anonymous'); return <View key={message.id} style={[styles.bubbleRow, mine ? styles.bubbleRowMe : styles.bubbleRowThem]}><View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}><Text style={[typography.bodyMd, mine ? styles.bubbleTextMe : styles.bubbleTextThem]}>{message.text}</Text></View><Text style={[typography.labelSm, styles.msgTime]}>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>; })}
      </ScrollView>
      {listing?.status === 'claimed' && <Pressable style={styles.pickedUpButton} onPress={handlePickedUp}><Ionicons name="checkmark-done" size={18} color={colors.onTertiary} /><Text style={[typography.labelLg, styles.pickedUpText]}>Mark as Picked Up</Text></Pressable>}
      <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Type a message..." placeholderTextColor={colors.secondary} style={[typography.bodyMd, styles.composerInput]} onSubmitEditing={handleSend} returnKeyType="send" /><Pressable style={styles.sendButton} onPress={handleSend}><Ionicons name="send" size={18} color={colors.onPrimary} /></Pressable></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }, headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.sm }, headerAvatar: { width: 36, height: 36, borderRadius: radius.full }, headerAvatarFallback: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, headerTitle: { color: colors.onSurface }, headerItem: { color: colors.tertiary }, messagesList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }, emptyText: { color: colors.secondary, textAlign: 'center', marginTop: spacing.xxl }, bubbleRow: { maxWidth: '80%', gap: 2 }, bubbleRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' }, bubbleRowThem: { alignSelf: 'flex-start', alignItems: 'flex-start' }, bubble: { borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, bubbleMe: { backgroundColor: colors.primaryContainer, borderBottomRightRadius: radius.sm }, bubbleThem: { backgroundColor: colors.surfaceContainerHigh, borderBottomLeftRadius: radius.sm }, bubbleTextMe: { color: colors.onPrimary }, bubbleTextThem: { color: colors.onSurface }, msgTime: { color: colors.secondary }, pickedUpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginHorizontal: spacing.md, marginBottom: spacing.xs, height: 44, borderRadius: radius.lg, backgroundColor: colors.tertiaryContainer }, pickedUpText: { color: colors.onTertiary }, composer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.outlineVariant }, composerInput: { flex: 1, height: 44, borderRadius: radius.xl, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: spacing.md, color: colors.onSurface }, sendButton: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' } });
