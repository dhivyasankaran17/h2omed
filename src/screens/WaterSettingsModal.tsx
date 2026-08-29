import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GoalPickerField } from '../components/GoalPickerField';
import { GradientButton } from '../components/GradientButton';
import { TimePickerField } from '../components/TimePickerField';
import { useAppState } from '../context/AppStateContext';
import { colors, gradients } from '../theme/colors';

const PRIVACY_POLICY_URL = 'https://dhivyasankaran17.github.io/h2omed/';
const GOAL_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1); // 1..30

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WaterSettingsModal({ visible, onClose }: Props) {
  const { water, updateWaterSettings } = useAppState();
  const [goal, setGoal] = useState(water.settings.goalGlasses);
  const [windowStart, setWindowStart] = useState(water.settings.windowStart);
  const [windowEnd, setWindowEnd] = useState(water.settings.windowEnd);
  const [error, setError] = useState<string | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);

  // Lets you confirm what's actually registered with the OS, rather than trusting the
  // in-app math alone — useful for tracking down "I'm not getting reminders" reports.
  useEffect(() => {
    if (!visible || Platform.OS === 'web') return;
    Notifications.getAllScheduledNotificationsAsync()
      .then((all) => setScheduledCount(all.filter((n) => n.identifier.startsWith('water-')).length))
      .catch(() => setScheduledCount(null));
  }, [visible]);

  const handleSave = async () => {
    if (windowEnd < windowStart) {
      setError('End time must be after start time.');
      return;
    }
    setError(null);
    await updateWaterSettings({ goalGlasses: goal, windowStart, windowEnd });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassCard style={styles.card} contentStyle={styles.cardContent}>
          <Text style={styles.title}>Water settings</Text>

          <Text style={styles.sectionLabel}>Daily goal</Text>
          <GoalPickerField label="Glasses / day (250 mL each)" value={goal} options={GOAL_OPTIONS} onChange={setGoal} />

          <Text style={styles.sectionLabel}>Reminder window</Text>
          <Text style={styles.hint}>H2OMed sends one reminder every hour inside this window.</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <TimePickerField label="Start" value={windowStart} onChange={setWindowStart} />
            </View>
            <View style={styles.timeField}>
              <TimePickerField label="End" value={windowEnd} onChange={setWindowEnd} />
            </View>
          </View>

          {scheduledCount !== null && (
            <Text style={styles.scheduledHint}>
              {scheduledCount > 0
                ? `${scheduledCount} hourly reminder${scheduledCount === 1 ? '' : 's'} currently scheduled on this device.`
                : 'No reminders are currently scheduled on this device — try reopening the app.'}
            </Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <GradientButton label="Cancel" onPress={onClose} colorsSet={['#123B34', colors.surfaceAlt]} style={styles.button} />
            <GradientButton label="Save" onPress={handleSave} colorsSet={gradients.tealButton} style={styles.button} />
          </View>

          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.privacyLink} hitSlop={8}>
            <Text style={styles.privacyLinkText}>Privacy Policy</Text>
          </Pressable>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3,18,22,0.7)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  cardContent: { padding: 24, gap: 8 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sectionLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 12 },
  hint: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  scheduledHint: { color: colors.textSecondary, fontSize: 12, marginTop: 10 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1 },
  privacyLink: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  privacyLinkText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' },
});
