export type PetType = "cat" | "dog";

export interface UserProfile {
  name: string;
  email: string;
}

export interface Pet {
  name: string;
  type: PetType | "";
  breed: string;
  weightKg: string;
  vaccinations: Record<string, boolean>;
  medicalTags: string[];
  medicalNotes: string;
}

export interface FeedingPlan {
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
  grams: number;
  label: string;
  /** ISO timestamp captured automatically at the moment of logging */
  loggedAt: string;
}

export interface StockEntry {
  id: string;
  grams: number;
  note: string;
  /** ISO timestamp */
  addedAt: string;
}

/** Everything the app tracks for one committed (post-onboarding) pet. */
export interface PetRecord {
  id: string;
  pet: Pet;
  plan: FeedingPlan;
  logs: FeedingLog[];
  restocks: StockEntry[];
}
