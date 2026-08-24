import type * as NotificationsType from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PetRecord, VetAppointment, Medication, FoodItem } from "@/types";
import { appointmentDateTime, parseTime, formatHourMinute } from "./appointmentTime";
import { toISODate } from "@/components/ui/CalendarGrid";

// Local (on-device) scheduled notifications — no server/push token needed.
// Three things get scheduled here, all with sensible defaults that "just
// work" out of the box, and all overridable per-item if the user sets a
// custom reminder:
//  1. Feeding reminders, derived from each food's mealsPerDay + daysOfWeek.
//  2. Vet appointment reminders, fired 2 hours and 30 minutes before by
//     default (or custom offsets set on the appointment).
//  3. Medication reminders, derived from the medication's schedule preset
//     (once/twice daily, every 8 hours, with food), only while the course
//     is currently active.
//
// expo-notifications' native push-token module throws on import inside
// Expo Go (Android push support was removed from Expo Go in SDK 53), so
// the module is `require`d lazily and only outside Expo Go — a plain
// top-level `import` would crash the app the moment this file loads, even
// if nothing in it ever gets called. Everything in this file silently
// no-ops in Expo Go; reminders only work in a development or production
// build. See https://docs.expo.dev/develop/development-builds/introduction/.
const isExpoGo =
  Constants.appOwnership === "expo" || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedModule: typeof NotificationsType | null = null;
let handlerInitialized = false;
let loggedExpoGoNotice = false;

function getNotifications(): typeof NotificationsType | null {
  if (isExpoGo) {
    if (!loggedExpoGoNotice) {
      loggedExpoGoNotice = true;
      console.log("Petliva: reminders need a development build — they're skipped while running in Expo Go.");
    }
    return null;
  }
  if (!cachedModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require("expo-notifications") as typeof NotificationsType;
    if (!handlerInitialized) {
      handlerInitialized = true;
      cachedModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  }
  return cachedModule;
}

// Meals/doses are spread evenly across this "waking window" rather than the
// full 24h day, so nothing fires at 2am and the last one isn't pinned to
// midnight where it's easy to sleep through.
const DAY_START_HOUR = 7; // 7:00 AM
const DAY_END_HOUR = 21; // 9:00 PM

const FEEDING_IDS_KEY = "petliva-notif-feeding-ids"; // { [petId]: string[] }
const APPT_IDS_KEY = "petliva-notif-appt-ids"; // { [`${petId}:${apptId}`]: string[] }
const MED_IDS_KEY = "petliva-notif-med-ids"; // { [`${petId}:${medId}`]: string[] }

const DEFAULT_APPT_OFFSETS_MIN = [120, 30]; // 2 hours, 30 minutes before

let permissionChecked = false;

/** Requests notification permission once per app session (repeat calls are
 *  cheap no-ops once granted/denied — the OS only prompts on first ask).
 *  Returns null in Expo Go, where the native module isn't available. */
async function ensureNotifications(): Promise<typeof NotificationsType | null> {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Petliva reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted" && !permissionChecked) {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  permissionChecked = true;
  return status === "granted" ? Notifications : null;
}

/** Public boolean form, kept for convenience — true only outside Expo Go
 *  with permission actually granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  return (await ensureNotifications()) !== null;
}

async function loadIds(key: string): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveIds(key: string, map: Record<string, string[]>) {
  await AsyncStorage.setItem(key, JSON.stringify(map));
}

async function cancelAll(ids: string[]) {
  const Notifications = getNotifications();
  if (!Notifications || ids.length === 0) return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/** Evenly spaces `count` times across the waking window. E.g. 3 lands at
 *  7:00, 14:00, 21:00; 4 at 7:00, 11:40, 16:20, 21:00. The first always
 *  sits at the window start and the last at the window end, with the rest
 *  spread between — so more slots just fill in the gaps. Used as the
 *  default for both feeding and medication reminders. */
function timesForCount(count: number): { hour: number; minute: number }[] {
  if (count <= 1) return [{ hour: DAY_START_HOUR, minute: 0 }];
  const windowMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const step = windowMinutes / (count - 1);
  const times: { hour: number; minute: number }[] = [];
  for (let i = 0; i < count; i++) {
    const totalMinutes = DAY_START_HOUR * 60 + Math.round(step * i);
    times.push({ hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 });
  }
  return times;
}

/** Human-preview of the default times for N daily slots — used to prefill
 *  "custom reminder" inputs so editing starts from the auto value instead
 *  of a blank field. */
export function defaultTimesPreview(count: number): string[] {
  return timesForCount(count).map((t) => formatHourMinute(t.hour, t.minute));
}

/** Parses a list of free-text time strings ("7:00 AM"), dropping anything
 *  that doesn't parse. Returns null (meaning "no valid overrides") if the
 *  result is empty, so callers can cleanly fall back to the auto times. */
function parseCustomTimes(times: string[] | undefined): { hour: number; minute: number }[] | null {
  if (!times || times.length === 0) return null;
  const parsed = times
    .map((t) => parseTime(t))
    .filter((p): p is { hours: number; minutes: number } => !!p)
    .map((p) => ({ hour: p.hours, minute: p.minutes }));
  return parsed.length > 0 ? parsed : null;
}

/** Cancels + reschedules every feeding reminder for one pet, derived from
 *  its current foods (or each food's custom reminderTimes, if set). Dry
 *  food (no daysOfWeek) gets a daily-repeating reminder per slot; wet food
 *  restricted to specific weekdays gets a weekly-repeating reminder per
 *  slot per scheduled day. Safe to call any time foods change — it always
 *  fully replaces the previous set. */
export async function rescheduleFeedingReminders(record: PetRecord): Promise<void> {
  const Notifications = await ensureNotifications();
  if (!Notifications) return;

  const idsMap = await loadIds(FEEDING_IDS_KEY);
  await cancelAll(idsMap[record.id] ?? []);

  const newIds: string[] = [];
  const petName = record.pet.name || "your pet";

  for (const food of record.foods) {
    if (!food.foodName.trim() || !food.mealsPerDay) continue;
    const times = parseCustomTimes(food.reminderTimes) ?? timesForCount(food.mealsPerDay);
    const everyDay = !food.daysOfWeek || food.daysOfWeek.length === 0 || food.daysOfWeek.length === 7;
    const body = `Time for ${food.foodName}.`;

    for (const t of times) {
      if (everyDay) {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: `Feed ${petName}`, body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
          },
        });
        newIds.push(id);
      } else {
        for (const weekday of food.daysOfWeek!) {
          // FoodItem.daysOfWeek is 0=Sun..6=Sat; expo's WEEKLY trigger is 1=Sun..7=Sat.
          const id = await Notifications.scheduleNotificationAsync({
            content: { title: `Feed ${petName}`, body },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekday + 1,
              hour: t.hour,
              minute: t.minute,
            },
          });
          newIds.push(id);
        }
      }
    }
  }

  idsMap[record.id] = newIds;
  await saveIds(FEEDING_IDS_KEY, idsMap);
}

export async function cancelFeedingReminders(petId: string): Promise<void> {
  const idsMap = await loadIds(FEEDING_IDS_KEY);
  await cancelAll(idsMap[petId] ?? []);
  delete idsMap[petId];
  await saveIds(FEEDING_IDS_KEY, idsMap);
}

function offsetLabel(minutes: number): string {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `in ${days} day${days > 1 ? "s" : ""}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `in ${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `in ${minutes} minutes`;
}

/** Schedules an appointment's reminders — 2 hours + 30 minutes before by
 *  default, or the appointment's custom `reminderOffsetsMinutes` if set
 *  (an explicit empty array means the user turned reminders off). Cancels
 *  any existing reminders for that appointment first, so it's safe to call
 *  again after an edit. Skips any reminder whose fire time has already
 *  passed. */
export async function scheduleAppointmentReminders(petId: string, appointment: VetAppointment, petName: string): Promise<void> {
  const Notifications = await ensureNotifications();
  if (!Notifications) return;

  const key = `${petId}:${appointment.id}`;
  const idsMap = await loadIds(APPT_IDS_KEY);
  await cancelAll(idsMap[key] ?? []);

  if (appointment.completed) {
    delete idsMap[key];
    await saveIds(APPT_IDS_KEY, idsMap);
    return;
  }

  const offsets = appointment.reminderOffsetsMinutes ?? DEFAULT_APPT_OFFSETS_MIN;
  const when = appointmentDateTime(appointment.date, appointment.time);
  const now = new Date();
  const newIds: string[] = [];

  for (const offsetMin of offsets) {
    const fireAt = new Date(when.getTime() - offsetMin * 60 * 1000);
    if (fireAt.getTime() <= now.getTime()) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Vet appointment ${offsetLabel(offsetMin)}`,
        body: `${petName}'s appointment${appointment.hospitalName ? ` at ${appointment.hospitalName}` : ""} is coming up.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
    newIds.push(id);
  }

  if (newIds.length > 0) idsMap[key] = newIds;
  else delete idsMap[key];
  await saveIds(APPT_IDS_KEY, idsMap);
}

export async function cancelAppointmentReminders(petId: string, appointmentId: string): Promise<void> {
  const key = `${petId}:${appointmentId}`;
  const idsMap = await loadIds(APPT_IDS_KEY);
  await cancelAll(idsMap[key] ?? []);
  delete idsMap[key];
  await saveIds(APPT_IDS_KEY, idsMap);
}

/** How many reminder slots/day a medication's schedule preset implies —
 *  exported so the "add medication" screen can show the right number of
 *  custom-time inputs and preview the defaults. "With food" aligns to the
 *  pet's primary food's meal count so dosing reminders land near
 *  mealtimes. Anything not recognized (a free-typed custom schedule) falls
 *  back to once a day. */
export function medicationSlotCount(schedule: string, primaryFood?: FoodItem): number {
  switch (schedule) {
    case "Once daily":
      return 1;
    case "Twice daily":
      return 2;
    case "Every 8 hours":
      return 3;
    case "With food":
      return primaryFood?.mealsPerDay || 2;
    default:
      return 1;
  }
}

function isMedicationActiveToday(medication: Medication): boolean {
  const today = toISODate(new Date());
  const start = medication.startDate;
  const end = new Date(`${medication.startDate}T00:00:00`);
  end.setDate(end.getDate() + medication.durationDays - 1);
  const endIso = toISODate(end);
  return today >= start && today <= endIso;
}

/** Cancels + reschedules one medication's dose reminders, derived from its
 *  schedule preset (or its custom reminderTimes, if set). Only schedules
 *  while the course is currently active — a course that hasn't started
 *  yet or has already ended gets no reminders right now. Because these use
 *  daily-repeating triggers rather than one-off-per-day (to stay well
 *  under the OS's pending-notification limits), a course that ends while
 *  the app isn't opened will keep reminding until the next time the app
 *  runs a sync — reopening the app promptly after a course ends clears it. */
export async function scheduleMedicationReminders(petId: string, medication: Medication, petName: string, primaryFood?: FoodItem): Promise<void> {
  const Notifications = await ensureNotifications();
  if (!Notifications) return;

  const key = `${petId}:${medication.id}`;
  const idsMap = await loadIds(MED_IDS_KEY);
  await cancelAll(idsMap[key] ?? []);

  if (!isMedicationActiveToday(medication)) {
    delete idsMap[key];
    await saveIds(MED_IDS_KEY, idsMap);
    return;
  }

  const slotCount = medicationSlotCount(medication.schedule, primaryFood);
  const times = parseCustomTimes(medication.reminderTimes) ?? timesForCount(slotCount);
  const body = `${medication.dosage ? `${medication.dosage} of ` : ""}${medication.name}`.trim();
  const newIds: string[] = [];

  for (const t of times) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: `Give ${petName}'s medicine`, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
    newIds.push(id);
  }

  idsMap[key] = newIds;
  await saveIds(MED_IDS_KEY, idsMap);
}

export async function cancelMedicationReminders(petId: string, medicationId: string): Promise<void> {
  const key = `${petId}:${medicationId}`;
  const idsMap = await loadIds(MED_IDS_KEY);
  await cancelAll(idsMap[key] ?? []);
  delete idsMap[key];
  await saveIds(MED_IDS_KEY, idsMap);
}

/** Full resync: call whenever the set of pets/foods/appointments/
 *  medications changes. Reschedules feeding and medication reminders for
 *  every pet, and reschedules or cleans up appointment/medication
 *  reminders so they match exactly what's currently saved (anything
 *  removed, completed, or out of its active date range gets its reminders
 *  cancelled). */
export async function syncAllNotifications(pets: Record<string, PetRecord>): Promise<void> {
  const Notifications = await ensureNotifications();
  if (!Notifications) return;

  const apptIdsMap = await loadIds(APPT_IDS_KEY);
  const medIdsMap = await loadIds(MED_IDS_KEY);
  const stillValidApptKeys = new Set<string>();
  const stillValidMedKeys = new Set<string>();

  for (const record of Object.values(pets)) {
    await rescheduleFeedingReminders(record);

    const petName = record.pet.name || "your pet";
    const primaryFood = record.foods[0];

    for (const appointment of record.vet.appointments) {
      stillValidApptKeys.add(`${record.id}:${appointment.id}`);
      await scheduleAppointmentReminders(record.id, appointment, petName);
    }

    for (const medication of record.vet.medications) {
      stillValidMedKeys.add(`${record.id}:${medication.id}`);
      await scheduleMedicationReminders(record.id, medication, petName, primaryFood);
    }
  }

  // Clean up reminders for appointments/medications no longer present in
  // any pet (deleted since the last sync).
  for (const key of Object.keys(apptIdsMap)) {
    if (!stillValidApptKeys.has(key)) await cancelAll(apptIdsMap[key] ?? []);
  }
  for (const key of Object.keys(medIdsMap)) {
    if (!stillValidMedKeys.has(key)) await cancelAll(medIdsMap[key] ?? []);
  }
}

/** Cancels every reminder Petliva has scheduled — feeding, appointment,
 *  and medication alike. Used on sign-out / reset so a fresh account
 *  doesn't inherit the previous account's reminders. */
export async function cancelAllNotifications(): Promise<void> {
  const Notifications = getNotifications();
  if (Notifications) await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([FEEDING_IDS_KEY, APPT_IDS_KEY, MED_IDS_KEY]);
}
