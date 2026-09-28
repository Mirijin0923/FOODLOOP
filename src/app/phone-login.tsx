import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/foodloop-theme';
import { useAppState } from '@/context/app-state';
import { authApi } from '@/services/auth-api';

export default function PhoneLoginScreen() {
  const { login } = useAppState();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const handleContinue = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      setError('Enter a valid phone number, including its country code.');
      return;
    }
    if (!codeSent) {
      try { setLoading(true); await authApi.sendOtp('sms', phone, 'login'); setError(''); setCodeSent(true); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to send SMS.'); } finally { setLoading(false); }
      return;
    }
    setError('');
    setLoading(true);
    try { const { verificationToken } = await authApi.verifyOtp('sms', phone, 'login', code); const result = await authApi.phoneLogin(phone, verificationToken); if (result.registered && result.user) { login(result.user.email ?? `${digits}@phone.foodloop`, result.user.name); router.replace('/(tabs)'); } else router.replace({ pathname: '/signup', params: { phone: digits } }); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to verify SMS code.'); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={[typography.headlineLg, styles.title]}>{codeSent ? 'Verify your phone' : 'Log in with phone'}</Text>
        <Text style={[typography.bodyMd, styles.subtitle]}>{codeSent ? `We sent a verification code to +${phone.replace(/\D/g, '')}.` : 'Use your phone number to continue to FoodLoop.'}</Text>
        {!codeSent ? <>
          <Text style={[typography.labelMd, styles.label]}>Phone number</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+65 8123 4567" placeholderTextColor={colors.secondary} keyboardType="phone-pad" autoComplete="tel" style={[typography.bodyMd, styles.input, !!error && styles.inputError]} />
        </> : <>
          <Text style={[typography.labelMd, styles.label]}>Verification code</Text>
          <TextInput value={code} onChangeText={setCode} placeholder="6-digit code" placeholderTextColor={colors.secondary} keyboardType="number-pad" maxLength={6} style={[typography.bodyMd, styles.input, !!error && styles.inputError]} />
          <Text style={[typography.bodySm, styles.hint]}>Enter the six-digit code sent by SMS.</Text>
        </>}
        {!!error && <Text style={[typography.bodySm, styles.error]}>{error}</Text>}
        <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[typography.labelLg, styles.primaryText]}>{codeSent ? 'Verify and continue' : 'Send verification code'}</Text>}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/?auth=login')}>
          <Text style={[typography.labelMd, styles.secondaryText]}>Back to Log In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { color: colors.onSurface, textAlign: 'center' },
  subtitle: { color: colors.secondary, textAlign: 'center', marginBottom: spacing.lg },
  label: { color: colors.secondary },
  input: { height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: spacing.md, color: colors.onSurface },
  inputError: { borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  hint: { color: colors.tertiary },
  primaryButton: { height: 52, marginTop: spacing.lg, borderRadius: radius.DEFAULT, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer },
  primaryText: { color: colors.onPrimary },
  secondaryButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.secondary },
});
