// Wraps the app in a phone-shaped frame (status bar, notch, home indicator)
// when viewed on a wide desktop browser — purely cosmetic, for demoing the
// app on web so it doesn't just stretch across the whole window.
//
// On native (iOS/Android) and on narrow/mobile browsers, this renders
// children directly with no frame.

import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '@/constants/foodloop-theme';

const FRAME_WIDTH = 390;
const FRAME_HEIGHT = 844;
const MIN_WINDOW_WIDTH_FOR_FRAME = 900; // only show the frame on wide/desktop windows

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const time = useClock();

  const shouldFrame = Platform.OS === 'web' && width >= MIN_WINDOW_WIDTH_FOR_FRAME;

  if (!shouldFrame) {
    return <>{children}</>;
  }

  const hh = time.getHours() % 12 || 12;
  const mm = time.getMinutes().toString().padStart(2, '0');

  return (
    <View style={styles.backdrop}>
      <View style={styles.device}>
        <View style={styles.notch} />

        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{`${hh}:${mm}`}</Text>
          <View style={styles.statusRight}>
            <Text style={styles.statusText}>5G</Text>
            <View style={styles.batteryIcon}>
              <View style={styles.batteryFill} />
            </View>
          </View>
        </View>

        <View style={styles.screen}>{children}</View>

        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    minHeight: '100vh' as any,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 32,
  },
  device: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 48,
    borderWidth: 10,
    borderColor: '#1c1c1e',
    overflow: 'hidden',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -80,
    width: 160,
    height: 28,
    backgroundColor: '#1c1c1e',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 10,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 28,
    backgroundColor: colors.surface,
  },
  statusText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryIcon: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.onSurface,
    padding: 1.5,
  },
  batteryFill: {
    flex: 1,
    backgroundColor: colors.onSurface,
    borderRadius: 1,
  },
  screen: {
    flex: 1,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -67,
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.onSurface,
    opacity: 0.6,
  },
});
