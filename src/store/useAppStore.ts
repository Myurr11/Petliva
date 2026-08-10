import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile, Pet, FoodItem, FeedingLog, StockEntry, PetRecord,
  VetInfo, VetAppointment, Medication, FoodCategory,
} from "@/types";

interface AppState {
  isAuthed: boolean;
  hasOnboarded: boolean;
  user: UserProfile;

  // Scratch draft used by the onboarding wizard — also reused when adding a
  // second (or third...) pet later, via startAddPet().
  pet: Pet;
  foodsDraft: FoodItem[];
  vetDraft: VetInfo;

  pets: Record<string, PetRecord>;
  activePetId: string | null;

  setAuthed: (v: boolean) => void;
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
  addAppointment: (petId: string, date: string, note: string) => VetAppointment;
  addMedication: (petId: string, name: string, dosage: string, schedule: string) => Medication;
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
      user: { name: "", email: "" },
      pet: emptyPet,
      foodsDraft: defaultFoodsDraft(),
      vetDraft: emptyVet,
      pets: {},
      activePetId: null,

      setAuthed: (v) => set({ isAuthed: v }),
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

      addAppointment: (petId, date, note) => {
        const entry: VetAppointment = { id: String(Date.now()), date, note, completed: false };
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

      addMedication: (petId, name, dosage, schedule) => {
        const entry: Medication = { id: String(Date.now()), name, dosage, schedule };
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
      name: "bowlkeeper-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
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
              foodBrand: plan.foodBrand,
              foodImageUrl: plan.foodImageUrl,
              foodBarcode: plan.foodBarcode,
              foodIngredientsText: plan.foodIngredientsText,
              proteinPct: plan.proteinPct,
              fatPct: plan.fatPct,
              fiberPct: plan.fiberPct,
              ashPct: plan.ashPct,
              kcalPer100g: plan.kcalPer100g,
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

        return state;
      },
    }
  )
);
