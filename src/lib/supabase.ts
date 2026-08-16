import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Pet, PetType, FoodItem, FeedingLog, StockEntry, VetInfo, VetAppointment, Medication, PetRecord } from "@/types";

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
 * Loads every pet (+ foods, logs, restocks, appointments, medications)
 * belonging to the current session's user, and rebuilds them into the same
 * `Record<string, PetRecord>` shape the local store keeps in AsyncStorage.
 *
 * This is the source of truth on sign-in / app-launch: the local cache can
 * be empty (fresh install, or wiped on a previous sign-out) but the account
 * may still have data sitting in Supabase, and this is what brings it back.
 */
export async function fetchUserPetRecords(): Promise<Record<string, PetRecord>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: petRows, error: petsErr } = await supabase
    .from("pets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (petsErr) throw petsErr;
  if (!petRows || petRows.length === 0) return {};

  const petIds = petRows.map((p) => p.id);

  const [foodsRes, logsRes, stockRes, apptRes, medRes] = await Promise.all([
    supabase.from("foods").select("*").in("pet_id", petIds),
    supabase.from("feeding_logs").select("*").in("pet_id", petIds).order("logged_at", { ascending: false }),
    supabase.from("food_stock").select("*").in("pet_id", petIds).order("added_at", { ascending: false }),
    supabase.from("vet_appointments").select("*").in("pet_id", petIds).order("created_at", { ascending: false }),
    supabase.from("medications").select("*").in("pet_id", petIds).order("created_at", { ascending: false }),
  ]);
  if (foodsRes.error) throw foodsRes.error;
  if (logsRes.error) throw logsRes.error;
  if (stockRes.error) throw stockRes.error;
  if (apptRes.error) throw apptRes.error;
  if (medRes.error) throw medRes.error;

  const pets: Record<string, PetRecord> = {};
  for (const p of petRows) {
    pets[p.id] = {
      id: p.id,
      pet: {
        name: p.name ?? "",
        type: (p.type ?? "") as PetType | "",
        breed: p.breed ?? "",
        weightKg: p.weight_kg != null ? String(p.weight_kg) : "",
        ageYears: p.age_years != null ? String(p.age_years) : "",
        vaccinations: p.vaccinations ?? {},
        medicalTags: p.medical_tags ?? [],
        medicalNotes: p.medical_notes ?? "",
      },
      foods: [],
      logs: [],
      restocks: [],
      vet: { visitFrequency: p.vet_visit_frequency ?? "", appointments: [], medications: [] },
    };
  }

  for (const f of foodsRes.data ?? []) {
    const rec = pets[f.pet_id];
    if (!rec) continue;
    rec.foods.push({
      id: f.id,
      category: f.category,
      foodName: f.food_name ?? "",
      dailyGrams: f.daily_grams != null ? String(f.daily_grams) : "",
      mealsPerDay: f.meals_per_day ?? 1,
    });
  }

  for (const l of logsRes.data ?? []) {
    const rec = pets[l.pet_id];
    if (!rec) continue;
    rec.logs.push({ id: l.id, foodId: l.food_id, grams: Number(l.grams), label: l.label ?? "", loggedAt: l.logged_at });
  }

  for (const s of stockRes.data ?? []) {
    const rec = pets[s.pet_id];
    if (!rec) continue;
    rec.restocks.push({ id: s.id, foodId: s.food_id, grams: Number(s.grams), note: s.note ?? "", addedAt: s.added_at });
  }

  for (const a of apptRes.data ?? []) {
    const rec = pets[a.pet_id];
    if (!rec) continue;
    rec.vet.appointments.push({
      id: a.id,
      date: a.date,
      time: a.time ?? undefined,
      hospitalName: a.hospital_name ?? undefined,
      doctorName: a.doctor_name ?? undefined,
      phoneNo: a.phone_no ?? undefined,
      note: a.note ?? "",
      completed: !!a.completed,
      diagnosis: a.diagnosis ?? undefined,
      diagnosticNotes: a.diagnostic_notes ?? undefined,
    });
  }

  for (const m of medRes.data ?? []) {
    const rec = pets[m.pet_id];
    if (!rec) continue;
    rec.vet.medications.push({
      id: m.id,
      name: m.name,
      dosage: m.dosage ?? "",
      schedule: m.schedule ?? "",
      startDate: m.start_date ?? "",
      durationDays: m.duration_days ?? 0,
      appointmentId: m.appointment_id ?? undefined,
    });
  }

  return pets;
}

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
