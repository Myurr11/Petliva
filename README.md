# Bowlkeeper — pet food tracker (Expo)

Expo Router app matching the onboarding + feeding-log flow we prototyped, now
wired to a real Supabase backend.

## Requirements
- **Node.js ≥ 20.19.4** (Expo SDK 54's minimum — check with `node -v`; use `nvm use 20.19.4` if needed)
- Expo SDK 54, pinned to the exact versions its own compatibility check reports as expected: `react@19.1.0`, `react-dom@19.1.0`, `react-native@0.81.5`, `babel-preset-expo@~54.0.10`. If you ever see Metro print a "should be updated for best compatibility" list on startup, **trust that list over any version number in this README** — it's read directly from your installed `expo` package, which is the actual source of truth and updates more often than this file can.

> Icons are `@expo/vector-icons` (`MaterialCommunityIcons` + `Feather`, wrapped
> in `src/components/icons.tsx` under the same names used throughout the app —
> `PawPrint`, `Cat`, `Dog`, etc.), not `lucide-react-native`. Lucide's React
> Native package still pins a `react@^18` peer dependency, which breaks `npm i`
> on React 19 projects. `@expo/vector-icons` ships inside `expo` itself, so it's
> always version-matched to your SDK with no separate install step.

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
It creates `pets`, `feeding_plans` (now with Open Pet Food Facts columns —
brand, image, ingredients, macros), `feeding_logs`, `food_stock`, and RLS
policies scoped to `auth.uid()`. If you already ran an earlier version of this
schema against your project, the file has commented-out `alter table ... add
column if not exists ...` lines near the `feeding_plans` definition — uncomment
and run just those to pick up the new nutrition columns without touching your
existing data.

For **Google sign-in** to work you also need, in the Supabase Dashboard:
1. Authentication → Providers → enable Google, with your OAuth client ID/secret
2. Authentication → URL Configuration → add `bowlkeeper://auth-callback` as a redirect URL

Email/password sign-up works out of the box with no extra config.

## What's wired up
- Full onboarding: auth → profile → pet type → breed → weight → vaccinations → medical history (optional) → feeding plan
- **Real Supabase auth**: email/password sign-up & login, Google OAuth via `expo-web-browser` + PKCE exchange, session restored automatically on relaunch (and cleared automatically if the local "authed" flag ever drifts from the real session)
- Finishing onboarding writes the pet + feeding plan to Supabase (`createPetAndPlan`)
- Each feeding log is written to `feeding_logs` in Supabase *and* kept locally — if the network call fails, the local entry still counts toward today's ring so a bad connection never blocks logging
- **Home** (bottom tab): pet switcher (appears once you have 2+ pets), bowl-fill ring, today's feeding log
- **Insights** (bottom tab): 7-day streak counter, % of days all planned meals were logged, average grams/day, estimated protein fed today (when the food has macro data), and a custom SVG bar chart
- **Food** (bottom tab): current stock remaining, estimated days left at the plan's daily rate, restock history, "Log a restock" modal with quick-select pack sizes (1/2/3/4/10/15kg)
- **Profile** (bottom tab): your name/email, a list of every pet with tap-to-switch active pet, the active pet's vaccination checklist and medical history (captured at onboarding but not shown anywhere until now), "Add another pet," and sign out
- **Multi-pet**: "Add pet" from the Home tab re-enters the onboarding wizard (skipping the profile step) to add a second pet; a horizontal pet switcher appears on Home once you have more than one. Each pet has its own plan, logs, and stock — all scoped by `pet_id` in Supabase, which the schema already supported from the start
- **Food search (Open Pet Food Facts)**: the "Food name" field in onboarding now searches `world.openpetfoodfacts.org`'s free, open pet food database as you type (`src/lib/petFoodApi.ts`, `src/components/ui/FoodSearchField.tsx`). Picking a result pulls in the brand, product photo, ingredients list, and macro breakdown (protein/fat/fiber/ash %, kcal/100g) — all stored on the feeding plan and synced to Supabase. Typing something that doesn't match anything still works fine as free text; the search is additive, never required. That data then surfaces elsewhere instead of sitting unused:
  - **Home**: food card shows the product photo, brand, and macro badges; tapping it expands the full ingredients list
  - **Insights**: an "estimated protein fed today" card computed from grams logged × the food's protein %
  - Coverage is crowd-sourced and uneven — well-represented global brands (Whiskas, Royal Canin's more common lines) show up reliably, but don't expect every SKU (e.g. we couldn't confirm Royal Canin Fit 32 specifically) to be there
- All state persists locally via Zustand + AsyncStorage as an offline cache, keyed by pet

## What's still stubbed / next steps
- **Store migration note**: if you're updating from a version of this app before multi-pet support, `useAppStore.ts` now includes a `migrate()` function that runs automatically on first launch — it recovers your already-onboarded pet's data into the new `pets{}` map rather than losing it. This is a one-time, automatic fix; you shouldn't need to redo onboarding.
- **Reading logs back from Supabase**: the app reads from the local Zustand cache only — it writes to Supabase but never reads history back. Fine on one device; if you want multi-device sync, add a `fetchPetsAndLogs()` call on app start that hydrates the store from Supabase instead of (or alongside) AsyncStorage.
- **Notifications**: no reminder for missed meals yet — a good next feature, likely via `expo-notifications` scheduled off `plan.mealsPerDay`.
- **Retry queue** for feeding logs / restocks that fail to sync while offline.
- **Insights** currently only looks at the last 7 days and computes averages from local data; extending the chart's date range would need to pull more history from Supabase per the point above.

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
