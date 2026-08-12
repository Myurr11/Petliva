import type { Medication } from "@/types";
import { toISODate } from "@/components/ui/CalendarGrid";

export interface MedicationStatus {
  /** ISO date the course started. */
  startDate: string;
  /** ISO date of the last day the course covers (inclusive). */
  endDate: string;
  /** "upcoming" | "active" | "completed" relative to today. */
  state: "upcoming" | "active" | "completed";
  /** Day N of durationDays, only meaningful while active. */
  dayOfCourse: number;
  daysRemaining: number;
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

export function getMedicationStatus(med: Medication, onDate: Date = new Date()): MedicationStatus {
  const start = med.startDate || toISODate(new Date());
  const duration = Math.max(1, med.durationDays || 1);
  const endDate = toISODate(addDays(start, duration - 1));
  const target = toISODate(onDate);

  let state: MedicationStatus["state"] = "active";
  if (target < start) state = "upcoming";
  else if (target > endDate) state = "completed";

  const startD = new Date(start + "T00:00:00");
  const targetD = new Date(target + "T00:00:00");
  const dayOfCourse = Math.round((targetD.getTime() - startD.getTime()) / 86400000) + 1;
  const endD = new Date(endDate + "T00:00:00");
  const daysRemaining = Math.max(0, Math.round((endD.getTime() - targetD.getTime()) / 86400000));

  return { startDate: start, endDate, state, dayOfCourse, daysRemaining };
}

/** Is this medication's course covering the given date (inclusive range)? */
export function isMedicationActiveOn(med: Medication, onDate: Date) {
  return getMedicationStatus(med, onDate).state === "active";
}
