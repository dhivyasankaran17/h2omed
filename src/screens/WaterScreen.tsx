import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BigGlowButton } from '../components/BigGlowButton';
import { CircleIconButton } from '../components/CircleIconButton';
import { GlassVessel } from '../components/GlassVessel';
import { ReflectionGlow } from '../components/ReflectionGlow';
import { useAppState } from '../context/AppStateContext';
import { formatDateLong, formatDateTime12h, formatTime12h } from '../lib/date';
import { nextWaterReminder } from '../lib/nextReminder';
import { colors, gradients } from '../theme/colors';
import { WaterSettingsModal } from './WaterSettingsModal';

// Glass aspect ratio (height / width) from GlassVessel's internal viewBox.
const GLASS_ASPECT = 220 / 160;

function GaugeLine({ label, style }: { label: string; style: object }) {
  return (
    <View style={[styles.gaugeRow, style]} pointerEvents="none">
      <View style={styles.gaugeLine} />
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

export function WaterScreen() {
  const { water, drinkGlass, undoGlass } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { height: windowHeight } = useWindowDimensions();

  // Keep the "next reminder" readout current without needing a manual refresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { count, settings } = water;
  const progress = settings.goalGlasses > 0 ? count / settings.goalGlasses : 0;
  const reachedGoal = count >= settings.goalGlasses;
  const drunkMl = count * settings.glassMl;
  const remainingMl = Math.max(0, settings.goalGlasses * settings.glassMl - drunkMl);
  const next = nextWaterReminder(settings, now);

  // Scale the glass off the actual screen height so it fills a consistent share of the
  // screen (and leaves a much smaller gap below) on everything from an SE to a Pro Max,
  // instead of a fixed size tuned to one device.
  const figureWidth = Math.round(Math.min(280, Math.max(190, windowHeight * 0.3)));
  const figureHeight = figureWidth * GLASS_ASPECT;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.dateLabel}>📅 {formatDateLong(now)}</Text>
          <Pressable onPress={() => setSettingsOpen(true)} hitSlop={8} style={styles.nextRow}>
            <Text style={styles.nextLabel}>⏰ Next reminder</Text>
            <Text style={styles.nextValue}>{next ? formatDateTime12h(next) : '—'}</Text>
          </Pressable>
        </View>
        <View style={styles.statsRight}>
          <Text style={styles.statsLabel}>✓ Water intake today</Text>
          <Text style={styles.statsValue}>{drunkMl} ml</Text>
          <Text style={styles.statsSub}>
            Remaining <Text style={styles.statsSubStrong}>{remainingMl} ml</Text>
          </Text>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <View style={[styles.figureBox, { width: figureWidth + 70, height: figureHeight }]}>
          <GlassVessel progress={progress} width={figureWidth} />
          <GaugeLine label={`${settings.goalGlasses * settings.glassMl} ml`} style={styles.gaugeTop} />
          <GaugeLine label="50%" style={styles.gaugeMid} />
          <GaugeLine label="0%" style={styles.gaugeBottom} />
        </View>

        <ReflectionGlow width={figureWidth + 50} />

        {reachedGoal && <Text style={styles.goalReached}>Goal reached today 🎉</Text>}
        <Text style={styles.caption}>
          {count} / {settings.goalGlasses} glasses
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.controls}>
          <CircleIconButton icon="−" onPress={undoGlass} disabled={count <= 0} />
          <BigGlowButton label={`+1 Glass`} icon="💧" onPress={drinkGlass} colorsSet={gradients.tealButton} />
          <CircleIconButton icon="⚙️" onPress={() => setSettingsOpen(true)} />
        </View>
        <Text style={styles.windowHint}>
          Hourly reminders {formatTime12h(settings.windowStart)} – {formatTime12h(settings.windowEnd)}
        </Text>
      </View>

      <WaterSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  dateLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  nextRow: { marginTop: 10 },
  nextLabel: { color: colors.textSecondary, fontSize: 12 },
  nextValue: { color: colors.neonCyan, fontSize: 24, fontWeight: '700', marginTop: 2 },
  statsRight: { alignItems: 'flex-end' },
  statsLabel: { color: colors.textSecondary, fontSize: 12 },
  statsValue: { color: colors.neonCyan, fontSize: 18, fontWeight: '700', marginTop: 2 },
  statsSub: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  statsSubStrong: { color: colors.textPrimary, fontWeight: '700' },

  heroWrap: { alignItems: 'center' },
  figureBox: { alignItems: 'center', position: 'relative' },
  gaugeRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gaugeTop: { top: 6 },
  gaugeMid: { top: '50%', marginTop: -1 },
  gaugeBottom: { bottom: 6 },
  gaugeLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  gaugeLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  goalReached: { color: colors.accentTealLight, fontSize: 13, fontWeight: '600', marginTop: 6 },
  caption: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 8 },

  footer: { gap: 10 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  windowHint: { color: colors.textSecondary, fontSize: 11, textAlign: 'center' },
});
