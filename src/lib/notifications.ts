import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseHHMM } from './date';
import { MedStore, WaterStore } from './storage';
import type { MedReminder, WaterSettings } from './types';

const SNOOZE_MINUTES = 10;
const ANDROID_CHANNEL_ID = 'h2omed-reminders';

// expo-notifications' native module isn't linked on web; every call below throws
// ERR_UNAVAILABLE there. H2OMed only targets iOS/Android, so on web we just no-op.
const IS_WEB = Platform.OS === 'web';

export const CATEGORY = {
  water: 'water-reminder',
  med: 'med-reminder',
} as const;

export const ACTION = {
  drankIt: 'DRANK_IT',
  taken: 'TAKEN',
  missed: 'MISSED',
  snooze: 'SNOOZE',
} as const;

// Foreground behavior: show + play sound even while the app is open.
if (!IS_WEB) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Requests permission and registers action categories/Android channel. Call once at app startup. */
export async function initNotifications(): Promise<boolean> {
  if (IS_WEB) return false;

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'H2OMed reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY.water, [
    { identifier: ACTION.drankIt, buttonTitle: 'Drank it 💧' },
    { identifier: ACTION.snooze, buttonTitle: `Snooze ${SNOOZE_MINUTES}m` },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY.med, [
    { identifier: ACTION.taken, buttonTitle: 'Taken ✅' },
    { identifier: ACTION.snooze, buttonTitle: `Snooze ${SNOOZE_MINUTES}m` },
    { identifier: ACTION.missed, buttonTitle: 'Missed', options: { isDestructive: true } },
  ]);

  return granted;
}

async function cancelByPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => n.identifier.startsWith(prefix)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** (Re)schedules one repeating notification per hour inside the water window. Cancels any previous water schedule first. */
export async function scheduleWaterReminders(settings: WaterSettings): Promise<void> {
  if (IS_WEB) return;
  await cancelByPrefix('water-');

  const start = parseHHMM(settings.windowStart).hour;
  const end = parseHHMM(settings.windowEnd).hour;
  if (end < start) return; // invalid window, nothing to schedule

  for (let hour = start; hour <= end; hour++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `water-${String(hour).padStart(2, '0')}`,
      content: {
        title: 'Time to hydrate 💧',
        body: `Have a glass of water (${settings.glassMl} mL).`,
        categoryIdentifier: CATEGORY.water,
        data: { type: 'water' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

/** (Re)schedules one repeating daily notification per enabled medication reminder. Cancels any previous med schedule first. */
export async function scheduleMedReminders(reminders: MedReminder[]): Promise<void> {
  if (IS_WEB) return;
  await cancelByPrefix('med-');

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    const { hour, minute } = parseHHMM(reminder.time);
    const foodNote =
      reminder.foodTiming === 'before' ? ' (before food)' : reminder.foodTiming === 'after' ? ' (after food)' : '';

    await Notifications.scheduleNotificationAsync({
      identifier: `med-${reminder.id}`,
      content: {
        title: 'Medication reminder 💊',
        body: `${reminder.label}${foodNote}`,
        categoryIdentifier: CATEGORY.med,
        data: { type: 'med', reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

async function snoozeOneOff(
  content: { title: string | null; body: string | null; categoryIdentifier: string | null; data?: Record<string, unknown> },
  identifier: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: content.title,
      body: content.body,
      categoryIdentifier: content.categoryIdentifier ?? undefined,
      data: content.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_MINUTES * 60,
      repeats: false,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

export type NotificationRefreshCallback = () => void;

/**
 * Wires notification action buttons to app state:
 *  - water: "Drank it" logs +1 glass, "Snooze" re-fires in 10 min
 *  - med: "Taken"/"Missed" set today's status for that reminder, "Snooze" marks it
 *    snoozed and re-fires in 10 min
 * Call `onChange` after handling so screens can refresh from storage.
 */
export function registerNotificationResponseHandler(onChange: NotificationRefreshCallback) {
  if (IS_WEB) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as { type?: string; reminderId?: string };

    if (data?.type === 'water') {
      if (actionIdentifier === ACTION.drankIt) {
        await WaterStore.increment();
      } else if (actionIdentifier === ACTION.snooze) {
        await snoozeOneOff(notification.request.content, `water-snooze-${Date.now()}`);
      }
      onChange();
      return;
    }

    if (data?.type === 'med' && data.reminderId) {
      const reminderId = data.reminderId;
      if (actionIdentifier === ACTION.taken) {
        await MedStore.setStatus(reminderId, 'taken');
      } else if (actionIdentifier === ACTION.missed) {
        await MedStore.setStatus(reminderId, 'missed');
      } else if (actionIdentifier === ACTION.snooze) {
        await MedStore.setStatus(reminderId, 'snoozed');
        await snoozeOneOff(notification.request.content, `med-snooze-${reminderId}-${Date.now()}`);
      }
      onChange();
    }
  });
}
