// Local-time date/time helpers. Everything in H2OMed keys off the device's local day,
// not UTC, so "today" always matches what the user sees on their clock.

/** Returns today's date as a local YYYY-MM-DD key (not UTC). */
export function todayKey(): string {
  return dateKey(new Date());
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "HH:mm" (24h, zero-padded) from hour/minute numbers. */
export function toHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Parses "HH:mm" into { hour, minute }. */
export function parseHHMM(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/** Formats "HH:mm" (24h) as a 12h display string, e.g. "8:00 AM". */
export function formatTime12h(value: string): string {
  const { hour, minute } = parseHHMM(value);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** True if "HH:mm" is earlier than or equal to the current local time. */
export function hasTimePassed(value: string, now: Date = new Date()): boolean {
  const { hour, minute } = parseHHMM(value);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  return now.getTime() >= target.getTime();
}

/** Formats a Date's local time as a 12h display string, e.g. "3:30 PM". */
export function formatDateTime12h(date: Date): string {
  return formatTime12h(toHHMM(date.getHours(), date.getMinutes()));
}

/** "Fri, 28 Aug" style date, in local time. */
export function formatDateLong(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Minutes elapsed since "HH:mm" today (negative if the time hasn't happened yet). */
export function minutesSince(value: string, now: Date = new Date()): number {
  const { hour, minute } = parseHHMM(value);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  return (now.getTime() - target.getTime()) / 60000;
}
