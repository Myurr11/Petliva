# Bowlkeeper — pet food tracker (Expo)

Expo Router app matching the onboarding + feeding-log flow we prototyped, now
wired to a real Supabase backend.

## Requirements
- **Node.js ≥ 20.19.4** (Expo SDK 54's minimum — check with `node -v`; use `nvm use 20.19.4` if needed)
- Expo SDK 54, pinned to the exact versions its own compatibility check reports as expected: `react@19.1.0`, `react-dom@19.1.0`, `react-native@0.81.5`, `babel-preset-expo@~54.0.10`. If you ever see Metro print a "should be updated for best compatibility" list on startup, **trust that list over any version number in this README** — it's read directly from your installed `expo` package, which is the actual source of truth and updates more often than this file can.

> Icons are `@expo/vector-icons` (`MaterialCommunityIcons` + `Feather`, wrapped
> in `src/components/icons.tsx` under consistent names — `PawPrint`, `Cat`,
> `Dog`, `Stethoscope`, etc.), not `lucide-react-native`. Lucide's React
> Native package still pins a `react@^18` peer dependency, which breaks `npm i`
> on React 19 projects. `@expo/vector-icons` ships inside `expo` itself, so it's
> always version-matched to your SDK with no separate install step.
>
> Fonts are Plus Jakarta Sans (headlines) + Be Vietnam Pro (body/labels) +
> IBM Plex Mono (gram/data readouts), loaded via `@expo-google-fonts/*` in
> `app/_layout.tsx`.

## Setup

```bash
npm install
npx expo install --fix   # aligns every expo-* package to exact SDK 54 versions
npx expo start
```
Note the `npx` — `expo` is not a global command here, so `npm expo start` or bare
`expo start` won't work; use `npx expo start` or `npm start` (same thing, defined
in package.json's `scripts`).

Scan the QR code with Expo Go, or press `i` / `a` for a simulator.

### If npm install ever fails with an ERESOLVE peer conflict again
This happens because Expo's own sub-dependencies (like `expo-router`, `expo`
itself) get patch updates constantly, and a hand-pinned `react`/`react-native`
version in package.json can fall out of sync with what the *latest* patch of
`expo` expects. The fix is always the same, and doesn't require re-guessing
version numbers:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo install --fix
```
`expo install --fix` reads your installed `expo` version and rewrites every
`expo-*`/`react-native-*` package (and React itself) to the exact versions that
version of Expo expects — it's the source of truth, not the numbers in this
README.

### App icons
`assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`, and `favicon.png`
are placeholder art (an amber paw mark on the app's ink background) so the
project runs without Metro's "unable to resolve asset" error. Swap them for
real artwork whenever you're ready — same filenames, same folder.

`.env` is already filled in with your Supabase project:
```
EXPO_PUBLIC_SUPABASE_URL=https://cdybgeqvnaxcgwzmjoai.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
This is the publishable/anon key, so it's meant to be shipped in the client —
just don't commit your **service role** key anywhere in this app.

### One-time Supabase setup
Run `supabase/schema.sql` in your project's SQL editor (Dashboard → SQL Editor).
It creates `pets` (now with `vet_visit_frequency`), `feeding_plans` (with Open
Pet Food Facts columns), `feeding_logs`, `food_stock`, `vet_appointments`,
`medications`, and RLS policies scoped to `auth.uid()`. The whole file is
idempotent — safe to re-run any time, including after a partial run that hit
an error, without touching existing data.

For **Google sign-in** to work you also need, in the Supabase Dashboard:
1. Authentication → Providers → enable Google, with your OAuth client ID/secret
2. Authentication → URL Configuration → add `bowlkeeper://auth-callback` as a redirect URL

Email/password sign-up works out of the box with no extra config.

## Design system
Full app reskin, neo-brutalist: warm cream background (`#FCF9F8`), thick 2px black borders on every card/button/input, hard offset shadows with no blur (built via `NeoBox` — real RN shadow props render as a soft Android `elevation` blur, not the crisp offset rectangle this style needs, so it's faked correctly with stacked Views instead), solid mustard (`#FFC107`) for selected/primary states, Plus Jakarta Sans headlines + Be Vietnam Pro body text. Every screen — onboarding, auth, all four tabs, all four modals — uses the same system. All tokens live in `src/theme/tokens.ts`; the shared components (`Chip`, `PrimaryButton`, `TextField`, `ScreenTitle`, `ProgressDots`, `Ring`, `NeoBox`, `NeoOnboardHeader`, `PetSwitcherHeader`) are what make the look cascade everywhere without per-screen one-offs.

## Calendar / date selection
- **Date fields everywhere** (onboarding vet-care, add-appointment) now open a real calendar picker (`DateField` → `CalendarGrid`, month-grid navigation, no external date-picker dependency) instead of a free-text "YYYY-MM-DD" input.
- **Insights**: redesigned around a calendar. A horizontal `WeekStrip` (like most calendar/fitness apps) lets you browse any day — days with a vet appointment get a small dot marker. Below it, a detail panel for whichever day is selected: that day's vet appointment (if any, with a quick "add one" prompt if not), every feeding logged that day (food category, time, grams), and the day's total. The old flat "day by day" list is gone, superseded by this.
- **Home**: a new reminders card between the log button and food cards shows the next 1–2 upcoming vet appointments and the active pet's medication list (name + schedule) as a daily reminder, tapping through to the Vet tab for details.

## Navigation
- **Home / Insights / Vet / Food** — bottom tabs, now a **floating pill-shaped bar** (rounded, inset from the screen edges, soft lifted shadow) rather than a full-width rectangle. Each tab starts with the shared `PetSwitcherHeader` (pet chips + profile icon).
- **Profile** — a top-right header icon on every tab, not in the tab bar at all (pushed as a regular screen with a back button).

## Calendar & date selection
- **`DateField`** (`src/components/ui/DateField.tsx`) — the one reusable date-selection UI for the whole app. A tappable field that opens a modal month-grid calendar (`CalendarGrid.tsx`, built from plain Views/Pressables, no native date-picker dependency). Replaces the old free-text "YYYY-MM-DD" inputs in the vet-care onboarding step and the add-appointment modal.
- **`WeekStrip`** (`src/components/ui/WeekStrip.tsx`) — a horizontal 7-day week selector with prev/next navigation and dots marking days with a vet appointment, used at the top of the Insights tab.
- **Insights tab redesign**: below the existing streak/consistency/chart stats, a week-strip calendar lets you browse any day. Selecting a day shows that day's feeding log (all foods, with times and grams) and, if there was one, a highlighted vet-appointment card for that date — or a quick "Add a vet appointment for this day" prompt if there wasn't one, pre-filled with the date you tapped.
- **Home tab**: a reminder card surfaces the next couple of upcoming vet appointments and any active medications, tappable through to the Vet tab for full detail.

## Deleting appointments & medications
- **Vet tab**: every appointment and medication now has a trash icon. Tapping it confirms, then removes it from the device immediately and best-effort deletes it from Supabase too.
- **The ID-sync fix this needed**: appointments and medications were being created with a local, client-generated id (`Date.now()`-based) that was never reconciled with the real id Supabase assigns on insert — so a delete-by-id call would silently target nothing. `insertAppointment`/`insertMedication` now return the real Supabase id, and `add-appointment.tsx`/`add-medication.tsx` swap the local id for it right after a successful write (`syncAppointmentId`/`syncMedicationId` in the store). Entries added before this fix won't have a matching remote row under their local id — deleting them locally still works fine, the Supabase-side delete for those specific old entries is just a no-op.
- **Why deleted Supabase rows didn't disappear from the app before this**: the app only ever reads appointments/medications from local on-device storage, never re-fetches from Supabase — so removing rows directly in the Supabase dashboard has no effect on what's already cached on a phone. This is still true for every other entity too (see "Reading logs back from Supabase" below) — deleting from the app itself (now possible) is the reliable way to remove something, not editing the database directly.

## Medication courses (start date + duration)
Medications now have a real prescribed date range instead of showing forever:
- **`add-medication.tsx`**: after dosage/schedule presets, pick a start date (via `DateField`) and a duration in days (3/5/7/10/14 preset chips, or Custom). Shows a "Runs Aug 10 through Aug 13" confirmation as you fill it in.
- **`src/lib/medicationStatus.ts`**: the one shared helper (`getMedicationStatus`) every screen uses to compute a medication's `upcoming` / `active` / `completed` state and "day X of Y" for any given date — so the logic for "is this course covering today?" lives in exactly one place.
- **Home**: only shows medications actually active *today*, with a "Day X" badge. If a course hasn't started yet or has finished, it no longer clutters the reminder card.
- **Vet tab**: lists every medication ever added, sorted active → upcoming → completed, each with its date range and status badge; completed courses are dimmed rather than hidden, so history isn't lost.
- **Insights**: the day-detail medication section is now scoped to whichever day you're browsing — a course only shows up on days it actually covers, with the same "Day X" badge.
- **Data model**: `Medication` gained `startDate` (ISO date) and `durationDays`. Supabase's `medications` table gained matching `start_date`/`duration_days` columns.
- **Migration**: store is now on persisted-state version 5. Existing medications (added before this change, with no date range) are backfilled as starting today with a 30-day duration — so they keep showing as active rather than silently vanishing; correct the real dates from the Vet tab if needed.

## Separate dry/wet rings + exact-gram logging
Two real bugs from actual use, both fixed:
- **Rings were combining dry + wet into one target.** Feeding 63g dry + 80g wet no longer sums to a meaningless 143g goal. Home now shows two separate swipeable ring pages — dry first, swipe to wet, tap either page-dot to jump directly. Each page's ring, remaining-grams, and meals-logged are scoped to only that category's foods. A category with no foods set up shows a plain "not set up yet" message instead of a misleading empty ring at 0%.
- **Logging was stuck to multiples of 5.** The +/-5 stepper buttons are still there for quick nudges, but the number itself is now a directly-editable text field — tap it and type the exact amount (e.g. 26g out of a 35g meal), rather than only landing on values the stepper happened to produce.

## Multi-food (dry + wet)
A pet can now have several foods instead of exactly one — typically one dry + one wet, optionally more:
- **Onboarding** (`food-plan.tsx`, step 8): shows a dry-food card and a wet-food card by default, each with its own Open Pet Food Facts search, daily grams, and meals/day. Leave either blank if it doesn't apply. "Add dry food" / "Add wet food" buttons below append more cards for pets fed 3+ foods.
- **Home**: the ring shows *combined* progress (today's total across all foods vs. the summed daily target); a per-food breakdown list appears under the ring once a pet has more than one food. Each food gets its own card lower down (image, brand, macros, expandable ingredients).
- **Log a feeding**: if a pet has more than one food, a food picker (chips, e.g. "Dry · Royal Canin Fit 32") appears first; grams/suggestion adjust to whichever food is selected.
- **Food tab (Inventory)**: one stock card *per food* — each with its own remaining grams, days-left estimate, and restock history. "Log a restock" is scoped to that specific food.
- **Insights**: daily target and meals-per-day are summed across all foods; "estimated protein fed today" is now a weighted sum (each food's grams-fed-today × its own protein %).
- **Data model**: `PetRecord.foods: FoodItem[]` replaced the old singular `plan: FeedingPlan`. `FeedingLog` and `StockEntry` both gained a `foodId` so every log/restock is scoped to a specific food. Supabase gained a `foods` table (superseding `feeding_plans`, which is left in place unused rather than dropped, so no historical data is lost) plus `food_id` columns on `feeding_logs` and `food_stock`.
- **Migration**: `useAppStore.ts` is now on persisted-state version 4. The v3→v4 step automatically wraps any existing single-food pet's plan into one `FoodItem` (tagged "dry") and backfills `foodId` onto all of that pet's existing logs/restocks — no data loss, no re-onboarding needed, runs once on first launch after updating.

## What's wired up
- Full onboarding, now 8 steps: auth → profile → pet type → breed → weight → vaccinations → medical history → **vet care** (new) → feeding plan
- **Real Supabase auth**: email/password sign-up & login, Google OAuth via `expo-web-browser` + PKCE exchange, session restored automatically on relaunch (and cleared automatically if the local "authed" flag ever drifts from the real session)
- Finishing onboarding writes the pet, feeding plan, and any vet care captured to Supabase
- Each feeding log is written to `feeding_logs` in Supabase *and* kept locally — if the network call fails, the local entry still counts toward today's ring so a bad connection never blocks logging
- **Home**: bowl-fill ring, today's feeding log, food card with image/brand/macros from Open Pet Food Facts
- **Insights**: 7-day streak counter, % of days all planned meals were logged, average grams/day, estimated protein fed today, and a custom SVG bar chart
- **Vet** (new): visit frequency (editable chips), upcoming/past appointments with an "Add appointment" modal, medications list with an "Add medication" modal, and the vaccination checklist captured at onboarding
- **Food**: current stock remaining, estimated days left, restock history, "Log a restock" modal
- **Profile**: your name/email, every pet with tap-to-switch, the active pet's vaccination/medical summary with a link to the full Vet tab, "Add another pet," and sign out
- **Food search (Open Pet Food Facts)**: search-as-you-type in the feeding-plan step, pulling in brand/photo/ingredients/macros; surfaced on Home (food card) and Insights (protein-today card)
- **Multi-pet**: each pet has its own plan, logs, stock, and vet info — all scoped by `pet_id` in Supabase
- All state persists locally via Zustand + AsyncStorage as an offline cache, keyed by pet

## What's still stubbed / next steps
- **Store migration note**: `useAppStore.ts` is now on persisted-state version 3. Two migrations run automatically and in order on first launch after updating — v1→v2 recovers pre-multi-pet data into the `pets{}` map, and v2→v3 backfills an empty `vet{}` object onto any pet record that predates the Vet feature. Both are one-time and automatic; you shouldn't need to redo onboarding.
- **Reading logs/appointments/medications back from Supabase**: the app reads from the local Zustand cache only — it writes to Supabase but never reads history back. Fine on one device; multi-device sync would need a `fetchPetsAndLogs()` call on app start.
- **Notifications**: no reminder for missed meals, upcoming vet appointments, or medication schedules yet — a natural next feature via `expo-notifications`, now that the underlying data (appointments, medication schedules) exists to schedule off of.
- **Editing/deleting** appointments and medications isn't built yet — you can add, but not yet edit or remove, an entry.
- **Retry queue** for anything that fails to sync while offline.

## Folder structure
```
app/
  _layout.tsx            root stack, font loading, Supabase session restore
  index.tsx               redirects based on auth/onboarding state
  (auth)/sign-in.tsx      email/password + Google OAuth
  (onboarding)/            7-step onboarding stack (also re-entered at pet-type to add another pet)
  (app)/_layout.tsx        stack wrapping the tab group + modals
  (app)/(tabs)/home.tsx    bowl-fill ring, today's log, pet switcher
  (app)/(tabs)/insights.tsx  streak, consistency %, SVG bar chart
  (app)/(tabs)/inventory.tsx  stock remaining, days-left estimate, restock history
  (app)/(tabs)/profile.tsx  user info, pet switcher, health details, sign out
  (app)/log-meal.tsx       modal: log a feeding
  (app)/add-restock.tsx    modal: log a food restock
src/
  theme/tokens.ts          colors, fonts, radii
  store/useAppStore.ts      zustand store — pets keyed by id, activePetId, onboarding draft
  lib/supabase.ts          supabase client + createPetAndPlan / insertFeedingLog / insertRestock
  lib/petFoodApi.ts        Open Pet Food Facts search client
  components/icons.tsx     @expo/vector-icons wrapped under lucide-style names
  components/ui/           shared Button, Chip, TextField, Ring, FoodSearchField, etc.
  constants/data.ts        breed lists, vaccines, medical tags
  types/index.ts
supabase/
  schema.sql               run once in the Supabase SQL editor (pets, feeding_plans, feeding_logs, food_stock)
assets/
  icon.png, adaptive-icon.png, splash-icon.png, favicon.png  (placeholder art)
```
