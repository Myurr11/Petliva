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
  vaccinations jsonb default '{}',
  medical_tags text[] default '{}',
  medical_notes text,
  created_at timestamptz default now()
);

create table if not exists feeding_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  food_name text,
  daily_grams numeric not null,
  meals_per_day int not null default 3,
  updated_at timestamptz default now()
);

-- Open Pet Food Facts columns — safe to run even if feeding_plans already
-- exists without them (this is exactly that case for you right now).
alter table feeding_plans add column if not exists food_brand text;
alter table feeding_plans add column if not exists food_image_url text;
alter table feeding_plans add column if not exists food_barcode text;
alter table feeding_plans add column if not exists food_ingredients_text text;
alter table feeding_plans add column if not exists protein_pct numeric;
alter table feeding_plans add column if not exists fat_pct numeric;
alter table feeding_plans add column if not exists fiber_pct numeric;
alter table feeding_plans add column if not exists ash_pct numeric;
alter table feeding_plans add column if not exists kcal_100g numeric;

create table if not exists feeding_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  grams numeric not null,
  label text not null,
  logged_at timestamptz default now()
);

create table if not exists food_stock (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  grams numeric not null,
  note text,
  added_at timestamptz default now()
);

alter table pets enable row level security;
alter table feeding_plans enable row level security;
alter table feeding_logs enable row level security;
alter table food_stock enable row level security;

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
