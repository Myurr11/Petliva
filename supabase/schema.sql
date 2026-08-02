-- Run this once in your Supabase project's SQL editor
-- (Project: cdybgeqvnaxcgwzmjoai)

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

create table if not exists feeding_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets on delete cascade not null,
  grams numeric not null,
  label text not null,
  logged_at timestamptz default now()
);

alter table pets enable row level security;
alter table feeding_plans enable row level security;
alter table feeding_logs enable row level security;

create policy "Users manage their own pets"
  on pets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage plans for their own pets"
  on feeding_plans for all
  using (exists (select 1 from pets where pets.id = feeding_plans.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = feeding_plans.pet_id and pets.user_id = auth.uid()));

create policy "Users manage logs for their own pets"
  on feeding_logs for all
  using (exists (select 1 from pets where pets.id = feeding_logs.pet_id and pets.user_id = auth.uid()))
  with check (exists (select 1 from pets where pets.id = feeding_logs.pet_id and pets.user_id = auth.uid()));
