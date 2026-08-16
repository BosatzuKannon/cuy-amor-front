import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/theme/colors';
import { Radius } from '@/theme/layout';

function FloatingShape({
  style,
  color,
}: {
  style: object;
  color: string;
}) {
  return <View style={[styles.shape, { backgroundColor: color }, style]} />;
}

export function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <FloatingShape color="rgba(255,255,255,0.14)" style={styles.shapeOne} />
      <FloatingShape color="rgba(139,69,19,0.28)" style={styles.shapeTwo} />
      <FloatingShape color="rgba(255,255,255,0.10)" style={styles.shapeThree} />
    </View>
  );
}

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  shapeOne: {
    width: 260,
    height: 260,
    top: -70,
    right: -80,
  },
  shapeTwo: {
    width: 180,
    height: 180,
    top: 200,
    left: -70,
  },
  shapeThree: {
    width: 120,
    height: 120,
    top: '55%',
    right: -40,
  },
});