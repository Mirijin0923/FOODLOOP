// Log In / Sign Up — FoodLoop
// Drop into: src/app/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { authApi } from '@/services/auth-api';

export default function LoginScreen() {
  const { auth } = useLocalSearchParams<{ auth?: string }>();
  const { login } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async () => {
    let hasError = false;
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      hasError = true;
    } else {
      setEmailError('');
    }
    if (password.length < 8) {
      setPasswordError('Incorrect password. Passwords cannot be empty and must be at least 8 characters.');
      hasError = true;
    } else {
      setPasswordError('');
    }
    if (hasError) return;

    setLoading(true);
    // No backend yet — this simulates a network call, then logs the user
    // into local app state (see src/context/app-state.tsx).
    setTimeout(async () => {
      try {
        const { user } = await authApi.login(email, password);
        login(user.email ?? email.trim(), user.name);
        router.replace('/(tabs)');
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'Unable to log in. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  if (auth !== 'login') return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image source={require('@/assets/images/foodloop_logo.png')} style={styles.logoDot} resizeMode="contain" />
        <Text style={[typography.labelMd, styles.tagBadge]}>◆ ZERO-WASTE COMMUNITY</Text>
        <Text style={[typography.bodyMd, styles.tagline]}>Every meal shared closes the loop on hunger & waste.</Text>

        <View style={styles.tabRow}>
          <Pressable style={[styles.tabButton, styles.tabButtonActive]} accessibilityRole="tab" accessibilityState={{ selected: true }}>
            <Text style={[typography.labelLg, styles.tabTextActive]}>Log In</Text>
          </Pressable>
          <Pressable style={styles.tabButton} onPress={() => router.push('/signup')} accessibilityRole="tab">
            <Text style={[typography.labelLg, styles.tabText]}>Sign Up</Text>
          </Pressable>
        </View>

        <Text style={[typography.labelSm, styles.orDivider]}>LOG IN WITH EMAIL OR PHONE</Text>

        <Text style={[typography.labelMd, styles.fieldLabel]}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@domain.com"
          placeholderTextColor={colors.secondary}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[typography.bodyMd, styles.input, !!emailError && styles.inputError]}
        />
        {!!emailError && <Text style={[typography.bodySm, styles.errorText]}>{emailError}</Text>}

        <Pressable style={styles.phoneLink} onPress={() => router.push('/phone-login')}>
          <Ionicons name="call-outline" size={14} color={colors.tertiary} />
          <Text style={[typography.labelMd, styles.phoneLinkText]}>Log in with phone number and verification code</Text>
        </Pressable>

        <View style={styles.passwordHeader}>
          <Text style={[typography.labelMd, styles.fieldLabel]}>Password</Text>
          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
            <Text style={[typography.labelSm, styles.forgotPassword]}>Forgot password?</Text>
          </Pressable>
        </View>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            placeholderTextColor={colors.secondary}
            secureTextEntry={!showPassword}
            style={[typography.bodyMd, styles.input, styles.passwordInput, !!passwordError && styles.inputError]}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.secondary} />
          </Pressable>
        </View>
        {!!passwordError && <Text style={[typography.bodySm, styles.errorText]}>{passwordError}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[typography.labelLg, styles.primaryButtonText]}>Log In</Text>
          )}
        </Pressable>

        <Text style={[typography.bodySm, styles.legalText]}>
          By continuing, you agree to our Terms of Service & the Community Fresh Food Safety Pledge.
        </Text>

        <Text style={[typography.bodyMd, styles.signupPrompt]}>
          Don't have an account?{' '}
          <Link href="/signup" style={styles.signupLink}>
            Sign up now
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, padding: spacing.xl, gap: spacing.sm },
  logoDot: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  tagBadge: { color: colors.tertiary, textAlign: 'center' },
  tagline: { color: colors.secondary, textAlign: 'center', marginBottom: spacing.md },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: 4 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.DEFAULT },
  tabButtonActive: { backgroundColor: colors.surfaceContainerHighest },
  tabText: { color: colors.secondary },
  tabTextActive: { color: colors.onSurface },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    marginTop: spacing.sm,
  },
  socialText: { color: colors.onSurface },
  orDivider: { color: colors.secondary, textAlign: 'center', marginVertical: spacing.sm },
  fieldLabel: { color: colors.secondary, marginBottom: spacing.xxs },
  input: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
  },
  inputError: { borderWidth: 1, borderColor: colors.error },
  errorText: { color: colors.error, marginTop: 2 },
  phoneLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  phoneLinkText: { color: colors.tertiary },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  forgotPassword: { color: colors.primary },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eyeButton: { position: 'absolute', right: 12, top: 13 },
  primaryButton: {
    height: 52,
    borderRadius: radius.DEFAULT,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryButtonText: { color: colors.onPrimary },
  legalText: { color: colors.secondary, textAlign: 'center', marginTop: spacing.sm },
  signupPrompt: { color: colors.secondary, textAlign: 'center', marginTop: spacing.md },
  signupLink: { color: colors.primary },
});
