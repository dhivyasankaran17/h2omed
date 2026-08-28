import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatTime12h, parseHHMM, toHHMM } from '../lib/date';
import { colors } from '../theme/colors';

interface TimePickerFieldProps {
  label: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}

function hhmmToDate(value: string): Date {
  const { hour, minute } = parseHHMM(value);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function TimePickerField({ label, value, onChange }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && date) onChange(toHHMM(date.getHours(), date.getMinutes()));
      return;
    }
    // iOS: keep the picker open, stage the value until "Done".
    if (date) setDraft(toHHMM(date.getHours(), date.getMinutes()));
  };

  return (
    <View>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatTime12h(value)}</Text>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={hhmmToDate(value)} mode="time" display="default" onChange={handleChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{label}</Text>
              <DateTimePicker value={hhmmToDate(draft)} mode="time" display="spinner" onChange={handleChange} themeVariant="dark" />
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
      )}
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,18,22,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  doneButton: { backgroundColor: colors.accentTeal, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  doneText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
