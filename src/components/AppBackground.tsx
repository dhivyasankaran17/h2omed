import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { gradients } from '../theme/colors';
import { GlowOrb } from './GlowOrb';

/** Full-screen gradient wash + a couple of soft off-screen glow orbs, sitting behind all screen content. */
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <GlowOrb size={340} colorsSet={gradients.glowTeal} style={styles.orbTopRight} />
      <GlowOrb size={300} colorsSet={gradients.glowBlue} style={styles.orbBottomLeft} />
      <View style={styles.fill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  orbTopRight: { top: -140, right: -100 },
  orbBottomLeft: { bottom: -160, left: -120 },
});
