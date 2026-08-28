import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gradients } from '../theme/colors';
import { GlassCard } from './GlassCard';

export type TabKey = 'water' | 'medication';

interface TopTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: string; gradient: readonly [string, string, ...string[]] }[] = [
  { key: 'water', label: 'Water', icon: '💧', gradient: gradients.tealButton },
  { key: 'medication', label: 'Medication', icon: '💊', gradient: gradients.tealButton },
];

export function TopTabs({ active, onChange }: TopTabsProps) {
  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.tabTouchable}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {isActive ? (
                <LinearGradient colors={tab.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tabActive}>
                  <Text style={styles.icon}>{tab.icon}</Text>
                  <Text style={styles.labelActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tab}>
                  <Text style={styles.iconInactive}>{tab.icon}</Text>
                  <Text style={styles.label}>{tab.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 8 },
  content: { padding: 4 },
  bar: { flexDirection: 'row', gap: 4 },
  tabTouchable: { flex: 1 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { fontSize: 16 },
  iconInactive: { fontSize: 16, opacity: 0.55 },
  label: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  labelActive: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
});
