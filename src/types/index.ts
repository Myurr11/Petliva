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
}

export interface FeedingLog {
  id: string;
  grams: number;
  label: string;
  /** ISO timestamp captured automatically at the moment of logging */
  loggedAt: string;
}
