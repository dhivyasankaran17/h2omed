import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gradients } from '../theme/colors';

interface BigGlowButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  colorsSet?: readonly [string, string, ...string[]];
}

/** The large, glowing circular primary action — the "+1 Glass" / "+ Add reminder" hero button. */
export function BigGlowButton({ label, icon, onPress, disabled, size = 96, colorsSet = gradients.tealButton }: BigGlowButtonProps) {
  return (
    <View style={[styles.halo, { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
      >
        <LinearGradient
          colors={colorsSet}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(95, 227, 230, 0.12)',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: { fontSize: 22, marginBottom: 2 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 },
});
