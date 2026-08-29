import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { hasTimePassed, minutesSince } from '../lib/date';
import {
  initNotifications,
  registerNotificationResponseHandler,
  scheduleMedReminders,
  scheduleWaterReminders,
  snoozeMedNow,
  snoozeWaterNow,
} from '../lib/notifications';
import { MedStore, WaterStore } from '../lib/storage';
import type { FoodTiming, MedReminder, MedStatus, WaterSettings } from '../lib/types';

/** A pending reminder auto-flips to "missed" this many minutes after its time if untouched. */
const AUTO_MISSED_GRACE_MINUTES = 60;

interface AppStateValue {
  loading: boolean;
  permissionGranted: boolean;

  water: { settings: WaterSettings; count: number };
  drinkGlass: () => Promise<void>;
  undoGlass: () => Promise<void>;
  updateWaterSettings: (patch: Partial<WaterSettings>) => Promise<void>;

  medReminders: MedReminder[];
  medStatuses: Record<string, MedStatus>;
  addMedReminder: (input: { time: string; label: string; foodTiming: FoodTiming }) => Promise<void>;
  updateMedReminder: (id: string, patch: Partial<Omit<MedReminder, 'id'>>) => Promise<void>;
  deleteMedReminder: (id: string) => Promise<void>;
  setMedStatus: (id: string, status: MedStatus) => Promise<void>;

  refreshAll: () => Promise<void>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [waterSettings, setWaterSettingsState] = useState<WaterSettings>({
    goalGlasses: 8,
    windowStart: '08:00',
    windowEnd: '21:00',
    glassMl: 250,
  });
  const [waterCount, setWaterCount] = useState(0);
  const [medReminders, setMedReminders] = useState<MedReminder[]>([]);
  const [medStatuses, setMedStatuses] = useState<Record<string, MedStatus>>({});

  const remindersRef = useRef<MedReminder[]>([]);
  remindersRef.current = medReminders;
  const waterSettingsRef = useRef<WaterSettings>(waterSettings);
  waterSettingsRef.current = waterSettings;

  /** Auto-marks any still-pending reminder as "missed" once its grace period has elapsed. */
  const applyAutoMissed = useCallback(async (reminders: MedReminder[], statuses: Record<string, MedStatus>) => {
    const updates: Array<Promise<void>> = [];
    const next = { ...statuses };
    for (const reminder of reminders) {
      if (!reminder.enabled) continue;
      const status = next[reminder.id] ?? 'pending';
      if (status === 'pending' && hasTimePassed(reminder.time) && minutesSince(reminder.time) > AUTO_MISSED_GRACE_MINUTES) {
        next[reminder.id] = 'missed';
        updates.push(MedStore.setStatus(reminder.id, 'missed'));
      }
    }
    if (updates.length) await Promise.all(updates);
    return next;
  }, []);

  const refreshAll = useCallback(async () => {
    const [settings, count, reminders, statuses] = await Promise.all([
      WaterStore.getSettings(),
      WaterStore.getTodayCount(),
      MedStore.getReminders(),
      MedStore.getTodayStatuses(),
    ]);
    const withAutoMissed = await applyAutoMissed(reminders, statuses);
    setWaterSettingsState(settings);
    setWaterCount(count);
    setMedReminders(reminders);
    setMedStatuses(withAutoMissed);

    // Re-sync the OS notification schedule with whatever's actually stored. Without this,
    // a fresh install (or anything that leaves the two out of step) would show correct
    // "next reminder" text in the UI while zero notifications are actually registered with
    // the OS — scheduling only ever happened as a side effect of editing settings/reminders.
    //
    // Run these one at a time, not Promise.all: water schedules up to ~14 notifications in a
    // loop, and interleaving that with medication's own schedule/cancel calls to the same
    // native notification center risks a race where some requests silently don't register.
    // Each is also isolated in its own try/catch so a failure in one doesn't take out the
    // other or leave the caller with an unhandled rejection.
    try {
      await scheduleWaterReminders(settings);
    } catch (e) {
      console.warn('Failed to schedule water reminders', e);
    }
    try {
      await scheduleMedReminders(reminders);
    } catch (e) {
      console.warn('Failed to schedule medication reminders', e);
    }
  }, [applyAutoMissed]);

  // Plain functions (not useCallback) so they can freely reference drinkGlass/setMedStatus
  // even though those are declared further down — the bodies only run later, when a
  // notification is actually tapped, by which point the whole component has rendered once
  // and every declaration below exists. They read live data via the refs above rather than
  // depending on the closure staying fresh, since the mount effect registers them exactly once.
  const onWaterTap = () => {
    Alert.alert('Time to hydrate 💧', 'Did you drink a glass of water?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Snooze 10m', onPress: () => snoozeWaterNow(waterSettingsRef.current.glassMl) },
      { text: 'Drank it', onPress: () => drinkGlass() },
    ]);
  };

  const onMedTap = (reminderId: string) => {
    const reminder = remindersRef.current.find((r) => r.id === reminderId);
    if (!reminder) return;
    Alert.alert('Medication reminder 💊', reminder.label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Missed', style: 'destructive', onPress: () => setMedStatus(reminderId, 'missed') },
      {
        text: 'Snooze 10m',
        onPress: () => {
          setMedStatus(reminderId, 'snoozed');
          snoozeMedNow(reminder);
        },
      },
      { text: 'Taken', onPress: () => setMedStatus(reminderId, 'taken') },
    ]);
  };

  useEffect(() => {
    (async () => {
      const granted = await initNotifications();
      setPermissionGranted(granted);
      await refreshAll();
      setLoading(false);
    })();

    const sub = registerNotificationResponseHandler(
      () => refreshAll(),
      () => onWaterTap(),
      (reminderId) => onMedTap(reminderId)
    );

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refreshAll();
    });

    return () => {
      sub.remove();
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drinkGlass = useCallback(async () => {
    const next = await WaterStore.increment();
    setWaterCount(next);
  }, []);

  const undoGlass = useCallback(async () => {
    const next = await WaterStore.decrement();
    setWaterCount(next);
  }, []);

  const updateWaterSettings = useCallback(async (patch: Partial<WaterSettings>) => {
    const next = await WaterStore.setSettings(patch);
    setWaterSettingsState(next);
    await scheduleWaterReminders(next);
  }, []);

  const addMedReminder = useCallback(async (input: { time: string; label: string; foodTiming: FoodTiming }) => {
    await MedStore.addReminder(input);
    const reminders = await MedStore.getReminders();
    setMedReminders(reminders);
    await scheduleMedReminders(reminders);
  }, []);

  const updateMedReminder = useCallback(async (id: string, patch: Partial<Omit<MedReminder, 'id'>>) => {
    await MedStore.updateReminder(id, patch);
    const reminders = await MedStore.getReminders();
    setMedReminders(reminders);
    await scheduleMedReminders(reminders);
  }, []);

  const deleteMedReminder = useCallback(async (id: string) => {
    await MedStore.deleteReminder(id);
    const reminders = await MedStore.getReminders();
    setMedReminders(reminders);
    setMedStatuses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await scheduleMedReminders(reminders);
  }, []);

  const setMedStatus = useCallback(async (id: string, status: MedStatus) => {
    await MedStore.setStatus(id, status);
    setMedStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      loading,
      permissionGranted,
      water: { settings: waterSettings, count: waterCount },
      drinkGlass,
      undoGlass,
      updateWaterSettings,
      medReminders,
      medStatuses,
      addMedReminder,
      updateMedReminder,
      deleteMedReminder,
      setMedStatus,
      refreshAll,
    }),
    [
      loading,
      permissionGranted,
      waterSettings,
      waterCount,
      drinkGlass,
      undoGlass,
      updateWaterSettings,
      medReminders,
      medStatuses,
      addMedReminder,
      updateMedReminder,
      deleteMedReminder,
      setMedStatus,
      refreshAll,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
