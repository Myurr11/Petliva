import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Pet, FeedingPlan, FeedingLog, StockEntry } from "@/types";

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
// helpers assume (pets, feeding_plans, feeding_logs).

export async function createPetAndPlan(pet: Pet, plan: FeedingPlan) {
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
      vaccinations: pet.vaccinations,
      medical_tags: pet.medicalTags,
      medical_notes: pet.medicalNotes,
    })
    .select()
    .single();
  if (petErr) throw petErr;

  const { error: planErr } = await supabase.from("feeding_plans").insert({
    pet_id: petRow.id,
    food_name: plan.foodName,
    daily_grams: Number(plan.dailyGrams),
    meals_per_day: plan.mealsPerDay,
    food_brand: plan.foodBrand ?? null,
    food_image_url: plan.foodImageUrl ?? null,
    food_barcode: plan.foodBarcode ?? null,
    food_ingredients_text: plan.foodIngredientsText ?? null,
    protein_pct: plan.proteinPct ?? null,
    fat_pct: plan.fatPct ?? null,
    fiber_pct: plan.fiberPct ?? null,
    ash_pct: plan.ashPct ?? null,
    kcal_100g: plan.kcalPer100g ?? null,
  });
  if (planErr) throw planErr;

  return petRow.id as string;
}

export async function insertFeedingLog(petId: string, log: FeedingLog) {
  const { error } = await supabase.from("feeding_logs").insert({
    pet_id: petId,
    grams: log.grams,
    label: log.label,
    logged_at: log.loggedAt,
  });
  if (error) throw error;
}

export async function insertRestock(petId: string, entry: StockEntry) {
  const { error } = await supabase.from("food_stock").insert({
    pet_id: petId,
    grams: entry.grams,
    note: entry.note,
    added_at: entry.addedAt,
  });
  if (error) throw error;
}
