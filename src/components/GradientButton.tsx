import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  colorsSet: readonly [string, string, ...string[]];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: string;
  compact?: boolean;
}

/** A pressable filled with a diagonal gradient + soft elevation, used for every primary action. */
export function GradientButton({ label, onPress, colorsSet, disabled, style, textStyle, icon, compact }: GradientButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}>
      <LinearGradient
        colors={colorsSet}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, compact && styles.buttonCompact]}
      >
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCompact: { paddingVertical: 10, borderRadius: 12 },
  icon: { fontSize: 15 },
  label: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
