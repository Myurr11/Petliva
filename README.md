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

## Navigation
- **Home / Insights / Vet / Food** — bottom tabs. Each one starts with a shared `PetSwitcherHeader` (pet chips + profile icon), so every tab is always scoped to whichever pet is selected and account access is never more than one tap away.
- **Profile** — moved out of the tab bar to a top-right header icon (tap it from any tab). Pushed as a regular screen with a back button, not a tab, since it's account-level rather than per-pet.

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
