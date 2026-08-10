-- Run this in your Supabase project's SQL editor.
-- Safe to run multiple times — every statement is idempotent (uses
-- if not exists / drop-then-create), so re-running after an error or to
-- pick up new columns won't fail or touch existing data.

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in ('cat','dog')),
  breed text,
  weight_kg numeric,
  age_years numeric,
  vaccinations jsonb default '{}',
  medical_tags text[] default '{}',
  medical_notes text,
  vet_visit_frequency text,
  created_at timestamptz default now()
);

alter table pets add column if not exists vet_visit_frequency text;
alter table pets add column if not exists age_years numeric;

create table if not exists vet_appointments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  date date not null,
  time text,
  hospital_name text,
  doctor_name text,
  phone_no text,
  note text,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table vet_appointments add column if not exists time text;
alter table vet_appointments add column if not exists hospital_name text;
alter table vet_appointments add column if not exists doctor_name text;
alter table vet_appointments add column if not exists phone_no text;

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  name text not null,
  dosage text,
  schedule text,
  created_at timestamptz default now()
);

-- Superseded by `foods` below (a pet can now have several foods — e.g. one
-- dry + one wet — instead of exactly one). Left in place, unused, so
-- existing installs don't lose any historical data; nothing in the app
-- writes to this table anymore.
create table if not exists feeding_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  food_name text,
  daily_grams numeric not null,
  meals_per_day int not null default 3,
  updated_at timestamptz default now()
);

-- One row per food a pet eats (typically one "dry" + one "wet", optionally
-- more). Replaces the single food_name/daily_grams columns that used to
-- live directly on feeding_plans.
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  category text not null check (category in ('dry','wet')),
  food_name text,
  daily_grams numeric not null,
  meals_per_day int not null default 1,
  food_brand text,
  food_image_url text,
  food_barcode text,
  food_ingredients_text text,
  protein_pct numeric,
  fat_pct numeric,
  fiber_pct numeric,
  ash_pct numeric,
  kcal_100g numeric,
  created_at timestamptz default now()
);

create table if not exists feeding_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  food_id uuid references foods on delete set null,
  grams numeric not null,
  label text not null,
  logged_at timestamptz default now()
);

alter table feeding_logs add column if not exists food_id uuid references foods on delete set null;

create table if not exists food_stock (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  food_id uuid references foods on delete set null,
  grams numeric not null,
  note text,
  added_at timestamptz default now()
);

alter table food_stock add column if not exists food_id uuid references foods on delete set null;

alter table pets enable row level security;
alter table feeding_plans enable row level security;
alter table foods enable row level security;
alter table feeding_logs enable row level security;
alter table food_stock enable row level security;
alter table vet_appointments enable row level security;
alter table medications enable row level security;

drop policy if exists "Users manage their own pets" on pets;
create policy "Users manage their own pets"
  on pets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage plans for their own pets" on feeding_plans;
create policy "Users manage plans for their own pets"
  on feeding_plans for all
  using (exists (select 1 from pets where pets.id = feeding_plans.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = feeding_plans.pet_id and pets.user_id = auth.uid()));

drop policy if exists "Users manage foods for their own pets" on foods;
create policy "Users manage foods for their own pets"
  on foods for all
  using (exists (select 1 from pets where pets.id = foods.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = foods.pet_id and pets.user_id = auth.uid()));

drop policy if exists "Users manage logs for their own pets" on feeding_logs;
create policy "Users manage logs for their own pets"
  on feeding_logs for all
  using (exists (select 1 from pets where pets.id = feeding_logs.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = feeding_logs.pet_id and pets.user_id = auth.uid()));

drop policy if exists "Users manage food stock for their own pets" on food_stock;
create policy "Users manage food stock for their own pets"
  on food_stock for all
  using (exists (select 1 from pets where pets.id = food_stock.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = food_stock.pet_id and pets.user_id = auth.uid()));

drop policy if exists "Users manage vet appointments for their own pets" on vet_appointments;
create policy "Users manage vet appointments for their own pets"
  on vet_appointments for all
  using (exists (select 1 from pets where pets.id = vet_appointments.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = vet_appointments.pet_id and pets.user_id = auth.uid()));

drop policy if exists "Users manage medications for their own pets" on medications;
create policy "Users manage medications for their own pets"
  on medications for all
  using (exists (select 1 from pets where pets.id = medications.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = medications.pet_id and pets.user_id = auth.uid()));
