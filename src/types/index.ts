export type PetType = "cat" | "dog";
export type FoodCategory = "dry" | "wet";

export interface UserProfile {
  name: string;
  email: string;
}

export interface Pet {
  name: string;
  type: PetType | "";
  breed: string;
  weightKg: string;
  /** Whole years. Paired with ageMonths for a full "X yr Y mo" age. */
  ageYears: string;
  /** 0-11. Lets onboarding capture age more precisely than whole years —
   *  most pets aren't onboarded on their exact birthday. */
  ageMonths: string;
  vaccinations: Record<string, boolean>;
  medicalTags: string[];
  medicalNotes: string;
}

/** One food a pet eats — a pet can have several (e.g. one dry + one wet). */
export interface FoodItem {
  id: string;
  category: FoodCategory;
  foodName: string;
  dailyGrams: string;
  mealsPerDay: number;
  /** Which weekdays (0=Sun..6=Sat) this food is actually given. Undefined
   *  (or the full 0-6 set) means every day — most dry food is. Wet food is
   *  often only a few days a week, so this lets that be modeled instead of
   *  forcing every food onto a daily cadence. */
  daysOfWeek?: number[];
}

export interface FeedingLog {
  id: string;
  /** Which FoodItem this feeding was of. */
  foodId: string;
  grams: number;
  label: string;
  /** ISO timestamp captured automatically at the moment of logging */
  loggedAt: string;
}

export interface StockEntry {
  id: string;
  /** Which FoodItem this restock is for. */
  foodId: string;
  grams: number;
  note: string;
  /** ISO timestamp */
  addedAt: string;
}

export interface VetAppointment {
  id: string;
  /** ISO date */
  date: string;
  time?: string;
  hospitalName?: string;
  doctorName?: string;
  phoneNo?: string;
  note: string;
  completed: boolean;
  /** Diseases / conditions the vet identified during this specific visit. */
  diagnosis?: string[];
  /** Free-text findings from this visit — diagnostic report results, labs, etc. */
  diagnosticNotes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  /** ISO date (YYYY-MM-DD) the course starts. */
  startDate: string;
  /** How many days the course runs, starting from startDate (inclusive). */
  durationDays: number;
  /** Which vet appointment this was prescribed in, if any — lets the
   *  appointment's detail page list medications that came out of that visit. */
  appointmentId?: string;
}

export interface VetInfo {
  visitFrequency: string;
  appointments: VetAppointment[];
  medications: Medication[];
}

/** Everything the app tracks for one committed (post-onboarding) pet. */
export interface PetRecord {
  id: string;
  pet: Pet;
  foods: FoodItem[];
  logs: FeedingLog[];
  restocks: StockEntry[];
  vet: VetInfo;
}
