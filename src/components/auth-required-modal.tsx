import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { authApi } from '@/services/auth-api';

export function AuthRequiredModal({ visible, title, body, onClose, onAuthenticated }: { visible: boolean; title: string; body: string; onClose: () => void; onAuthenticated: () => void }) {
  const { login: setUser } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (!visible) return null;
  const login = async () => {
    try {
      const { user } = await authApi.login(email, password);
      setUser(user.email ?? email.trim(), user.name);
      setError('');
      onAuthenticated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in.');
    }
  };
  return <View style={styles.overlay}><View style={styles.card}>
    <Text style={[typography.headlineMd, styles.title]}>{title}</Text>
    <Text style={[typography.bodyMd, styles.body]}>{body}</Text>
    <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.secondary} autoCapitalize="none" keyboardType="email-address" style={[typography.bodyMd, styles.input]} />
    <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.secondary} secureTextEntry style={[typography.bodyMd, styles.input]} />
    {!!error && <Text style={[typography.bodySm, styles.error]}>{error}</Text>}
    <Pressable style={styles.primary} onPress={login}><Text style={[typography.labelLg, styles.primaryText]}>Log In</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => router.push('/signup')}><Text style={[typography.labelMd, styles.secondaryText]}>Create an Account</Text></Pressable>
    <Pressable style={styles.secondary} onPress={onClose}><Text style={[typography.labelMd, styles.secondaryText]}>Cancel</Text></Pressable>
  </View></View>;
}

const styles = StyleSheet.create({ overlay: { position: 'absolute', inset: 0, zIndex: 10, backgroundColor: '#00000099', justifyContent: 'center', padding: spacing.lg }, card: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm }, title: { color: colors.onSurface }, body: { color: colors.secondary }, input: { height: 46, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurface, paddingHorizontal: spacing.md }, error: { color: colors.error }, primary: { height: 48, borderRadius: radius.DEFAULT, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs }, primaryText: { color: colors.onPrimary }, secondary: { alignItems: 'center', padding: spacing.sm }, secondaryText: { color: colors.tertiary } });
