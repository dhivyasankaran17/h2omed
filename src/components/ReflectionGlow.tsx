import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { gradients } from '../theme/colors';

/** A soft horizontal light pool, like a reflection on the ground beneath the hero graphic. */
export function ReflectionGlow({ width = 260 }: { width?: number }) {
  return (
    <View style={[styles.wrap, { width }]} pointerEvents="none">
      <LinearGradient colors={gradients.reflection} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.bar} />
      <LinearGradient colors={gradients.reflection} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.bar, styles.barThin]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  bar: { width: '100%', height: 6, borderRadius: 3 },
  barThin: { width: '65%', height: 3 },
});
