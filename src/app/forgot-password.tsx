import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAppState();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleReset = async () => {
    if (!isValidEmail(email)) return setError('Enter the email address associated with your account.');
    try {
      if (!codeSent) { setError(''); setCodeSent(true); return; }
      if (newPassword.length < 8) return setError('Your new password must contain at least 8 characters.');
      if (newPassword !== confirmPassword) return setError('Your new passwords do not match.');
      if (!/^\d{6}$/.test(code)) return setError('Enter the six-digit verification code.');
      const result = resetPassword(email, newPassword);
      if (!result.ok) return setError(result.message ?? 'Unable to reset your password.');
      setError(''); setComplete(true);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to reset your password.'); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={[typography.headlineLg, styles.title]}>Reset your password</Text>
        {complete ? (
          <>
            <Text style={[typography.bodyMd, styles.subtitle]}>Your password has been updated. You can now log in with your new password.</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.replace('/?auth=login')}><Text style={[typography.labelLg, styles.primaryText]}>Go to Log In</Text></Pressable>
          </>
        ) : (
          <>
            <Text style={[typography.bodyMd, styles.subtitle]}>{codeSent ? `Enter the code sent to ${email.trim()}, then choose a new password.` : 'Enter your account email to receive a verification code.'}</Text>
            <Text style={[typography.labelMd, styles.label]}>Email address</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="name@domain.com" placeholderTextColor={colors.secondary} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={[typography.bodyMd, styles.input, !!error && styles.inputError]} />
            {codeSent && <>
              <Text style={[typography.labelMd, styles.label]}>Verification code</Text>
              <TextInput value={code} onChangeText={setCode} placeholder="6-digit code" placeholderTextColor={colors.secondary} keyboardType="number-pad" maxLength={6} style={[typography.bodyMd, styles.input, !!error && styles.inputError]} />
              <Text style={[typography.bodySm, styles.hint]}>Enter the six-digit code sent to your email.</Text>
              <Text style={[typography.labelMd, styles.label]}>New password</Text>
              <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="At least 8 characters" placeholderTextColor={colors.secondary} secureTextEntry autoComplete="new-password" style={[typography.bodyMd, styles.input, !!error && styles.inputError]} />
              <Text style={[typography.labelMd, styles.label]}>Confirm new password</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your new password" placeholderTextColor={colors.secondary} secureTextEntry autoComplete="new-password" style={[typography.bodyMd, styles.input, !!error && styles.inputError]} onSubmitEditing={handleReset} />
            </>}
            {!!error && <Text style={[typography.bodySm, styles.error]}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={handleReset}><Text style={[typography.labelLg, styles.primaryText]}>{codeSent ? 'Verify and reset password' : 'Send verification code'}</Text></Pressable>
          </>
        )}
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/?auth=login')}><Text style={[typography.labelMd, styles.secondaryText]}>Back to Log In</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { color: colors.onSurface, textAlign: 'center' },
  subtitle: { color: colors.secondary, textAlign: 'center', marginBottom: spacing.lg },
  label: { color: colors.secondary, marginTop: spacing.xs },
  input: { height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: spacing.md, color: colors.onSurface },
  inputError: { borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  hint: { color: colors.tertiary },
  primaryButton: { height: 52, marginTop: spacing.lg, borderRadius: radius.DEFAULT, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer },
  primaryText: { color: colors.onPrimary },
  secondaryButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.secondary },
});
