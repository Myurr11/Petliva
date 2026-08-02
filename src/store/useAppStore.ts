import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile, Pet, FeedingPlan, FeedingLog } from "@/types";

interface AppState {
  isAuthed: boolean;
  hasOnboarded: boolean;
  petId: string | null;
  user: UserProfile;
  pet: Pet;
  plan: FeedingPlan;
  logs: FeedingLog[];

  setAuthed: (v: boolean) => void;
  setUser: (u: Partial<UserProfile>) => void;
  setPet: (p: Partial<Pet>) => void;
  setPlan: (p: Partial<FeedingPlan>) => void;
  completeOnboarding: (petId: string) => void;
  addLog: (grams: number, label: string) => FeedingLog;
  todayLogs: () => FeedingLog[];
  todayTotal: () => number;
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
      petId: null,
      user: { name: "", email: "" },
      pet: emptyPet,
      plan: emptyPlan,
      logs: [],

      setAuthed: (v) => set({ isAuthed: v }),
      setUser: (u) => set({ user: { ...get().user, ...u } }),
      setPet: (p) => set({ pet: { ...get().pet, ...p } }),
      setPlan: (p) => set({ plan: { ...get().plan, ...p } }),
      completeOnboarding: (petId) => set({ hasOnboarded: true, petId }),

      addLog: (grams, label) => {
        const entry: FeedingLog = { id: String(Date.now()), grams, label, loggedAt: new Date().toISOString() };
        set({ logs: [entry, ...get().logs] });
        return entry;
      },

      todayLogs: () => get().logs.filter((l) => isSameDay(new Date(l.loggedAt), new Date())),
      todayTotal: () => get().todayLogs().reduce((sum, l) => sum + l.grams, 0),

      resetAll: () =>
        set({
          isAuthed: false,
          hasOnboarded: false,
          petId: null,
          user: { name: "", email: "" },
          pet: emptyPet,
          plan: emptyPlan,
          logs: [],
        }),
    }),
    {
      name: "bowlkeeper-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
