import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { TimePickerField } from '../components/TimePickerField';
import { useAppState } from '../context/AppStateContext';
import { colors, gradients } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WaterSettingsModal({ visible, onClose }: Props) {
  const { water, updateWaterSettings } = useAppState();
  const [goalText, setGoalText] = useState(String(water.settings.goalGlasses));
  const [windowStart, setWindowStart] = useState(water.settings.windowStart);
  const [windowEnd, setWindowEnd] = useState(water.settings.windowEnd);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const goal = parseInt(goalText, 10);
    if (!Number.isFinite(goal) || goal <= 0) {
      setError('Enter a goal of at least 1 glass.');
      return;
    }
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
          <View style={styles.goalRow}>
            <TextInput
              style={styles.goalInput}
              value={goalText}
              onChangeText={setGoalText}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.goalUnit}>glasses / day (250 mL each)</Text>
          </View>

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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <GradientButton label="Cancel" onPress={onClose} colorsSet={['#123B34', colors.surfaceAlt]} style={styles.button} />
            <GradientButton label="Save" onPress={handleSave} colorsSet={gradients.tealButton} style={styles.button} />
          </View>
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
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalInput: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    width: 72,
    textAlign: 'center',
  },
  goalUnit: { color: colors.textSecondary, fontSize: 13, flexShrink: 1 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1 },
});
