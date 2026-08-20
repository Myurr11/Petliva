import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile, Pet, FoodItem, FeedingLog, StockEntry, PetRecord,
  VetInfo, VetAppointment, Medication, FoodCategory,
} from "@/types";
import { splitDecimalYears } from "@/lib/age";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface AppState {
  isAuthed: boolean;
  hasOnboarded: boolean;
  /** True while pets are being fetched from Supabase after sign-in / app
   *  launch. Screens that gate on `hasOnboarded` should wait for this to
   *  go false first, so we don't route someone into onboarding just
   *  because the fetch hasn't finished yet. */
  isHydrating: boolean;
  user: UserProfile;

  // Scratch draft used by the onboarding wizard — also reused when adding a
  // second (or third...) pet later, via startAddPet().
  pet: Pet;
  foodsDraft: FoodItem[];
  vetDraft: VetInfo;

  pets: Record<string, PetRecord>;
  activePetId: string | null;

  setAuthed: (v: boolean) => void;
  setHydrating: (v: boolean) => void;
  /** Replaces `pets` with what's actually on the server (called after
   *  sign-in / session restore) and derives `hasOnboarded`/`activePetId`
   *  from it, rather than trusting whatever was last cached locally. */
  hydrateFromServer: (pets: Record<string, PetRecord>) => void;
  setUser: (u: Partial<UserProfile>) => void;
  setPet: (p: Partial<Pet>) => void;
  setVetDraft: (v: Partial<VetInfo>) => void;

  updateFoodDraft: (id: string, patch: Partial<FoodItem>) => void;
  addFoodDraft: (category: FoodCategory) => string;
  removeFoodDraft: (id: string) => void;

  /** Called at the end of onboarding: commits the current drafts as a new pet.
   *  `foodIds` maps each draft food's local id to the server-assigned id
   *  returned by Supabase, so logs/restocks reference the real food row. */
  completeOnboarding: (petId: string, foodIdMap: Record<string, string>) => void;
  /** Resets the draft so the wizard can be re-entered (starting at pet-type)
   *  to add another pet. */
  startAddPet: () => void;
  setActivePet: (id: string) => void;

  addLog: (petId: string, foodId: string, grams: number, label: string) => FeedingLog;
  addRestock: (petId: string, foodId: string, grams: number, note: string) => StockEntry;
  /** Adds a new food to an already-committed pet (post-onboarding). */
  addFoodToPet: (petId: string, category: FoodCategory) => FoodItem;
  updateFoodItem: (petId: string, foodId: string, patch: Partial<Omit<FoodItem, "id">>) => void;
  removeFoodItem: (petId: string, foodId: string) => void;
  /** Swaps a local-generated food id for the real Supabase-assigned one once
   *  the insert succeeds, so later logs/restocks/deletes target the right row. */
  syncFoodId: (petId: string, localId: string, remoteId: string) => void;
  addAppointment: (
    petId: string,
    date: string,
    note: string,
    time?: string,
    hospitalName?: string,
    doctorName?: string,
    phoneNo?: string
  ) => VetAppointment;
  addMedication: (
    petId: string,
    name: string,
    dosage: string,
    schedule: string,
    startDate: string,
    durationDays: number,
    appointmentId?: string
  ) => Medication;
  updateAppointment: (petId: string, appointmentId: string, patch: Partial<Omit<VetAppointment, "id">>) => void;
  updateMedication: (petId: string, medicationId: string, patch: Partial<Omit<Medication, "id">>) => void;
  setVaccinationStatus: (petId: string, name: string, done: boolean) => void;
  /** Fully removes a vaccination entry (used for custom, non-preset
   *  vaccines added by the user — unlike setVaccinationStatus(false), this
   *  drops the key entirely instead of leaving a "not done" record). */
  removeVaccination: (petId: string, name: string) => void;
  /** Merges new tags into the pet's medicalTags, de-duplicated. Used to sync
   *  conditions diagnosed at a vet visit into the pet's overall profile. */
  addMedicalTags: (petId: string, tags: string[]) => void;
  removeAppointment: (petId: string, appointmentId: string) => void;
  removeMedication: (petId: string, medicationId: string) => void;
  /** Swaps a local-generated id for the real Supabase-assigned one once the
   *  insert succeeds, so a later delete can actually target the right row. */
  syncAppointmentId: (petId: string, localId: string, remoteId: string) => void;
  syncMedicationId: (petId: string, localId: string, remoteId: string) => void;
  setVetFrequency: (petId: string, frequency: string) => void;

  todayLogs: (petId?: string) => FeedingLog[];
  todayTotal: (petId?: string) => number;
  /** Today's logs/total scoped to one specific food (e.g. just the dry food). */
  todayLogsForFood: (petId: string, foodId: string) => FeedingLog[];
  todayTotalForFood: (petId: string, foodId: string) => number;

  /** Total grams bought minus total grams fed, for one food. */
  stockRemaining: (petId: string, foodId: string) => number;
  /** Estimated days left at that food's planned daily rate, or null. */
  stockDaysLeft: (petId: string, foodId: string) => number | null;

  resetAll: () => void;
}

const emptyPet: Pet = {
  name: "",
  type: "",
  breed: "",
  weightKg: "",
  ageYears: "",
  ageMonths: "",
  vaccinations: {},
  medicalTags: [],
  medicalNotes: "",
};

function makeEmptyFood(category: FoodCategory): FoodItem {
  return {
    id: `draft-${category}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    category,
    foodName: "",
    dailyGrams: "",
    mealsPerDay: category === "wet" ? 2 : 1,
  };
}

function defaultFoodsDraft(): FoodItem[] {
  return [makeEmptyFood("dry"), makeEmptyFood("wet")];
}

const emptyVet: VetInfo = { visitFrequency: "", appointments: [], medications: [] };

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      hasOnboarded: false,
      isHydrating: false,
      user: { name: "", email: "" },
      pet: emptyPet,
      foodsDraft: defaultFoodsDraft(),
      vetDraft: emptyVet,
      pets: {},
      activePetId: null,

      setAuthed: (v) => set({ isAuthed: v }),
      setHydrating: (v) => set({ isHydrating: v }),
      hydrateFromServer: (pets) => {
        const ids = Object.keys(pets);
        const currentActive = get().activePetId;
        set({
          pets,
          hasOnboarded: ids.length > 0,
          activePetId: currentActive && pets[currentActive] ? currentActive : (ids[0] ?? null),
        });
      },
      setUser: (u) => set({ user: { ...get().user, ...u } }),
      setPet: (p) => set({ pet: { ...get().pet, ...p } }),
      setVetDraft: (v) => set({ vetDraft: { ...get().vetDraft, ...v } }),

      updateFoodDraft: (id, patch) =>
        set({ foodsDraft: get().foodsDraft.map((f) => (f.id === id ? { ...f, ...patch } : f)) }),

      addFoodDraft: (category) => {
        const food = makeEmptyFood(category);
        set({ foodsDraft: [...get().foodsDraft, food] });
        return food.id;
      },

      removeFoodDraft: (id) => set({ foodsDraft: get().foodsDraft.filter((f) => f.id !== id) }),

      completeOnboarding: (petId, foodIdMap) => {
        const { pet, foodsDraft, vetDraft, pets } = get();
        const finalizedFoods = foodsDraft
          .filter((f) => f.foodName.trim() && f.dailyGrams.trim())
          .map((f) => ({ ...f, id: foodIdMap[f.id] ?? f.id }));
        const record: PetRecord = { id: petId, pet, foods: finalizedFoods, logs: [], restocks: [], vet: vetDraft };
        set({
          hasOnboarded: true,
          activePetId: petId,
          pets: { ...pets, [petId]: record },
          pet: emptyPet,
          foodsDraft: defaultFoodsDraft(),
          vetDraft: emptyVet,
        });
      },

      startAddPet: () => set({ pet: emptyPet, foodsDraft: defaultFoodsDraft(), vetDraft: emptyVet }),
      setActivePet: (id) => set({ activePetId: id }),

      addLog: (petId, foodId, grams, label) => {
        const entry: FeedingLog = { id: String(Date.now()), foodId, grams, label, loggedAt: new Date().toISOString() };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: { ...get().pets, [petId]: { ...record, logs: [entry, ...record.logs] } },
        });
        return entry;
      },

      addRestock: (petId, foodId, grams, note) => {
        const entry: StockEntry = { id: String(Date.now()), foodId, grams, note, addedAt: new Date().toISOString() };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: { ...get().pets, [petId]: { ...record, restocks: [entry, ...record.restocks] } },
        });
        return entry;
      },

      addFoodToPet: (petId, category) => {
        const entry = makeEmptyFood(category);
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: { ...get().pets, [petId]: { ...record, foods: [...record.foods, entry] } },
        });
        return entry;
      },

      updateFoodItem: (petId, foodId, patch) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, foods: record.foods.map((f) => (f.id === foodId ? { ...f, ...patch } : f)) },
          },
        });
      },

      removeFoodItem: (petId, foodId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: { ...get().pets, [petId]: { ...record, foods: record.foods.filter((f) => f.id !== foodId) } },
        });
      },

      syncFoodId: (petId, localId, remoteId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, foods: record.foods.map((f) => (f.id === localId ? { ...f, id: remoteId } : f)) },
          },
        });
      },

      addAppointment: (petId, date, note, time, hospitalName, doctorName, phoneNo) => {
        const entry: VetAppointment = {
          id: String(Date.now()),
          date,
          note,
          time: time || undefined,
          hospitalName: hospitalName || undefined,
          doctorName: doctorName || undefined,
          phoneNo: phoneNo || undefined,
          completed: false,
        };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, vet: { ...record.vet, appointments: [entry, ...record.vet.appointments] } },
          },
        });
        return entry;
      },

      addMedication: (petId, name, dosage, schedule, startDate, durationDays, appointmentId) => {
        const entry: Medication = { id: String(Date.now()), name, dosage, schedule, startDate, durationDays, appointmentId };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, vet: { ...record.vet, medications: [entry, ...record.vet.medications] } },
          },
        });
        return entry;
      },

      updateAppointment: (petId, appointmentId, patch) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: { ...record.vet, appointments: record.vet.appointments.map((a) => (a.id === appointmentId ? { ...a, ...patch } : a)) },
            },
          },
        });
      },

      updateMedication: (petId, medicationId, patch) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: { ...record.vet, medications: record.vet.medications.map((m) => (m.id === medicationId ? { ...m, ...patch } : m)) },
            },
          },
        });
      },

      setVaccinationStatus: (petId, name, done) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, pet: { ...record.pet, vaccinations: { ...record.pet.vaccinations, [name]: done } } },
          },
        });
      },

      removeVaccination: (petId, name) => {
        const record = get().pets[petId];
        if (!record) return;
        const rest = { ...record.pet.vaccinations };
        delete rest[name];
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, pet: { ...record.pet, vaccinations: rest } },
          },
        });
      },

      addMedicalTags: (petId, tags) => {
        const record = get().pets[petId];
        if (!record) return;
        const clean = tags.map((t) => t.trim()).filter(Boolean);
        if (clean.length === 0) return;
        const merged = Array.from(new Set([...record.pet.medicalTags, ...clean]));
        set({
          pets: {
            ...get().pets,
            [petId]: { ...record, pet: { ...record.pet, medicalTags: merged } },
          },
        });
      },

      removeAppointment: (petId, appointmentId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: { ...record.vet, appointments: record.vet.appointments.filter((a) => a.id !== appointmentId) },
            },
          },
        });
      },

      removeMedication: (petId, medicationId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: { ...record.vet, medications: record.vet.medications.filter((m) => m.id !== medicationId) },
            },
          },
        });
      },

      syncAppointmentId: (petId, localId, remoteId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: {
                ...record.vet,
                appointments: record.vet.appointments.map((a) => (a.id === localId ? { ...a, id: remoteId } : a)),
              },
            },
          },
        });
      },

      syncMedicationId: (petId, localId, remoteId) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: {
            ...get().pets,
            [petId]: {
              ...record,
              vet: {
                ...record.vet,
                medications: record.vet.medications.map((m) => (m.id === localId ? { ...m, id: remoteId } : m)),
              },
            },
          },
        });
      },

      setVetFrequency: (petId, frequency) => {
        const record = get().pets[petId];
        if (!record) return;
        set({
          pets: { ...get().pets, [petId]: { ...record, vet: { ...record.vet, visitFrequency: frequency } } },
        });
      },

      todayLogs: (petId) => {
        const id = petId ?? get().activePetId;
        const record = id ? get().pets[id] : undefined;
        if (!record) return [];
        return record.logs.filter((l) => isSameDay(new Date(l.loggedAt), new Date()));
      },

      todayTotal: (petId) => get().todayLogs(petId).reduce((sum, l) => sum + l.grams, 0),

      todayLogsForFood: (petId, foodId) => get().todayLogs(petId).filter((l) => l.foodId === foodId),
      todayTotalForFood: (petId, foodId) => get().todayLogsForFood(petId, foodId).reduce((sum, l) => sum + l.grams, 0),

      stockRemaining: (petId, foodId) => {
        const record = get().pets[petId];
        if (!record) return 0;
        const bought = record.restocks.filter((r) => r.foodId === foodId).reduce((sum, r) => sum + r.grams, 0);
        const fed = record.logs.filter((l) => l.foodId === foodId).reduce((sum, l) => sum + l.grams, 0);
        return Math.max(0, bought - fed);
      },

      stockDaysLeft: (petId, foodId) => {
        const record = get().pets[petId];
        if (!record) return null;
        const food = record.foods.find((f) => f.id === foodId);
        const rate = Number(food?.dailyGrams);
        if (!rate) return null;
        const remaining = get().stockRemaining(petId, foodId);
        return Math.floor(remaining / rate);
      },

      resetAll: () =>
        set({
          isAuthed: false,
          hasOnboarded: false,
          user: { name: "", email: "" },
          pet: emptyPet,
          foodsDraft: defaultFoodsDraft(),
          vetDraft: emptyVet,
          pets: {},
          activePetId: null,
        }),
    }),
    {
      name: "petliva-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      // isHydrating is a transient runtime flag, not real state — never
      // persist it, or an app crash mid-fetch could leave it stuck `true`
      // forever and block every future launch.
      partialize: (state) => {
        const { isHydrating, ...rest } = state;
        return rest;
      },
      migrate: (persisted: any, fromVersion) => {
        let state = persisted;

        // v0/v1 -> v2: single pet fields on root state -> pets{} map
        if (fromVersion < 2 && state) {
          const hadPet = state.pet?.name;
          const oldId = state.petId ?? (hadPet ? `legacy-${Date.now()}` : null);
          if (hadPet && oldId) {
            const record = {
              id: oldId,
              pet: state.pet,
              plan: state.plan ?? { foodName: "", dailyGrams: "", mealsPerDay: 3 },
              logs: state.logs ?? [],
              restocks: state.restocks ?? [],
              vet: emptyVet,
            };
            state = { ...state, pets: { [oldId]: record }, activePetId: oldId, pet: emptyPet };
          } else {
            state = { ...state, pets: {}, activePetId: null, hasOnboarded: false };
          }
        }

        // v2 -> v3: PetRecord gained a `vet` field
        if (fromVersion < 3 && state) {
          const pets = { ...(state.pets ?? {}) };
          for (const id of Object.keys(pets)) {
            if (!pets[id].vet) pets[id] = { ...pets[id], vet: emptyVet };
          }
          state = { ...state, pets, vetDraft: state.vetDraft ?? emptyVet };
        }

        // v3 -> v4: single `plan: FeedingPlan` per pet -> `foods: FoodItem[]`.
        // Wraps the old single food as one "dry" FoodItem (a reasonable
        // default — most single-food setups are dry kibble) and backfills
        // foodId onto every existing log/restock so per-food stock and
        // insights keep working for pets onboarded before this change.
        if (fromVersion < 4 && state) {
          const pets = { ...(state.pets ?? {}) };
          for (const id of Object.keys(pets)) {
            const record = pets[id];
            if (record.foods) continue; // already migrated
            const plan = record.plan ?? { foodName: "", dailyGrams: "", mealsPerDay: 3 };
            const legacyFoodId = `legacy-food-${id}`;
            const food: FoodItem = {
              id: legacyFoodId,
              category: "dry",
              foodName: plan.foodName || "Food",
              dailyGrams: plan.dailyGrams || "",
              mealsPerDay: plan.mealsPerDay || 1,
            };
            pets[id] = {
              ...record,
              foods: [food],
              logs: (record.logs ?? []).map((l: any) => ({ ...l, foodId: l.foodId ?? legacyFoodId })),
              restocks: (record.restocks ?? []).map((r: any) => ({ ...r, foodId: r.foodId ?? legacyFoodId })),
            };
            delete pets[id].plan;
          }
          state = { ...state, pets, foodsDraft: state.foodsDraft ?? defaultFoodsDraft() };
          delete state.plan;
        }

        // v4 -> v5: Medication gained startDate/durationDays (a prescribed
        // course now has a real date range instead of showing forever).
        // Existing medications didn't have these — treat them as having
        // started today with a generous 30-day duration, so they still show
        // up as "active" rather than silently disappearing; the user can
        // correct the real dates from the Vet tab if needed.
        if (fromVersion < 5 && state) {
          const pets = { ...(state.pets ?? {}) };
          const todayIso = todayISO();
          for (const id of Object.keys(pets)) {
            const record = pets[id];
            if (!record.vet?.medications?.length) continue;
            const medications = record.vet.medications.map((m: any) =>
              m.startDate ? m : { ...m, startDate: todayIso, durationDays: 30 }
            );
            pets[id] = { ...record, vet: { ...record.vet, medications } };
          }
          state = { ...state, pets };
        }

        // v5 -> v6: Pet.ageYears was a single decimal ("2.25") entered via a
        // free-text field. Age is now captured as separate whole-years +
        // months via a wheel picker, so split any existing decimal into
        // those two fields — onboarding drafts and every committed pet.
        if (fromVersion < 6 && state) {
          const splitPet = (pet: any) => {
            if (!pet || pet.ageMonths !== undefined) return pet;
            const decimal = Number(pet.ageYears) || 0;
            const { years, months } = splitDecimalYears(decimal);
            return { ...pet, ageYears: pet.ageYears ? String(years) : "", ageMonths: pet.ageYears ? String(months) : "" };
          };
          const pets = { ...(state.pets ?? {}) };
          for (const id of Object.keys(pets)) {
            pets[id] = { ...pets[id], pet: splitPet(pets[id].pet) };
          }
          state = { ...state, pets, pet: splitPet(state.pet) ?? emptyPet };
        }

        return state;
      },
    }
  )
);
