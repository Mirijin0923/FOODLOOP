import { Image } from 'expo-image';
import * as NativeSplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';

type SplashScreenProps = { onFinish: () => void };

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    NativeSplashScreen.hideAsync().catch(() => undefined);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver }),
    ]).start(({ finished }) => { if (finished) onFinish(); });
  }, [onFinish, opacity, useNativeDriver]);

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.image} contentFit="contain" />
      <Text style={styles.title}>FOODLOOP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', backgroundColor: '#1a1a1a', justifyContent: 'center', zIndex: 1000 },
  image: { height: 150, width: 150 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700', letterSpacing: 3, marginTop: 18 },
});
