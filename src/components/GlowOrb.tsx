import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

interface GlowOrbProps {
  size?: number;
  colorsSet: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

/** A soft blurred-looking circular glow, used behind the vessel/pill shapes for a bit of depth and light. */
export function GlowOrb({ size = 260, colorsSet, style }: GlowOrbProps) {
  return (
    <LinearGradient
      colors={colorsSet}
      start={{ x: 0.5, y: 0.15 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        styles.glow,
        style,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    opacity: 0.9,
  },
});
