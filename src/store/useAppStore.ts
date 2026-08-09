import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile, Pet, FeedingPlan, FeedingLog, StockEntry, PetRecord,
  VetInfo, VetAppointment, Medication,
} from "@/types";

interface AppState {
  isAuthed: boolean;
  hasOnboarded: boolean;
  user: UserProfile;

  // Scratch draft used by the onboarding wizard — also reused when adding a
  // second (or third...) pet later, via startAddPet().
  pet: Pet;
  plan: FeedingPlan;
  vetDraft: VetInfo;

  pets: Record<string, PetRecord>;
  activePetId: string | null;

  setAuthed: (v: boolean) => void;
  setUser: (u: Partial<UserProfile>) => void;
  setPet: (p: Partial<Pet>) => void;
  setPlan: (p: Partial<FeedingPlan>) => void;
  setVetDraft: (v: Partial<VetInfo>) => void;

  /** Called at the end of onboarding: commits the current draft as a new pet. */
  completeOnboarding: (petId: string) => void;
  /** Resets the draft so the wizard can be re-entered (starting at pet-type)
   *  to add another pet. */
  startAddPet: () => void;
  setActivePet: (id: string) => void;

  addLog: (petId: string, grams: number, label: string) => FeedingLog;
  addRestock: (petId: string, grams: number, note: string) => StockEntry;
  addAppointment: (petId: string, date: string, note: string) => VetAppointment;
  addMedication: (petId: string, name: string, dosage: string, schedule: string) => Medication;
  setVetFrequency: (petId: string, frequency: string) => void;

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
  ageYears: "",
  vaccinations: {},
  medicalTags: [],
  medicalNotes: "",
};

const emptyPlan: FeedingPlan = { foodName: "", dailyGrams: "", mealsPerDay: 3 };
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
      plan: emptyPlan,
      vetDraft: emptyVet,
      pets: {},
      activePetId: null,

      setAuthed: (v) => set({ isAuthed: v }),
      setUser: (u) => set({ user: { ...get().user, ...u } }),
      setPet: (p) => set({ pet: { ...get().pet, ...p } }),
      setPlan: (p) => set({ plan: { ...get().plan, ...p } }),
      setVetDraft: (v) => set({ vetDraft: { ...get().vetDraft, ...v } }),

      completeOnboarding: (petId) => {
        const { pet, plan, vetDraft, pets } = get();
        const record: PetRecord = { id: petId, pet, plan, logs: [], restocks: [], vet: vetDraft };
        set({
          hasOnboarded: true,
          activePetId: petId,
          pets: { ...pets, [petId]: record },
          pet: emptyPet,
          plan: emptyPlan,
          vetDraft: emptyVet,
        });
      },

      startAddPet: () => set({ pet: emptyPet, plan: emptyPlan, vetDraft: emptyVet }),
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
          vetDraft: emptyVet,
          pets: {},
          activePetId: null,
        }),
    }),
    {
      name: "bowlkeeper-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted: any, fromVersion) => {
        let state = persisted;

        // v0/v1 -> v2: single pet fields on root state -> pets{} map
        if (fromVersion < 2 && state) {
          const hadPet = state.pet?.name;
          const oldId = state.petId ?? (hadPet ? `legacy-${Date.now()}` : null);
          if (hadPet && oldId) {
            const record: PetRecord = {
              id: oldId,
              pet: state.pet,
              plan: state.plan ?? emptyPlan,
              logs: state.logs ?? [],
              restocks: state.restocks ?? [],
              vet: emptyVet,
            };
            state = { ...state, pets: { [oldId]: record }, activePetId: oldId, pet: emptyPet, plan: emptyPlan };
          } else {
            state = { ...state, pets: {}, activePetId: null, hasOnboarded: false };
          }
        }

        // v2 -> v3: PetRecord gained a `vet` field; backfill it on every
        // existing pet, and add the vetDraft scratch field.
        if (fromVersion < 3 && state) {
          const pets = { ...(state.pets ?? {}) };
          for (const id of Object.keys(pets)) {
            if (!pets[id].vet) pets[id] = { ...pets[id], vet: emptyVet };
          }
          state = { ...state, pets, vetDraft: state.vetDraft ?? emptyVet };
        }

        return state;
      },
    }
  )
);
