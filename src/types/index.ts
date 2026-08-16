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
  ageYears: string;
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
  // Populated when the food was picked from an Open Pet Food Facts search
  // result rather than typed manually. All optional — free-text entry still
  // works with none of these set.
  foodBrand?: string;
  foodImageUrl?: string;
  foodBarcode?: string;
  foodIngredientsText?: string;
  proteinPct?: number;
  fatPct?: number;
  fiberPct?: number;
  ashPct?: number;
  kcalPer100g?: number;
}

/** A single search result from the Open Pet Food Facts API. */
export interface PetFoodProduct {
  code: string;
  name: string;
  brand: string;
  imageUrl?: string;
  quantity?: string;
  ingredientsText?: string;
  proteinPct?: number;
  fatPct?: number;
  fiberPct?: number;
  ashPct?: number;
  kcalPer100g?: number;
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
