// Bottom tab navigator: Feed, Map, Post (+), Chat, Community
// Uses expo-router/ui (works on web + native) so we don't need separate
// native/web tab bar implementations.

import React from 'react';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

const TABS: {
  name: string;
  href: '/(tabs)' | '/map' | '/post' | '/chat' | '/community';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  big?: boolean;
}[] = [
  { name: 'index', href: '/(tabs)', label: 'Feed', icon: 'home' },
  { name: 'map', href: '/map', label: 'Map', icon: 'map' },
  { name: 'post', href: '/post', label: '', icon: 'add-circle', big: true },
  { name: 'chat', href: '/chat', label: 'Chat', icon: 'chatbubble' },
  { name: 'community', href: '/community', label: 'Community', icon: 'people' },
];

export default function AppTabs() {
  const { isSignedIn } = useAppState();

  const handleProtectedTabPress = (event: Parameters<NonNullable<TabTriggerSlotProps['onPress']>>[0]) => {
    if (!isSignedIn) {
      event?.preventDefault?.();
      router.push('/?auth=login');
      return;
    }
    event?.preventDefault?.();
  };

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton
                icon={tab.icon}
                label={tab.label}
                big={tab.big}
                protectedTab={tab.name !== 'index'}
                isSignedIn={isSignedIn}
                onProtectedPress={handleProtectedTabPress}
              />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  label,
  big,
  isFocused,
  protectedTab,
  isSignedIn,
  onProtectedPress,
  ...props
}: TabTriggerSlotProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  big?: boolean;
  protectedTab: boolean;
  isSignedIn: boolean;
  onProtectedPress: (event: Parameters<NonNullable<TabTriggerSlotProps['onPress']>>[0]) => void;
}) {
  const tint = isFocused ? colors.primaryContainer : colors.secondary;
  return (
    <Pressable
      {...props}
      onPress={(event) => {
        if (protectedTab && !isSignedIn) {
          onProtectedPress(event);
          return;
        }
        props.onPress?.(event);
      }}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={big ? 34 : 22} color={tint} />
      {!!label && <TabLabel focused={!!isFocused}>{label}</TabLabel>}
    </Pressable>
  );
}

function TabLabel({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <Text style={[typography.labelSm, { color: focused ? colors.onSurface : colors.secondary }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 4,
  },
  pressed: { opacity: 0.6 },
});
