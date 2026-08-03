import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile, Pet, FeedingPlan, FeedingLog, StockEntry, PetRecord } from "@/types";

interface AppState {
  isAuthed: boolean;
  hasOnboarded: boolean;
  user: UserProfile;

  // Scratch draft used by the onboarding wizard — also reused when adding a
  // second (or third...) pet later, via startAddPet().
  pet: Pet;
  plan: FeedingPlan;

  pets: Record<string, PetRecord>;
  activePetId: string | null;

  setAuthed: (v: boolean) => void;
  setUser: (u: Partial<UserProfile>) => void;
  setPet: (p: Partial<Pet>) => void;
  setPlan: (p: Partial<FeedingPlan>) => void;

  /** Called at the end of onboarding: commits the current draft as a new pet. */
  completeOnboarding: (petId: string) => void;
  /** Resets the draft and clears activePetId's "just onboarded" state so the
   *  wizard can be re-entered (starting at pet-type) to add another pet. */
  startAddPet: () => void;
  setActivePet: (id: string) => void;

  addLog: (petId: string, grams: number, label: string) => FeedingLog;
  addRestock: (petId: string, grams: number, note: string) => StockEntry;

  todayLogs: (petId?: string) => FeedingLog[];
  todayTotal: (petId?: string) => number;
  /** Total grams bought minus total grams fed, across all time. */
  stockRemaining: (petId?: string) => number;
  /** Estimated days left at the pet's planned daily rate, or null if no plan/stock. */
  stockDaysLeft: (petId?: string) => number | null;

  resetAll: () => void;
}

const emptyPet: Pet = {
  name: "",
  type: "",
  breed: "",
  weightKg: "",
  vaccinations: {},
  medicalTags: [],
  medicalNotes: "",
};

const emptyPlan: FeedingPlan = { foodName: "", dailyGrams: "", mealsPerDay: 3 };

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
      plan: emptyPlan,
      pets: {},
      activePetId: null,

      setAuthed: (v) => set({ isAuthed: v }),
      setUser: (u) => set({ user: { ...get().user, ...u } }),
      setPet: (p) => set({ pet: { ...get().pet, ...p } }),
      setPlan: (p) => set({ plan: { ...get().plan, ...p } }),

      completeOnboarding: (petId) => {
        const { pet, plan, pets } = get();
        const record: PetRecord = { id: petId, pet, plan, logs: [], restocks: [] };
        set({
          hasOnboarded: true,
          activePetId: petId,
          pets: { ...pets, [petId]: record },
          pet: emptyPet,
          plan: emptyPlan,
        });
      },

      startAddPet: () => set({ pet: emptyPet, plan: emptyPlan }),
      setActivePet: (id) => set({ activePetId: id }),

      addLog: (petId, grams, label) => {
        const entry: FeedingLog = { id: String(Date.now()), grams, label, loggedAt: new Date().toISOString() };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: { ...get().pets, [petId]: { ...record, logs: [entry, ...record.logs] } },
        });
        return entry;
      },

      addRestock: (petId, grams, note) => {
        const entry: StockEntry = { id: String(Date.now()), grams, note, addedAt: new Date().toISOString() };
        const record = get().pets[petId];
        if (!record) return entry;
        set({
          pets: { ...get().pets, [petId]: { ...record, restocks: [entry, ...record.restocks] } },
        });
        return entry;
      },

      todayLogs: (petId) => {
        const id = petId ?? get().activePetId;
        const record = id ? get().pets[id] : undefined;
        if (!record) return [];
        return record.logs.filter((l) => isSameDay(new Date(l.loggedAt), new Date()));
      },

      todayTotal: (petId) => get().todayLogs(petId).reduce((sum, l) => sum + l.grams, 0),

      stockRemaining: (petId) => {
        const id = petId ?? get().activePetId;
        const record = id ? get().pets[id] : undefined;
        if (!record) return 0;
        const bought = record.restocks.reduce((sum, r) => sum + r.grams, 0);
        const fed = record.logs.reduce((sum, l) => sum + l.grams, 0);
        return Math.max(0, bought - fed);
      },

      stockDaysLeft: (petId) => {
        const id = petId ?? get().activePetId;
        const record = id ? get().pets[id] : undefined;
        if (!record) return null;
        const rate = Number(record.plan.dailyGrams);
        if (!rate) return null;
        const remaining = get().stockRemaining(id);
        return Math.floor(remaining / rate);
      },

      resetAll: () =>
        set({
          isAuthed: false,
          hasOnboarded: false,
          user: { name: "", email: "" },
          pet: emptyPet,
          plan: emptyPlan,
          pets: {},
          activePetId: null,
        }),
    }),
    {
      name: "bowlkeeper-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
