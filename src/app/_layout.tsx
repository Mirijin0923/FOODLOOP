import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { LoadingScreen } from '@/components/loading-screen';
import { SplashScreen as FoodLoopSplashScreen } from '@/components/splash-screen';
import { PhoneFrame } from '@/components/phone-frame';
import { AppStateProvider, useAppState } from '@/context/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppStateProvider>
        <AppContent />
        {showSplash && <FoodLoopSplashScreen onFinish={() => setShowSplash(false)} />}
      </AppStateProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isLoading } = useAppState();

  return (
    <>
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
      {isLoading && <LoadingScreen />}
    </>
  );
}
