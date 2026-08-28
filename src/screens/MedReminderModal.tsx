import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { TimePickerField } from '../components/TimePickerField';
import { useAppState } from '../context/AppStateContext';
import { colors, gradients } from '../theme/colors';
import type { FoodTiming, MedReminder } from '../lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pass an existing reminder to edit it; omit to create a new one. */
  reminder?: MedReminder;
}

const PRESETS: { label: string; time: string; foodTiming: FoodTiming }[] = [
  { label: 'Morning – Before food', time: '07:30', foodTiming: 'before' },
  { label: 'Morning – After food', time: '08:30', foodTiming: 'after' },
  { label: 'Afternoon – Before food', time: '12:30', foodTiming: 'before' },
  { label: 'Afternoon – After food', time: '13:30', foodTiming: 'after' },
  { label: 'Night – Before food', time: '19:30', foodTiming: 'before' },
  { label: 'Night – After food', time: '20:30', foodTiming: 'after' },
];

const FOOD_OPTIONS: { key: FoodTiming; label: string }[] = [
  { key: 'before', label: 'Before food' },
  { key: 'after', label: 'After food' },
  { key: 'none', label: 'No food tag' },
];

export function MedReminderModal({ visible, onClose, reminder }: Props) {
  const { addMedReminder, updateMedReminder, deleteMedReminder } = useAppState();
  const isEditing = !!reminder;

  const [label, setLabel] = useState(reminder?.label ?? '');
  const [time, setTime] = useState(reminder?.time ?? '08:00');
  const [foodTiming, setFoodTiming] = useState<FoodTiming>(reminder?.foodTiming ?? 'before');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLabel(reminder?.label ?? '');
      setTime(reminder?.time ?? '08:00');
      setFoodTiming(reminder?.foodTiming ?? 'before');
      setError(null);
    }
  }, [visible, reminder]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setLabel(preset.label);
    setTime(preset.time);
    setFoodTiming(preset.foodTiming);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      setError('Give this reminder a name, e.g. "Blood pressure pill".');
      return;
    }
    if (isEditing) {
      await updateMedReminder(reminder!.id, { label: label.trim(), time, foodTiming });
    } else {
      await addMedReminder({ label: label.trim(), time, foodTiming });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (reminder) await deleteMedReminder(reminder.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassCard style={styles.card} contentStyle={styles.cardContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{isEditing ? 'Edit reminder' : 'Add medication reminder'}</Text>

            {!isEditing && (
              <>
                <Text style={styles.sectionLabel}>Quick presets</Text>
                <View style={styles.presetGrid}>
                  {PRESETS.map((preset) => (
                    <Pressable key={preset.label} style={styles.presetChip} onPress={() => applyPreset(preset)}>
                      <Text style={styles.presetText}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Morning pills"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.sectionLabel}>Time</Text>
            <TimePickerField label="Reminder time" value={time} onChange={setTime} />

            <Text style={styles.sectionLabel}>Food timing</Text>
            <View style={styles.foodRow}>
              {FOOD_OPTIONS.map((opt) => {
                const active = opt.key === foodTiming;
                return (
                  <Pressable
                    key={opt.key}
                    style={[styles.foodChip, active && styles.foodChipActive]}
                    onPress={() => setFoodTiming(opt.key)}
                  >
                    <Text style={[styles.foodText, active && styles.foodTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttonRow}>
              <GradientButton label="Cancel" onPress={onClose} colorsSet={['#123B34', colors.surfaceAlt]} style={styles.button} />
              <GradientButton label="Save" onPress={handleSave} colorsSet={gradients.tealButton} style={styles.button} />
            </View>

            {isEditing && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteText}>Delete reminder</Text>
              </Pressable>
            )}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3,18,22,0.7)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0, maxHeight: '85%' },
  cardContent: { padding: 24 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sectionLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  presetText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
  foodRow: { flexDirection: 'row', gap: 8 },
  foodChip: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  foodChipActive: { backgroundColor: colors.accentTeal },
  foodText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  foodTextActive: { color: colors.textPrimary },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { flex: 1 },
  deleteButton: { alignItems: 'center', paddingVertical: 14, marginTop: 4, marginBottom: 8 },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
