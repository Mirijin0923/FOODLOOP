import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const INFINITY_PATH = 'M 10 50 C 10 20 40 20 60 50 C 80 80 110 80 110 50 C 110 20 80 20 60 50 C 40 80 10 80 10 50';

export function LoadingScreen() {
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);

  useEffect(() => {
    const duration = 1600;
    const startedAt = Date.now();
    let frameId: number;
    const animate = () => {
      setStrokeDashoffset(((Date.now() - startedAt) % duration) / duration * 320);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <View style={styles.container}>
      <Svg height={120} viewBox="0 0 120 100" width={180}>
        <Path d={INFINITY_PATH} fill="none" stroke="#ff4d5a33" strokeLinecap="round" strokeWidth={10} />
        <Path
          d={INFINITY_PATH}
          fill="none"
          stroke="#ff4d5a"
          strokeDasharray="80 240"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={10}
        />
      </Svg>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, alignItems: 'center', backgroundColor: '#1a1a1a', justifyContent: 'center', zIndex: 900 },
  text: { color: '#ffffff', fontSize: 16, marginTop: 8 },
});
