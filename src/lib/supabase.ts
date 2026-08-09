import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Pet, FeedingPlan, FeedingLog, StockEntry, VetInfo, VetAppointment, Medication } from "@/types";

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

export async function createPetAndPlan(pet: Pet, plan: FeedingPlan, vet: VetInfo) {
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

  for (const appt of vet.appointments) {
    await insertAppointment(petRow.id, appt).catch(() => {});
  }
  for (const med of vet.medications) {
    await insertMedication(petRow.id, med).catch(() => {});
  }

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
