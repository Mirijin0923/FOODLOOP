import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

export default function ProfileScreen() {
  const { user, updateProfile } = useAppState();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState(user?.avatar);
  const [saved, setSaved] = useState(false);

  const chooseAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const saveProfile = () => {
    updateProfile({ name, email, avatar });
    setSaved(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={22} color={colors.onSurface} /></Pressable>
          <Text style={[typography.headlineSm, styles.headerTitle]}>Your Profile</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.profileHero}>
          <Pressable onPress={chooseAvatar} style={styles.avatarButton}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <Text style={[typography.headlineMd, styles.avatarInitials]}>{user?.initials ?? 'ME'}</Text>}
            <View style={styles.cameraBadge}><Ionicons name="camera" size={14} color={colors.onPrimary} /></View>
          </Pressable>
          <Text style={[typography.headlineMd, styles.heroName]}>{user?.name ?? 'FoodLoop Member'}</Text>
          <Text style={[typography.bodySm, styles.heroCaption]}>Keep your profile welcoming for neighbors.</Text>
        </View>
        {saved && <View style={styles.savedBanner}><Ionicons name="checkmark-circle" size={17} color={colors.onTertiary} /><Text style={[typography.bodySm, styles.savedText]}>Profile updated</Text></View>}
        <Field label="Display name"><TextInput value={name} onChangeText={setName} style={[typography.bodyMd, styles.input]} placeholder="Your name" placeholderTextColor={colors.secondary} /></Field>
        <Field label="Email address"><TextInput value={email} onChangeText={setEmail} style={[typography.bodyMd, styles.input]} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={colors.secondary} /></Field>
        <Pressable style={styles.saveButton} onPress={saveProfile}><Text style={[typography.labelLg, styles.saveText]}>Save Profile</Text></Pressable>
        <Text style={[typography.bodySm, styles.helper]}>Your profile photo and name appear beside messages and shared food.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={[typography.labelMd, styles.label]}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.screenGutter, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.onSurface },
  profileHero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  avatarButton: { width: 92, height: 92, borderRadius: radius.full, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImage: { width: 92, height: 92, borderRadius: radius.full },
  avatarInitials: { color: colors.onPrimary },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  heroName: { color: colors.onSurface },
  heroCaption: { color: colors.secondary },
  savedBanner: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.tertiaryContainer, padding: spacing.md, borderRadius: radius.lg },
  savedText: { color: colors.onTertiary },
  field: { gap: spacing.xs },
  label: { color: colors.secondary },
  input: { height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurface, paddingHorizontal: spacing.md },
  saveButton: { height: 52, borderRadius: radius.DEFAULT, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  saveText: { color: colors.onPrimary },
  helper: { color: colors.secondary, textAlign: 'center' },
});
