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

/** Inserts a single food for an already-committed pet (adding food after
 *  onboarding, from the Food inventory screen). Returns the new row's id. */
export async function insertFood(petId: string, food: FoodItem) {
  const { data, error } = await supabase
    .from("foods")
    .insert({
      pet_id: petId,
      category: food.category,
      food_name: food.foodName,
      daily_grams: Number(food.dailyGrams) || 0,
      meals_per_day: food.mealsPerDay,
    })
    .select()
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateFood(food: FoodItem) {
  const { error } = await supabase
    .from("foods")
    .update({
      category: food.category,
      food_name: food.foodName,
      daily_grams: Number(food.dailyGrams) || 0,
      meals_per_day: food.mealsPerDay,
    })
    .eq("id", food.id);
  if (error) throw error;
}

export async function deleteFood(id: string) {
  const { error } = await supabase.from("foods").delete().eq("id", id);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from("vet_appointments")
    .insert({
      pet_id: petId,
      date: appt.date,
      time: appt.time ?? null,
      hospital_name: appt.hospitalName ?? null,
      doctor_name: appt.doctorName ?? null,
      phone_no: appt.phoneNo ?? null,
      note: appt.note,
      completed: appt.completed,
      diagnosis: appt.diagnosis ?? null,
      diagnostic_notes: appt.diagnosticNotes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function insertMedication(petId: string, med: Medication) {
  const { data, error } = await supabase
    .from("medications")
    .insert({
      pet_id: petId,
      name: med.name,
      dosage: med.dosage,
      schedule: med.schedule,
      start_date: med.startDate || null,
      duration_days: med.durationDays || null,
      appointment_id: med.appointmentId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from("vet_appointments").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteMedication(id: string) {
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAppointment(appt: VetAppointment) {
  const { error } = await supabase.from("vet_appointments").update({
    date: appt.date, time: appt.time ?? null, hospital_name: appt.hospitalName ?? null,
    doctor_name: appt.doctorName ?? null, phone_no: appt.phoneNo ?? null,
    note: appt.note, completed: appt.completed,
    diagnosis: appt.diagnosis ?? null, diagnostic_notes: appt.diagnosticNotes ?? null,
  }).eq("id", appt.id);
  if (error) throw error;
}

export async function updateMedication(med: Medication) {
  const { error } = await supabase.from("medications").update({
    name: med.name, dosage: med.dosage, schedule: med.schedule,
    start_date: med.startDate || null, duration_days: med.durationDays || null,
    appointment_id: med.appointmentId || null,
  }).eq("id", med.id);
  if (error) throw error;
}

export async function updateVaccinations(petId: string, vaccinations: Pet["vaccinations"]) {
  const { error } = await supabase.from("pets").update({ vaccinations }).eq("id", petId);
  if (error) throw error;
}

export async function updateMedicalTags(petId: string, medicalTags: Pet["medicalTags"]) {
  const { error } = await supabase.from("pets").update({ medical_tags: medicalTags }).eq("id", petId);
  if (error) throw error;
}

export async function updateVetFrequency(petId: string, frequency: string) {
  const { error } = await supabase.from("pets").update({ vet_visit_frequency: frequency }).eq("id", petId);
  if (error) throw error;
}
