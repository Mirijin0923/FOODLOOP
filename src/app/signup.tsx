// Sign Up — FoodLoop
// Drop into: src/app/signup.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

const LOCAL_VERIFICATION_CODE = '123456';

export default function SignupScreen() {
  const { register } = useAppState();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSignup = async () => {
    const nextErrors: string[] = [];
    if (!name.trim()) nextErrors.push('Please enter your name.');
    if (!phone && !isValidEmail(email)) nextErrors.push('Please enter a valid email address.');
    if (password.length < 8) nextErrors.push('Password must be at least 8 characters.');
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;
    setLoading(true);
    try {
      if (!codeSent) {
        setCodeSent(true);
      } else {
        if (verificationCode !== LOCAL_VERIFICATION_CODE) {
          setErrors(['For local testing, enter verification code 123456.']);
          return;
        }
        const result = register({ name, email: phone ? `${phone}@phone.foodloop` : email, phone, password });
        if (!result.ok) {
          setErrors([result.message ?? 'Unable to create your account.']);
          return;
        }
        setSuccessMessage('Account created successfully. Please log in to continue.');
        setTimeout(() => router.replace('/?auth=login'), 1200);
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image source={require('@/assets/images/foodloop_logo.png')} style={styles.logoDot} resizeMode="contain" />
        <Text style={[typography.headlineLg, styles.title]}>Create your account</Text>
        <Text style={[typography.bodyMd, styles.subtitle]}>
          {codeSent ? `Enter the verification code sent to ${phone ? `+${phone}` : email.trim()}.` : phone ? `Create an account for +${phone}.` : 'Join the zero-waste community and start sharing surplus food.'}
        </Text>

        {!!successMessage && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.onTertiary} />
            <Text style={[typography.bodySm, styles.successText]}>{successMessage}</Text>
          </View>
        )}

        {errors.length > 0 && !successMessage && (
          <View style={styles.errorBanner}>
            {errors.map((err) => (
              <Text key={err} style={[typography.bodySm, styles.errorText]}>
                • {err}
              </Text>
            ))}
          </View>
        )}

        {!successMessage && !codeSent && <>
        <Text style={[typography.labelMd, styles.fieldLabel]}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Jamie Rivera"
          placeholderTextColor={colors.secondary}
          style={[typography.bodyMd, styles.input]}
        />

        {!phone && <>
          <Text style={[typography.labelMd, styles.fieldLabel]}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@domain.com"
            placeholderTextColor={colors.secondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[typography.bodyMd, styles.input]}
          />
        </>}

        {!phone && (
          <Pressable style={styles.phoneLink} onPress={() => router.replace('/phone-login')}>
            <Ionicons name="call-outline" size={14} color={colors.tertiary} />
            <Text style={[typography.labelMd, styles.phoneLinkText]}>Sign up with phone number instead</Text>
          </Pressable>
        )}

        <Text style={[typography.labelMd, styles.fieldLabel]}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.secondary}
            secureTextEntry={!showPassword}
            style={[typography.bodyMd, styles.input, styles.passwordInput]}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((visible) => !visible)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.secondary} />
          </Pressable>
        </View>

        </>}

        {!successMessage && codeSent && <>
          <Text style={[typography.labelMd, styles.fieldLabel]}>Verification Code</Text>
          <TextInput value={verificationCode} onChangeText={setVerificationCode} placeholder="6-digit code" placeholderTextColor={colors.secondary} keyboardType="number-pad" maxLength={6} style={[typography.bodyMd, styles.input]} />
          <Text style={[typography.bodySm, styles.verificationHint]}>Demo verification code: {LOCAL_VERIFICATION_CODE}</Text>
        </>}

        {!successMessage && <Pressable style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[typography.labelLg, styles.primaryButtonText]}>{codeSent ? 'Verify and Create Account' : 'Send Verification Code'}</Text>}
        </Pressable>}

        {!successMessage && <Pressable style={styles.secondaryButton} onPress={() => router.replace('/?auth=login')}>
          <Text style={[typography.labelMd, styles.secondaryText]}>Back to Log In</Text>
        </Pressable>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, padding: spacing.xl, gap: spacing.sm, justifyContent: 'center' },
  logoDot: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: { color: colors.onSurface, textAlign: 'center' },
  subtitle: { color: colors.secondary, textAlign: 'center', marginBottom: spacing.sm },
  errorBanner: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.xs,
  },
  errorText: { color: colors.onError },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  successText: { color: colors.onTertiary, flex: 1 },
  fieldLabel: { color: colors.secondary, marginTop: spacing.xs },
  input: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
  },
  phoneLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneLinkText: { color: colors.tertiary },
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
  secondaryButton: { height: 40, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  secondaryText: { color: colors.secondary },
  verificationHint: { color: colors.tertiary },
});
