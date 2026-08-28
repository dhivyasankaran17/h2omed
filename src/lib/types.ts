export type FoodTiming = 'before' | 'after' | 'none';

export interface MedReminder {
  id: string;
  time: string; // "HH:mm", 24h
  label: string;
  foodTiming: FoodTiming;
  enabled: boolean;
}

export type MedStatus = 'pending' | 'taken' | 'snoozed' | 'missed';

/** date ("YYYY-MM-DD") -> reminderId -> status, for today and recent days only. */
export type MedDailyLog = Record<string, Record<string, MedStatus>>;

export interface WaterSettings {
  goalGlasses: number;
  windowStart: string; // "HH:mm"
  windowEnd: string; // "HH:mm"
  glassMl: number; // fixed serving size per glass
}

export interface WaterDaily {
  date: string; // "YYYY-MM-DD"
  count: number;
}
