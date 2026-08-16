// Appointment time is captured as free text (e.g. "10:30 AM", "14:00") via
// presets or custom entry — see add-appointment.tsx's TIME_PRESETS. This
// best-effort-parses that string so "upcoming" can account for the clock,
// not just the calendar day: an appointment scheduled for earlier today
// should drop out of the upcoming list once its time has passed, not sit
// there until midnight.

function parseTimeToParts(time: string): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

/** Combines an appointment's date + optional time into a single Date. If the
 *  time can't be parsed (or isn't set), returns midnight on that date. */
export function appointmentDateTime(date: string, time?: string): Date {
  const base = new Date(`${date}T00:00:00`);
  const parts = time ? parseTimeToParts(time) : null;
  if (parts) base.setHours(parts.hours, parts.minutes, 0, 0);
  return base;
}

/** True once the appointment's date+time is in the past. When no time is
 *  set, falls back to whole-day granularity (still "upcoming" until the
 *  day itself has passed), since we can't know what time within the day
 *  it was meant for. */
export function isAppointmentPast(date: string, time?: string, now: Date = new Date()): boolean {
  if (time) return appointmentDateTime(date, time).getTime() < now.getTime();
  const dayStart = new Date(`${date}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return dayStart.getTime() < today.getTime();
}
