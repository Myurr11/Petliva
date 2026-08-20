/** Age is captured as separate whole-years + 0-11-months fields in the UI
 *  (see AgeField), but stored server-side as a single decimal `age_years`
 *  column. These helpers are the one place that conversion happens, so the
 *  split never drifts between onboarding, the Vet tab, and Supabase. */

export function formatAge(years: string | number, months: string | number): string {
  const y = Number(years) || 0;
  const m = Number(months) || 0;
  if (!y && !m) return "—";
  const parts: string[] = [];
  if (y) parts.push(`${y} yr`);
  if (m) parts.push(`${m} mo`);
  return parts.join(" ");
}

/** Whole-years + months -> decimal years, for the `age_years` DB column. */
export function ageToDecimalYears(years: string | number, months: string | number): number {
  const y = Number(years) || 0;
  const m = Number(months) || 0;
  return Math.round((y + m / 12) * 100) / 100;
}

/** Decimal years (from `age_years`) -> whole-years + months, for display /
 *  editing in the UI. */
export function splitDecimalYears(decimal: number): { years: number; months: number } {
  const y = Math.floor(decimal);
  let m = Math.round((decimal - y) * 12);
  if (m === 12) return { years: y + 1, months: 0 };
  return { years: y, months: m };
}
