import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface GoalPickerFieldProps {
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
}

/**
 * A tap-to-pick field for a small integer range — avoids the number-pad keyboard (which has
 * no obvious way to dismiss before hitting Save) in favor of choosing from a fixed list.
 */
export function GoalPickerField({ label, value, options, onChange }: GoalPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Android's Picker is itself a compact, native dropdown — no extra field/modal needed,
  // it opens its own menu on tap and closes as soon as a value is picked.
  if (Platform.OS === 'android') {
    return (
      <View style={styles.androidField}>
        <Text style={styles.label}>{label}</Text>
        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(Number(v))}
          mode="dropdown"
          style={styles.androidPicker}
          dropdownIconColor={colors.textPrimary}
        >
          {options.map((n) => (
            <Picker.Item key={n} label={String(n)} value={n} />
          ))}
        </Picker>
      </View>
    );
  }

  // iOS's Picker only renders as an inline spinner wheel, so give it a compact field that
  // opens a sheet containing the wheel plus an explicit "Done" to confirm and close.
  return (
    <View>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Picker selectedValue={draft} onValueChange={(v) => setDraft(Number(v))} itemStyle={styles.wheelItem}>
              {options.map((n) => (
                <Picker.Item key={n} label={String(n)} value={n} color={colors.textPrimary} />
              ))}
            </Picker>
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: { color: colors.textSecondary, fontSize: 15 },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  androidField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingLeft: 16,
  },
  androidPicker: { flex: 1, color: colors.textPrimary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,18,22,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  wheelItem: { color: colors.textPrimary },
  doneButton: { backgroundColor: colors.accentTeal, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  doneText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
