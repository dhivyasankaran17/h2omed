import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface CircleIconButtonProps {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

/** Small circular glass button for secondary actions (decrement, settings) flanking a BigGlowButton. */
export function CircleIconButton({ icon, onPress, disabled, size = 52 }: CircleIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, opacity: disabled ? 0.35 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.icon, { fontSize: size * 0.4 }]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: { color: colors.textPrimary },
});
