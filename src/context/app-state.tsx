// In-memory app state shared across every screen (auth, food listings, chat).
// No backend yet — this resets when the app reloads. Swap the functions
// below for real API calls once you have a backend; the screens that use
// this context won't need to change.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FoodListing = {
  id: string;
  image: string;
  expiresLabel: string;
  distance: string;
  donorInitials: string;
  donorId: string;
  donorName: string;
  portionsLabel: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  claimedBy: string | null;
  status: 'available' | 'claimed' | 'completed' | 'expired';
  pickupDeadline: number;
  address: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  listingId: string;
  reviewerId: string;
  revieweeId: string;
  foodQualityRating: number;
  punctualityRating: number;
  communicationRating: number;
  comment?: string;
  createdAt: string;
  verifiedPickup: boolean;
  photo?: string;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  listingId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'active_pickup' | 'donation' | 'completed';
  onBehalfOf: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  type: 'text' | 'system';
  readBy: string[];
};

export type User = {
  name: string;
  email: string;
  initials: string;
  avatar?: string;
};

type Account = User & {
  password: string;
  phone?: string;
  provider?: 'Google' | 'Apple';
};

const SEEDED_LISTINGS: FoodListing[] = [
  { id: 'seed-bakery', image: 'seed-bakery', expiresLabel: 'Expires in 2h', distance: '0.4 km away', donorInitials: 'AB', donorId: 'artisan-bakehouse', donorName: 'Artisan Bakehouse', portionsLabel: '4 Portions', title: 'Fresh Bakery Assortment', description: '8 artisan croissants & sourdough batard baked early this morning.', tags: ['Vegetarian', 'Daily Batch'], category: 'Fresh Bakery', claimedBy: null, status: 'available', pickupDeadline: Date.now() + 2 * 60 * 60 * 1000, address: 'Artisan neighborhood pickup area', updatedAt: new Date().toISOString() },
  { id: 'seed-curry', image: 'seed-curry', expiresLabel: 'Expires in 3h', distance: '0.8 km away', donorInitials: 'CM', donorId: 'chef-maya', donorName: 'Chef Maya', portionsLabel: '2 Boxes', title: 'Home-cooked Lentil Curry & Rice', description: 'Fresh batch prepared today with whole spices, turmeric & coconut cream.', tags: ['Vegan', 'Gluten-Free'], category: 'Prepared Meals', claimedBy: null, status: 'available', pickupDeadline: Date.now() + 3 * 60 * 60 * 1000, address: 'Chef Maya neighborhood pickup area', updatedAt: new Date().toISOString() },
];
const DEFAULT_FOOD_IMAGE = 'seed-curry';
const LISTINGS_STORAGE_VERSION = 'foodloop-listings-v2';
const CONVERSATIONS_STORAGE_KEY = 'foodloop-conversations-v1';
const REVIEWS_STORAGE_KEY = 'foodloop-reviews-v1';

function withListingImage(listing: FoodListing): FoodListing {
  const seeded = SEEDED_LISTINGS.find((seed) => seed.id === listing.id);
  return { ...listing, image: seeded?.image ?? (listing.image || DEFAULT_FOOD_IMAGE) };
}

function conversationKey(conversation: Conversation) {
  return `${conversation.listingId ?? 'none'}:${[...conversation.participantIds].sort().join('|')}`;
}

function mergeDuplicateConversations(conversations: Conversation[], messages: Record<string, Message[]>) {
  const canonicalByKey = new Map<string, Conversation>();
  const idMap = new Map<string, string>();
  const mergedMessages: Record<string, Message[]> = {};
  conversations.forEach((conversation) => {
    const key = conversationKey(conversation);
    const canonical = canonicalByKey.get(key);
    if (!canonical) {
      canonicalByKey.set(key, conversation);
      idMap.set(conversation.id, conversation.id);
      mergedMessages[conversation.id] = [...(messages[conversation.id] ?? [])];
      return;
    }
    idMap.set(conversation.id, canonical.id);
    const combined = [...(mergedMessages[canonical.id] ?? []), ...(messages[conversation.id] ?? [])];
    mergedMessages[canonical.id] = combined;
    if (conversation.lastMessageAt > canonical.lastMessageAt) {
      canonical.lastMessage = conversation.lastMessage;
      canonical.lastMessageAt = conversation.lastMessageAt;
      canonical.unreadCount += conversation.unreadCount;
    }
  });
  Object.keys(mergedMessages).forEach((id) => {
    mergedMessages[id] = mergedMessages[id].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
  return { conversations: [...canonicalByKey.values()], messages: mergedMessages, idMap };
}

type AppStateValue = {
  isLoading: boolean;
  user: User | null;
  isSignedIn: boolean;
  login: (email: string, name?: string) => void;
  authenticate: (email: string, password: string) => boolean;
  register: (data: { name: string; email: string; password: string; phone?: string; provider?: 'Google' | 'Apple' }) => { ok: boolean; message?: string };
  resetPassword: (email: string, newPassword: string) => { ok: boolean; message?: string };
  findAccountByPhone: (phone: string) => boolean;
  findAccountByProvider: (provider: 'Google' | 'Apple') => boolean;
  loginWithPhone: (phone: string) => void;
  loginWithProvider: (provider: 'Google' | 'Apple') => void;
  logout: () => void;
  updateProfile: (data: { name: string; email: string; avatar?: string }) => void;

  listings: FoodListing[];
  addListing: (data: Omit<FoodListing, 'id' | 'image' | 'donorInitials' | 'donorName' | 'donorId' | 'claimedBy' | 'status' | 'pickupDeadline' | 'updatedAt'> & { image?: string }) => void;
  updateListing: (id: string, data: Partial<Pick<FoodListing, 'title' | 'description' | 'category' | 'portionsLabel' | 'expiresLabel' | 'pickupDeadline' | 'address' | 'tags' | 'image'>>) => { ok: boolean; warning?: boolean };
  claimListing: (id: string, claimerId: string) => string | false;
  expireListings: () => void;
  completeListing: (id: string) => boolean;
  notifyDonor: (listingId: string, claimerId: string) => void;

  conversations: Conversation[];
  conversationMessages: Record<string, Message[]>;
  createConversation: (data: { listingId: string | null; participantIds: string[]; status: Conversation['status']; onBehalfOf?: string | null }) => string;
  sendConversationMessage: (conversationId: string, text: string) => void;
  receiveConversationMessage: (conversationId: string, senderId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  checkForNewMessages: (conversationId: string) => Message[];
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'verifiedPickup'>) => void;
  onCompleted: (listingId: string) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([
    { name: 'FoodLoop Demo', email: 'demo@foodloop.com', password: 'foodloop123', initials: 'FD' },
  ]);
  const [listings, setListings] = useState<FoodListing[]>(SEEDED_LISTINGS.map(withListingImage));
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const claimedIds = useRef(new Set<string>());
  const hasLoadedListings = useRef(false);
  const hasLoadedChat = useRef(false);
  const conversationsRef = useRef(conversations);
  const conversationMessagesRef = useRef(conversationMessages);
  conversationsRef.current = conversations;
  const migratedConversations = useRef(false);
  conversationMessagesRef.current = conversationMessages;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (migratedConversations.current) return;
    migratedConversations.current = true;
    const merged = mergeDuplicateConversations(conversations, conversationMessagesRef.current);
    setConversations(merged.conversations);
    setConversationMessages(merged.messages);
  }, []);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY), AsyncStorage.getItem(REVIEWS_STORAGE_KEY)]).then(([storedConversations, storedReviews]) => {
      if (storedConversations) {
        const parsed = JSON.parse(storedConversations) as { conversations: Conversation[]; messages: Record<string, Message[]> };
        const merged = mergeDuplicateConversations(parsed.conversations ?? [], parsed.messages ?? {});
        setConversations(merged.conversations);
        setConversationMessages(merged.messages);
      }
      if (storedReviews) setReviews(JSON.parse(storedReviews) as Review[]);
      hasLoadedChat.current = true;
    }).catch(() => { hasLoadedChat.current = true; });
  }, []);

  useEffect(() => {
    if (!hasLoadedChat.current) return;
    AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify({ conversations, messages: conversationMessages })).catch(() => undefined);
    AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews)).catch(() => undefined);
  }, [conversations, conversationMessages, reviews]);

  useEffect(() => {
    AsyncStorage.getItem('foodloop-listings-version').then(async (version) => {
      if (version !== LISTINGS_STORAGE_VERSION) {
        await AsyncStorage.multiSet([
          ['foodloop-listings', JSON.stringify(SEEDED_LISTINGS.map(withListingImage))],
          ['foodloop-listings-version', LISTINGS_STORAGE_VERSION],
        ]);
        setListings(SEEDED_LISTINGS.map(withListingImage));
        hasLoadedListings.current = true;
        return;
      }
      const stored = await AsyncStorage.getItem('foodloop-listings');
      const parsed = stored ? JSON.parse(stored) as FoodListing[] : [];
      if (parsed.length > 0) setListings(parsed.map(withListingImage));
      hasLoadedListings.current = true;
    }).catch(() => { hasLoadedListings.current = true; });
  }, []);

  useEffect(() => {
    if (hasLoadedListings.current) AsyncStorage.setItem('foodloop-listings', JSON.stringify(listings)).catch(() => undefined);
  }, [listings]);
  const login = useCallback((email: string, name?: string) => {
    const displayName = name?.trim() || email.split('@')[0];
    const initials = displayName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'ME';
    setUser({ name: displayName, email, initials });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setListings(SEEDED_LISTINGS.map(withListingImage));
    setConversations([]);
    setConversationMessages({});
    setReviews([]);
    claimedIds.current.clear();
  }, []);

  const updateProfile = useCallback((data: { name: string; email: string; avatar?: string }) => {
    const name = data.name.trim() || 'FoodLoop Member';
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'ME';
    setUser((current) => current ? { ...current, name, email: data.email.trim() || current.email, initials, avatar: data.avatar ?? current.avatar } : current);
    setAccounts((previous) => previous.map((account) => account.email === user?.email ? { ...account, name, email: data.email.trim() || account.email, initials, avatar: data.avatar ?? account.avatar } : account));
  }, [user?.email]);

  const authenticate = useCallback((email: string, password: string) => {
    const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!account) return false;
    setUser({ name: account.name, email: account.email, initials: account.initials });
    return true;
  }, [accounts]);

  const register = useCallback<AppStateValue['register']>((data) => {
    const email = data.email.trim().toLowerCase();
    const phone = data.phone?.replace(/\D/g, '');
    if (accounts.some((account) => account.email.toLowerCase() === email)) return { ok: false, message: 'An account already exists for this email. Please log in instead.' };
    if (phone && accounts.some((account) => account.phone === phone)) return { ok: false, message: 'An account already exists for this phone number. Please log in instead.' };
    const name = data.name.trim();
    const initials = name.split(/\s+/).filter(Boolean).map((word) => word[0].toUpperCase()).slice(0, 2).join('') || 'ME';
    const account: Account = { name, email, password: data.password, phone, provider: data.provider, initials };
    setAccounts((previous) => [...previous, account]);
    setUser({ name, email, initials });
    return { ok: true };
  }, [accounts]);

  const resetPassword = useCallback<AppStateValue['resetPassword']>((email, newPassword) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: 'No FoodLoop account was found for this email address.' };
    }
    setAccounts((previous) => previous.map((account) =>
      account.email.toLowerCase() === normalizedEmail ? { ...account, password: newPassword } : account
    ));
    return { ok: true };
  }, [accounts]);

  const findAccountByPhone = useCallback((phone: string) => accounts.some((account) => account.phone === phone.replace(/\D/g, '')), [accounts]);
  const findAccountByProvider = useCallback((provider: 'Google' | 'Apple') => accounts.some((account) => account.provider === provider), [accounts]);
  const loginWithPhone = useCallback((phone: string) => {
    const account = accounts.find((item) => item.phone === phone.replace(/\D/g, ''));
    if (account) setUser({ name: account.name, email: account.email, initials: account.initials });
  }, [accounts]);
  const loginWithProvider = useCallback((provider: 'Google' | 'Apple') => {
    const account = accounts.find((item) => item.provider === provider);
    if (account) setUser({ name: account.name, email: account.email, initials: account.initials });
  }, [accounts]);

  const addListing = useCallback<AppStateValue['addListing']>(
    (data) => {
      const id = `local-${Date.now()}`;
      const donorName = user?.name ?? 'You';
      const donorInitials = user?.initials ?? 'ME';
      const image = data.image ?? DEFAULT_FOOD_IMAGE;
      setListings((prev) => [{ id, donorInitials, donorName, donorId: user?.email ?? 'you', claimedBy: null, status: 'available', pickupDeadline: Date.now() + 6 * 60 * 60 * 1000, updatedAt: new Date().toISOString(), ...data, image: data.image || DEFAULT_FOOD_IMAGE }, ...prev]);
    },
    [user]
  );

  const updateListing = useCallback<AppStateValue['updateListing']>((id, data) => {
    const existing = listings.find((listing) => listing.id === id);
    if (!existing || existing.donorId !== user?.email) return { ok: false };
    setListings((prev) => prev.map((listing) => listing.id === id ? { ...listing, ...data, updatedAt: new Date().toISOString() } : listing));
    return { ok: true, warning: existing.status !== 'available' };
  }, [listings, user?.email]);

  const claimListing = useCallback((id: string, claimerId: string) => {
    if (!user || claimerId !== user.email) return false;
    const current = listings.find((listing) => listing.id === id);
    if (!current || current.status !== 'available' || claimedIds.current.has(id)) return false;
    claimedIds.current.add(id);
    setListings((prev) => prev.map((listing) => {
      if (listing.id !== id || listing.status !== 'available') return listing;
      return { ...listing, status: 'claimed', claimedBy: claimerId };
    }));
    const listing = current;
    const conversationId = `listing-${id}`;
    const existing = conversationsRef.current.find((conversation) => conversationKey(conversation) === conversationKey({ id: conversationId, participantIds: [listing.donorId, claimerId], listingId: id, lastMessage: '', lastMessageAt: '', unreadCount: 0, status: 'active_pickup', onBehalfOf: null }));
    if (!existing) {
      const created: Conversation = {
      id: conversationId,
      participantIds: [listing.donorId, claimerId],
      listingId: id,
      lastMessage: `Claim request sent for ${listing.title}.`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      status: 'active_pickup',
      onBehalfOf: null,
      };
      conversationsRef.current = [created, ...conversationsRef.current];
      setConversations((prev) => [created, ...prev]);
    }
    setConversationMessages((prev) => prev[existing?.id ?? conversationId] ? prev : {
      ...prev,
      [existing?.id ?? conversationId]: [{ id: `system-${Date.now()}`, conversationId: existing?.id ?? conversationId, senderId: claimerId, text: `Claim request sent for ${listing.title}. Coordinate pickup here.`, createdAt: new Date().toISOString(), type: 'system', readBy: [claimerId] }],
    });
    return existing?.id ?? conversationId;
  }, [listings, user]);

  const expireListings = useCallback(() => {
    const now = Date.now();
    setListings((prev) => prev.map((listing) => {
          if (listing.status === 'claimed' && listing.pickupDeadline <= now) {
            claimedIds.current.delete(listing.id);
            return { ...listing, status: 'available', claimedBy: null };
          }
          return listing;
    }));
  }, []);
  const completeListing = useCallback((id: string) => {
    let completed = false;
    setListings((prev) => prev.map((listing) => {
      if (listing.id !== id || listing.status !== 'claimed') return listing;
      completed = true;
      claimedIds.current.delete(id);
      return { ...listing, status: 'completed' };
    }));
    setConversations((prev) => prev.map((conversation) => conversation.listingId === id ? { ...conversation, status: 'completed' } : conversation));
    return completed;
  }, []);

  const notifyDonor = useCallback((listingId: string, claimerId: string) => {
    console.log(`[FoodLoop] Donor notified: listing ${listingId} claimed by ${claimerId}`);
  }, []);

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt' | 'verifiedPickup'>) => {
    const listing = listings.find((item) => item.id === review.listingId);
    if (!listing || listing.status !== 'completed') return;
    setReviews((prev) => [...prev, { ...review, id: `review-${Date.now()}`, createdAt: new Date().toISOString(), verifiedPickup: true }]);
  }, [listings]);

  const onCompleted = useCallback((listingId: string) => {
    console.log(`[FoodLoop] Pickup completed: ${listingId}`);
  }, []);

  const createConversation = useCallback((data: { listingId: string | null; participantIds: string[]; status: Conversation['status']; onBehalfOf?: string | null }) => {
    const participantKey = [...data.participantIds].sort().join('|');
    const existing = conversationsRef.current.find((conversation) => conversation.listingId === data.listingId && data.listingId !== null && [...conversation.participantIds].sort().join('|') === participantKey);
    if (existing) return existing.id;
    const id = `conversation-${Date.now()}`;
    const created = { id, participantIds: data.participantIds, listingId: data.listingId, lastMessage: '', lastMessageAt: new Date().toISOString(), unreadCount: 0, status: data.status, onBehalfOf: data.onBehalfOf ?? null };
    conversationsRef.current = [created, ...conversationsRef.current];
    setConversations((prev) => prev.some((conversation) => conversationKey(conversation) === conversationKey(created)) ? prev : [created, ...prev]);
    setConversationMessages((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const sendConversationMessage = useCallback((conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const senderId = user?.email ?? 'anonymous';
    const createdAt = new Date().toISOString();
    const message: Message = { id: `message-${Date.now()}`, conversationId, senderId, text: trimmed, createdAt, type: 'text', readBy: [senderId] };
    setConversationMessages((prev) => ({ ...prev, [conversationId]: [...(prev[conversationId] ?? []), message] }));
    setConversations((prev) => prev.map((conversation) => conversation.id === conversationId ? { ...conversation, lastMessage: trimmed, lastMessageAt: createdAt } : conversation));
  }, [user?.email]);

  const receiveConversationMessage = useCallback((conversationId: string, senderId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const createdAt = new Date().toISOString();
    const message: Message = { id: `message-${Date.now()}`, conversationId, senderId, text: trimmed, createdAt, type: 'text', readBy: [senderId] };
    setConversationMessages((prev) => ({ ...prev, [conversationId]: [...(prev[conversationId] ?? []), message] }));
    setConversations((prev) => prev.map((conversation) => conversation.id === conversationId ? { ...conversation, lastMessage: trimmed, lastMessageAt: createdAt, unreadCount: conversation.unreadCount + 1 } : conversation));
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    const readerId = user?.email ?? 'anonymous';
    setConversations((prev) => {
      const next = prev.map((conversation) => conversation.id === conversationId && conversation.unreadCount > 0 ? { ...conversation, unreadCount: 0 } : conversation);
      return next.some((conversation, index) => conversation !== prev[index]) ? next : prev;
    });
    setConversationMessages((prev) => {
      const current = prev[conversationId] ?? [];
      const next = current.map((message) => message.readBy.includes(readerId) ? message : { ...message, readBy: [...message.readBy, readerId] });
      return next.every((message, index) => message === current[index]) ? prev : { ...prev, [conversationId]: next };
    });
  }, [user?.email]);

  const checkForNewMessages = useCallback((conversationId: string) => conversationMessagesRef.current[conversationId] ?? [], []);

  const value = useMemo<AppStateValue>(
    () => ({
      isLoading,
      user,
      isSignedIn: !!user,
      login,
      authenticate,
      register,
      resetPassword,
      findAccountByPhone,
      findAccountByProvider,
      loginWithPhone,
      loginWithProvider,
      logout,
      updateProfile,
      listings,
      addListing,
      updateListing,
      claimListing,
      expireListings,
      completeListing,
      notifyDonor,
      conversations,
      conversationMessages,
      createConversation,
      sendConversationMessage,
      receiveConversationMessage,
      markConversationRead,
      checkForNewMessages,
      reviews,
      addReview,
      onCompleted,
    }),
    [isLoading, user, login, authenticate, register, resetPassword, findAccountByPhone, findAccountByProvider, loginWithPhone, loginWithProvider, logout, updateProfile, listings, addListing, updateListing, claimListing, expireListings, completeListing, notifyDonor, conversations, conversationMessages, createConversation, sendConversationMessage, receiveConversationMessage, markConversationRead, checkForNewMessages, reviews, addReview, onCompleted]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
