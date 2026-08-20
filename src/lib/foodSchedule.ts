import type { FoodItem } from "@/types";

/** Whether `food` is meant to be given on `date` — true when `daysOfWeek`
 *  is unset (every day) or includes that day's weekday. Used so a wet
 *  food that's only given a few days a week doesn't get counted toward
 *  "today's target" on its off days. */
export function isFoodScheduledOn(food: Pick<FoodItem, "daysOfWeek">, date: Date): boolean {
  if (!food.daysOfWeek || food.daysOfWeek.length === 0) return true;
  return food.daysOfWeek.includes(date.getDay());
}
