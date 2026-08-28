import { parseHHMM } from './date';
import type { MedReminder, MedStatus, WaterSettings } from './types';

/** Next on-the-hour water reminder time, or null if the window has no reminders. */
export function nextWaterReminder(settings: WaterSettings, now: Date = new Date()): Date | null {
  const start = parseHHMM(settings.windowStart).hour;
  const end = parseHHMM(settings.windowEnd).hour;
  if (end < start) return null;

  for (let hour = start; hour <= end; hour++) {
    const candidate = new Date(now);
    candidate.setHours(hour, 0, 0, 0);
    if (candidate.getTime() >= now.getTime()) return candidate;
  }

  // Window's over for today — next one is tomorrow's first hour.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(start, 0, 0, 0);
  return tomorrow;
}

/** The nearest still-pending/snoozed medication reminder today, or null if none remain. */
export function nextMedReminder(
  reminders: MedReminder[],
  statuses: Record<string, MedStatus>,
  now: Date = new Date()
): MedReminder | null {
  const upcoming = reminders
    .filter((r) => r.enabled)
    .filter((r) => {
      const status = statuses[r.id] ?? 'pending';
      return status === 'pending' || status === 'snoozed';
    })
    .map((r) => {
      const { hour, minute } = parseHHMM(r.time);
      const time = new Date(now);
      time.setHours(hour, minute, 0, 0);
      return { reminder: r, time };
    })
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  // Prefer the next one still ahead of now; fall back to the earliest overdue one.
  return (upcoming.find((u) => u.time.getTime() >= now.getTime()) ?? upcoming[0])?.reminder ?? null;
}
