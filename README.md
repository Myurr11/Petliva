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
It creates `pets`, `feeding_plans`, `feeding_logs`, and RLS policies scoped to
`auth.uid()`.

For **Google sign-in** to work you also need, in the Supabase Dashboard:
1. Authentication → Providers → enable Google, with your OAuth client ID/secret
2. Authentication → URL Configuration → add `bowlkeeper://auth-callback` as a redirect URL

Email/password sign-up works out of the box with no extra config.

## What's wired up
- Full onboarding: auth → profile → pet type → breed → weight → vaccinations → medical history (optional) → feeding plan
- **Real Supabase auth**: email/password sign-up & login, Google OAuth via `expo-web-browser` + PKCE exchange, session restored automatically on relaunch
- Finishing onboarding writes the pet + feeding plan to Supabase (`createPetAndPlan`); the returned `pet.id` is stored for logging
- Each feeding log is written to `feeding_logs` in Supabase *and* kept locally — if the network call fails, the local entry still counts toward today's ring so a bad connection never blocks logging
- Home screen: bowl-fill ring showing grams eaten vs. daily target, remaining grams, meals-logged count
- All state also persists locally via Zustand + AsyncStorage as an offline cache

## What's still stubbed / next steps
- **Multi-pet support**: the store assumes a single pet. If you want more than one,
  `pet`/`plan`/`logs` need to become keyed by `petId`, and `createPetAndPlan`
  called again per pet.
- **Reading logs back from Supabase**: right now the home screen reads from the
  local Zustand cache only. If you want history to sync across devices, add a
  `fetchTodayLogs(petId)` call on mount.
- **Notifications**: no reminder for missed meals yet — a good next feature once
  logging feels solid, likely via `expo-notifications` scheduled off `plan.mealsPerDay`.
- **Retry queue** for feeding logs that fail to sync while offline.

## Folder structure
```
app/
  _layout.tsx            root stack, font loading, Supabase session restore
  index.tsx               redirects based on auth/onboarding state
  (auth)/sign-in.tsx      email/password + Google OAuth
  (onboarding)/            7-step onboarding stack
  (app)/home.tsx           main tracking screen
  (app)/log-meal.tsx       modal for logging a feeding
src/
  theme/tokens.ts          colors, fonts, radii
  store/useAppStore.ts      zustand store (user, pet, plan, logs, petId)
  lib/supabase.ts          supabase client + createPetAndPlan / insertFeedingLog
  components/icons.tsx     @expo/vector-icons wrapped under lucide-style names
  components/ui/           shared Button, Chip, TextField, Ring, etc.
  constants/data.ts        breed lists, vaccines, medical tags
  types/index.ts
supabase/
  schema.sql               run once in the Supabase SQL editor
assets/
  icon.png, adaptive-icon.png, splash-icon.png, favicon.png  (placeholder art)
```
