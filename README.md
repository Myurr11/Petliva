# Petliva — pet food tracker (Expo)

*Better care. Happier pets.*

I kept losing track of whether I'd already fed the cat, how much food was left in the bag, and when the last vet visit was. So I built this — a small Expo app, backed by Supabase, that keeps all of that in one place and syncs across my phone and my partner's.

Not trying to be the next big pet app — just solving my own "did I already feed her?" problem properly.

## Screenshots

Captured on-device via Expo Go, in the order they appear in the actual flow: sign up → login → onboarding → home → food logging → insights → vet (+ vet-related screens) → food (+ food-related screens) → profile.

### Auth

<table><tr>
<td align="center"><img src="docs/screenshots/01-signup.jpg" width="200"/><br/>Sign up</td>
<td align="center"><img src="docs/screenshots/02-login.jpg" width="200"/><br/>Log in</td>
</tr></table>

### Onboarding (7 steps)

<table><tr>
<td align="center"><img src="docs/screenshots/03-onboarding-profile.jpg" width="180"/><br/>1. Name & type</td>
<td align="center"><img src="docs/screenshots/04-onboarding-breed.jpg" width="180"/><br/>2. Breed</td>
<td align="center"><img src="docs/screenshots/05-onboarding-age-1.jpg" width="180"/><br/>3. Age</td>
<td align="center"><img src="docs/screenshots/05-onboarding-age-2.jpg" width="180"/><br/>4. Age Selector</td>
<td align="center"><img src="docs/screenshots/06-onboarding-weight.jpg" width="180"/><br/>5. Weight</td>
</tr><tr>
<td align="center"><img src="docs/screenshots/07-onboarding-vaccinations.jpg" width="180"/><br/>6. Vaccinations</td>
<td align="center"><img src="docs/screenshots/08-onboarding-medical-history.jpg" width="180"/><br/>7. Medical history</td>
<td align="center"><img src="docs/screenshots/09-onboarding-vet-care.jpg" width="180"/><br/>8. Vet care</td>
<td align="center"><img src="docs/screenshots/10-onboarding-food-1.jpg" width="180"/><br/>9. Dry Food</td>
<td align="center"><img src="docs/screenshots/10-onboarding-food-2.jpg" width="180"/><br/>10. Wet Food</td>
</tr></table>

### Home

<table><tr>
<td align="center"><img src="docs/screenshots/11-home-dry-food.jpg" width="200"/><br/>Dry food ring + reminders</td>
<td align="center"><img src="docs/screenshots/12-home-wet-food-1.jpg" width="200"/><br/>Wet food ring (swipe page)</td>
<td align="center"><img src="docs/screenshots/12-home-wet-food-2.jpg" width="200"/><br/>Wet food Log Details</td>
</tr></table>

### Food logging

<table><tr>
<td align="center"><img src="docs/screenshots/13-log-a-feeding.jpg" width="200"/><br/>Log a feeding</td>
</tr></table>

### Insights

<table><tr>
<td align="center"><img src="docs/screenshots/14-insights-1.jpg" width="200"/><br/>Dru Food 7-day chart + calendar + daily progress</td>
<td align="center"><img src="docs/screenshots/15-insights-2.jpg" width="200"/><br/>Wet Food 7-day chart + calendar + daily progress</td>
<td align="center"><img src="docs/screenshots/16-insights-3.jpg" width="200"/><br/>Breakdown 7-day chart + calendar + daily progress</td>
</tr></table>

### Vet

<table><tr>
<td align="center"><img src="docs/screenshots/17-vet-tab.jpg" width="200"/><br/>Vet tab overview</td>
<td align="center"><img src="docs/screenshots/18-add-vet-appointment.jpg" width="200"/><br/>Add appointment</td>
<td align="center"><img src="docs/screenshots/19-add-medication.jpg" width="200"/><br/>Add medication</td>
<td align="center"><img src="docs/screenshots/20-vet-visit-detail.jpg" width="200"/><br/>Visit detail (diagnosis/notes)</td>
</tr></table>

### Food

<table><tr>
<td align="center"><img src="docs/screenshots/21-food-tab.jpg" width="200"/><br/>Inventory + stock</td>
<td align="center"><img src="docs/screenshots/22-log-a-restock.jpg" width="200"/><br/>Log a restock</td>
</tr></table>

### Profile

<table><tr>
<td align="center"><img src="docs/screenshots/23-profile.jpg" width="200"/><br/>Pets, health summary, sign out</td>
</tr></table>

## Features
 
**Auth**
- Email/password sign-up & login, plus "Continue with Google"
- Session persists across app restarts; signing in on a new device pulls your real data down from Supabase instead of starting you over
**Onboarding (7 steps)**
- Pet name, type (dog/cat), breed, age, weight
- Vaccination checklist and optional medical history/notes
- Optional first vet appointment + medication, so a new pet can be fully set up in one pass
- "Add another pet" re-runs the same flow for multi-pet households
**Home**
- A fill-up ring per food category (dry/wet tracked separately — no more meaningless combined totals), swipeable if a pet has both
- Quick "Log a feeding" — pick the food, the meal (breakfast/lunch/dinner/snack), and either use the suggested grams or type an exact number
- Upcoming vet appointments and active medications surfaced right on Home, so you don't have to go digging
**Insights**
- 7-day feeding chart per food type, with the daily target line
- Browse any day on a calendar and see exactly what was logged and when
**Vet**
- Appointments (with hospital, doctor, phone, notes) and a visit-detail screen for diagnosis/diagnostic notes after the fact
- Medications with dosage, schedule, and a real start-date + duration (so a 3-day course actually stops showing as "active" after 3 days)
- Vaccination checklist from onboarding, editable later
**Food inventory**
- Stock remaining per food, with an estimated "days left" based on your logged usage
- Restock log so you can see exactly when and how much you bought
**Multi-device sync**
- Every log, restock, appointment, and medication is written to Supabase, not just kept on-device
- Signing into the same account on a different phone re-fetches everything, so you're never stuck redoing onboarding just because you signed out
## Tech stack
 
- **Expo** (SDK 54) + **Expo Router**, React Native, TypeScript
- **Zustand** for local state, persisted to AsyncStorage as an offline cache
- **Supabase** — Postgres, Auth (email/password + Google OAuth), Row Level Security scoped to `auth.uid()`
- **Open Pet Food Facts** API for food search (brand, macros, ingredients)
- Custom neo-brutalist design system — thick borders, hard offset shadows, no external UI kit
## Setup
 
```bash
npm install
npx expo install --fix   # aligns expo-* packages to the exact SDK version
npx expo start
```
 
Scan the QR with Expo Go, or press `i` / `a` for a simulator.
 
**Supabase:**
1. Run `supabase/schema.sql` in your project's SQL editor — creates all the tables (`pets`, `foods`, `feeding_logs`, `food_stock`, `vet_appointments`, `medications`) plus RLS policies. It's idempotent, safe to re-run.
2. Drop your project URL and anon key into `.env`:
```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
3. For Google sign-in: enable the Google provider under Authentication → Providers, and add `bowlkeeper://auth-callback` as a redirect URL. Email/password works with no extra setup.
## Folder structure
 
```
app/
  (auth)/                sign in / sign up
  (onboarding)/           7-step pet setup flow
  (app)/(tabs)/           Home, Insights, Vet, Food
  (app)/                  modals — log feeding, add restock, add appointment, add medication
src/
  store/useAppStore.ts    zustand store, pets keyed by id
  lib/supabase.ts         supabase client + all read/write helpers
  lib/petFoodApi.ts       Open Pet Food Facts search
  components/             shared UI (buttons, chips, rings, calendar, etc.)
  types/                  shared TypeScript types
supabase/
  schema.sql              tables + RLS, run once in the SQL editor
```
 
## Known limitations / maybe later
 
- No push notifications yet for meal reminders or upcoming vet visits — the data's all there, just needs `expo-notifications` wired up
- Sync is "fetch fresh on open," not realtime — two devices editing at the exact same moment can briefly show different things until the next app open
- No editing of past feeding logs once saved (you can delete and re-add appointments/medications, but not logs)
---
 
Built for my own pets 🐕🐈 — feel free to fork it for yours.