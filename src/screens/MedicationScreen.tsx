import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BigGlowButton } from '../components/BigGlowButton';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { PillVessel } from '../components/PillVessel';
import { useAppState } from '../context/AppStateContext';
import { formatDateLong, formatDateTime12h, formatTime12h } from '../lib/date';
import { nextMedReminder } from '../lib/nextReminder';
import type { MedReminder, MedStatus } from '../lib/types';
import { colors, gradients, statusColors } from '../theme/colors';
import { MedReminderModal } from './MedReminderModal';

const STATUS_LABEL: Record<MedStatus, string> = {
  pending: 'Pending',
  taken: 'Taken',
  snoozed: 'Snoozed',
  missed: 'Missed',
};

export function MedicationScreen() {
  const { medReminders, medStatuses, setMedStatus } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedReminder | undefined>(undefined);
  const { height: windowHeight } = useWindowDimensions();

  // Same screen-height-relative scaling as the water glass, so the pill fills a
  // consistent share of the screen instead of leaving a large gap on taller phones.
  const pillWidth = Math.round(Math.min(190, Math.max(130, windowHeight * 0.19)));

  const enabled = useMemo(() => medReminders.filter((r) => r.enabled), [medReminders]);
  const takenCount = enabled.filter((r) => medStatuses[r.id] === 'taken').length;

  const sorted = useMemo(() => [...medReminders].sort((a, b) => a.time.localeCompare(b.time)), [medReminders]);
  const next = nextMedReminder(medReminders, medStatuses);
  const nextTime = next ? new Date(`1970-01-01T${next.time}:00`) : null;

  const openAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };
  const openEdit = (reminder: MedReminder) => {
    setEditing(reminder);
    setModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.dateLabel}>📅 {formatDateLong()}</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>💊 Next dose</Text>
            <Text style={styles.nextValue}>{next && nextTime ? formatDateTime12h(nextTime) : 'All done'}</Text>
          </View>
        </View>
        <View style={styles.statsRight}>
          <Text style={styles.statsLabel}>✓ Taken today</Text>
          <Text style={styles.statsValue}>
            {takenCount} / {enabled.length}
          </Text>
          {next ? <Text style={styles.statsSub}>{next.label}</Text> : null}
        </View>
      </View>

      <View style={styles.heroWrap}>
        <PillVessel
          taken={takenCount}
          total={enabled.length}
          width={pillWidth}
          caption={enabled.length > 0 ? `${takenCount} / ${enabled.length} taken today` : 'No reminders yet'}
        />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={sorted}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Add a reminder to get started.</Text>}
        renderItem={({ item }) => (
          <ReminderRow
            reminder={item}
            status={medStatuses[item.id] ?? 'pending'}
            onEdit={() => openEdit(item)}
            onSetStatus={(status) => setMedStatus(item.id, status)}
          />
        )}
      />

      <View style={styles.addWrap}>
        <BigGlowButton label="Add" icon="＋" onPress={openAdd} colorsSet={gradients.tealButton} size={76} />
      </View>

      <MedReminderModal visible={modalOpen} onClose={() => setModalOpen(false)} reminder={editing} />
    </View>
  );
}

function ReminderRow({
  reminder,
  status,
  onEdit,
  onSetStatus,
}: {
  reminder: MedReminder;
  status: MedStatus;
  onEdit: () => void;
  onSetStatus: (status: MedStatus) => void;
}) {
  const foodLabel = reminder.foodTiming === 'before' ? 'Before food' : reminder.foodTiming === 'after' ? 'After food' : null;
  const canAct = reminder.enabled && (status === 'pending' || status === 'snoozed');

  return (
    <GlassCard>
      <Pressable onPress={onEdit}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{reminder.label}</Text>
            <Text style={styles.rowMeta}>
              {formatTime12h(reminder.time)}
              {foodLabel ? ` · ${foodLabel}` : ''}
              {!reminder.enabled ? ' · Off' : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColors[status] }]}>
            <Text style={styles.statusPillText}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>

        {canAct && (
          <View style={styles.actionRow}>
            <GradientButton
              label="Taken"
              compact
              onPress={() => onSetStatus('taken')}
              colorsSet={gradients.tealButton}
              style={styles.actionButton}
              textStyle={styles.actionText}
            />
            <GradientButton
              label="Snooze"
              compact
              onPress={() => onSetStatus('snoozed')}
              colorsSet={gradients.warningButton}
              style={styles.actionButton}
              textStyle={styles.actionText}
            />
            <GradientButton
              label="Missed"
              compact
              onPress={() => onSetStatus('missed')}
              colorsSet={gradients.dangerButton}
              style={styles.actionButton}
              textStyle={styles.actionText}
            />
          </View>
        )}
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  dateLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  nextRow: { marginTop: 10 },
  nextLabel: { color: colors.textSecondary, fontSize: 12 },
  nextValue: { color: colors.neonCyan, fontSize: 22, fontWeight: '700', marginTop: 2 },
  statsRight: { alignItems: 'flex-end', maxWidth: 160 },
  statsLabel: { color: colors.textSecondary, fontSize: 12 },
  statsValue: { color: colors.neonCyan, fontSize: 18, fontWeight: '700', marginTop: 2 },
  statsSub: { color: colors.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'right' },

  heroWrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },

  list: { flex: 1 },
  listContent: { paddingBottom: 12, gap: 10 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 24 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  statusPillText: { color: colors.background, fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1 },
  actionText: { fontSize: 12, color: colors.background },
  addWrap: { alignItems: 'center', marginVertical: 10 },
});
