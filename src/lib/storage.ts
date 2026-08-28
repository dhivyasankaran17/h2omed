import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './date';
import { uid } from './id';
import type { FoodTiming, MedDailyLog, MedReminder, MedStatus, WaterDaily, WaterSettings } from './types';

const KEYS = {
  waterSettings: '@h2omed/water_settings',
  waterDaily: '@h2omed/water_daily',
  medReminders: '@h2omed/med_reminders',
  medDailyLog: '@h2omed/med_daily_log',
} as const;

const DEFAULT_WATER_SETTINGS: WaterSettings = {
  goalGlasses: 8,
  windowStart: '08:00',
  windowEnd: '21:00',
  glassMl: 250,
};

/** How many days of medication status history to keep around (today needs day-1 to detect rollovers; a small trailing window is plenty since H2OMed has no history UI). */
const MED_LOG_RETENTION_DAYS = 3;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---------- Water ----------

export const WaterStore = {
  async getSettings(): Promise<WaterSettings> {
    return readJSON(KEYS.waterSettings, DEFAULT_WATER_SETTINGS);
  },

  async setSettings(patch: Partial<WaterSettings>): Promise<WaterSettings> {
    const current = await WaterStore.getSettings();
    const next = { ...current, ...patch };
    await writeJSON(KEYS.waterSettings, next);
    return next;
  },

  /** Returns today's glass count, resetting to 0 if the stored day has rolled over. */
  async getTodayCount(): Promise<number> {
    const daily = await readJSON<WaterDaily>(KEYS.waterDaily, { date: todayKey(), count: 0 });
    if (daily.date !== todayKey()) return 0;
    return daily.count;
  },

  async setTodayCount(count: number): Promise<number> {
    const clamped = Math.max(0, count);
    await writeJSON(KEYS.waterDaily, { date: todayKey(), count: clamped } satisfies WaterDaily);
    return clamped;
  },

  async increment(): Promise<number> {
    const current = await WaterStore.getTodayCount();
    return WaterStore.setTodayCount(current + 1);
  },

  async decrement(): Promise<number> {
    const current = await WaterStore.getTodayCount();
    return WaterStore.setTodayCount(current - 1);
  },
};

// ---------- Medication ----------

export const MedStore = {
  async getReminders(): Promise<MedReminder[]> {
    const raw = await AsyncStorage.getItem(KEYS.medReminders);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as MedReminder[];
    } catch {
      return [];
    }
  },

  async saveReminders(reminders: MedReminder[]): Promise<void> {
    await writeJSON(KEYS.medReminders, reminders);
  },

  async addReminder(input: { time: string; label: string; foodTiming: FoodTiming }): Promise<MedReminder> {
    const reminders = await MedStore.getReminders();
    const reminder: MedReminder = { id: uid(), enabled: true, ...input };
    await MedStore.saveReminders([...reminders, reminder]);
    return reminder;
  },

  async updateReminder(id: string, patch: Partial<Omit<MedReminder, 'id'>>): Promise<void> {
    const reminders = await MedStore.getReminders();
    await MedStore.saveReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  },

  async deleteReminder(id: string): Promise<void> {
    const reminders = await MedStore.getReminders();
    await MedStore.saveReminders(reminders.filter((r) => r.id !== id));
  },

  async getLog(): Promise<MedDailyLog> {
    const raw = await AsyncStorage.getItem(KEYS.medDailyLog);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as MedDailyLog;
    } catch {
      return {};
    }
  },

  async getTodayStatuses(): Promise<Record<string, MedStatus>> {
    const log = await MedStore.getLog();
    return log[todayKey()] ?? {};
  },

  async setStatus(reminderId: string, status: MedStatus, date: string = todayKey()): Promise<void> {
    const log = await MedStore.getLog();
    const dayLog = { ...(log[date] ?? {}), [reminderId]: status };
    const next: MedDailyLog = { ...log, [date]: dayLog };

    // Trim old days so the log doesn't grow forever.
    const cutoff = Date.now() - MED_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const key of Object.keys(next)) {
      if (new Date(key).getTime() < cutoff) delete next[key];
    }

    await writeJSON(KEYS.medDailyLog, next);
  },
};
