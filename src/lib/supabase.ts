import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Pet, FoodItem, FeedingLog, StockEntry, VetInfo, VetAppointment, Medication } from "@/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing — copy .env.example to .env and fill in your project's URL/anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// See supabase/schema.sql for the table definitions + RLS policies these
// helpers assume (pets, foods, feeding_logs, food_stock, vet_appointments,
// medications).

/**
 * Creates the pet row, one row in `foods` per FoodItem, and any vet
 * appointments/medications captured during onboarding. Returns the new
 * pet's id plus a map from each food's local draft id to its real Supabase
 * id, so the caller can finalize local state with ids that match what
 * future feeding_logs/food_stock inserts need to reference.
 */
export async function createPetAndFoods(pet: Pet, foods: FoodItem[], vet: VetInfo) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: petRow, error: petErr } = await supabase
    .from("pets")
    .insert({
      user_id: user.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      weight_kg: pet.weightKg ? Number(pet.weightKg) : null,
      age_years: pet.ageYears ? Number(pet.ageYears) : null,
      vaccinations: pet.vaccinations,
      medical_tags: pet.medicalTags,
      medical_notes: pet.medicalNotes,
      vet_visit_frequency: vet.visitFrequency || null,
    })
    .select()
    .single();
  if (petErr) throw petErr;

  const usableFoods = foods.filter((f) => f.foodName.trim() && f.dailyGrams.trim());
  const foodIdMap: Record<string, string> = {};

  for (const food of usableFoods) {
    const { data: foodRow, error: foodErr } = await supabase
      .from("foods")
      .insert({
        pet_id: petRow.id,
        category: food.category,
        food_name: food.foodName,
        daily_grams: Number(food.dailyGrams),
        meals_per_day: food.mealsPerDay,
        food_brand: food.foodBrand ?? null,
        food_image_url: food.foodImageUrl ?? null,
        food_barcode: food.foodBarcode ?? null,
        food_ingredients_text: food.foodIngredientsText ?? null,
        protein_pct: food.proteinPct ?? null,
        fat_pct: food.fatPct ?? null,
        fiber_pct: food.fiberPct ?? null,
        ash_pct: food.ashPct ?? null,
        kcal_100g: food.kcalPer100g ?? null,
      })
      .select()
      .single();
    if (foodErr) throw foodErr;
    foodIdMap[food.id] = foodRow.id;
  }

  for (const appt of vet.appointments) {
    await insertAppointment(petRow.id, appt).catch(() => {});
  }
  for (const med of vet.medications) {
    await insertMedication(petRow.id, med).catch(() => {});
  }

  return { petId: petRow.id as string, foodIdMap };
}

export async function insertFeedingLog(petId: string, log: FeedingLog) {
  const { error } = await supabase.from("feeding_logs").insert({
    pet_id: petId,
    food_id: log.foodId,
    grams: log.grams,
    label: log.label,
    logged_at: log.loggedAt,
  });
  if (error) throw error;
}

export async function insertRestock(petId: string, entry: StockEntry) {
  const { error } = await supabase.from("food_stock").insert({
    pet_id: petId,
    food_id: entry.foodId,
    grams: entry.grams,
    note: entry.note,
    added_at: entry.addedAt,
  });
  if (error) throw error;
}

export async function insertAppointment(petId: string, appt: VetAppointment) {
  const { error } = await supabase.from("vet_appointments").insert({
    pet_id: petId,
    date: appt.date,
    note: appt.note,
    completed: appt.completed,
  });
  if (error) throw error;
}

export async function insertMedication(petId: string, med: Medication) {
  const { error } = await supabase.from("medications").insert({
    pet_id: petId,
    name: med.name,
    dosage: med.dosage,
    schedule: med.schedule,
  });
  if (error) throw error;
}

export async function updateVetFrequency(petId: string, frequency: string) {
  const { error } = await supabase.from("pets").update({ vet_visit_frequency: frequency }).eq("id", petId);
  if (error) throw error;
}
