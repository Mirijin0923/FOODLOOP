import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PhoneFrame } from '@/components/phone-frame';
import { AppStateProvider } from '@/context/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppStateProvider>
        <PhoneFrame>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="phone-login" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="rate-pickup" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PhoneFrame>
      </AppStateProvider>
    </ThemeProvider>
  );
}
