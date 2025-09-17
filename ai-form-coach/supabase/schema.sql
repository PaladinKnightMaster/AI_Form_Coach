-- SCHEMA
create extension if not exists "uuid-ossp";

create type exercise_type as enum ('squat','pushup','plank');

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	username text unique,
	created_at timestamptz default now()
);

create table if not exists public.device_calibration (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	device_label text,
	shoulder_len real,
	hip_len real,
	thigh_len real,
	created_at timestamptz default now()
);

create table if not exists public.sessions (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	exercise exercise_type not null,
	started_at timestamptz not null default now(),
	ended_at timestamptz,
	total_reps integer default 0,
	total_time_seconds integer default 0,
	avg_tempo_ms integer,
	avg_rom_score real,
	notes text
);

create table if not exists public.reps (
	id uuid primary key default uuid_generate_v4(),
	session_id uuid not null references public.sessions(id) on delete cascade,
	idx integer not null,
	start_ms integer not null,
	end_ms integer not null,
	peak_depth real,
	avg_tempo_ms integer,
	rom_score real,
	cues text[],
	created_at timestamptz default now()
);

create table if not exists public.feedback (
	id uuid primary key default uuid_generate_v4(),
	session_id uuid not null references public.sessions(id) on delete cascade,
	kind text not null,
	message text not null,
	created_at timestamptz default now()
);

-- Indexes
create index if not exists sessions_user_started_idx on public.sessions (user_id, started_at desc);
create unique index if not exists reps_session_idx_idx on public.reps (session_id, idx);

-- RLS
alter table public.profiles enable row level security;
alter table public.device_calibration enable row level security;
alter table public.sessions enable row level security;
alter table public.reps enable row level security;
alter table public.feedback enable row level security;

create policy if not exists profiles_select_own on public.profiles for select using (id = auth.uid());
create policy if not exists profiles_insert_self on public.profiles for insert with check (id = auth.uid());
create policy if not exists profiles_update_self on public.profiles for update using (id = auth.uid());

create policy if not exists cal_select_own on public.device_calibration for select using (user_id = auth.uid());
create policy if not exists cal_cud_own on public.device_calibration for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists sessions_select_own on public.sessions for select using (user_id = auth.uid());
create policy if not exists sessions_cud_own on public.sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists reps_select_own on public.reps for select using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy if not exists reps_cud_own on public.reps for all using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy if not exists fb_select_own on public.feedback for select using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy if not exists fb_cud_own on public.feedback for all using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));

-- Additive columns for new features
alter table public.sessions add column if not exists goal_type text;
alter table public.sessions add column if not exists goal_value integer;
alter table public.sessions add column if not exists rpe integer check (rpe between 1 and 10);
alter table public.sessions add column if not exists device_info jsonb;
alter table public.sessions add column if not exists avg_pose_quality real;

alter table public.reps add column if not exists valid boolean default true;

-- Events table for lightweight observability
create table if not exists public.events (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid references public.profiles(id) on delete set null,
	name text not null,
	payload jsonb,
	session_id uuid references public.sessions(id) on delete set null,
	created_at timestamptz default now()
);

alter table public.events enable row level security;

create index if not exists events_user_created_idx on public.events (user_id, created_at desc);

drop policy if exists events_select_own on public.events;
create policy events_select_own on public.events for select using (user_id = auth.uid());
drop policy if exists events_insert_self_or_anon on public.events;
create policy events_insert_self_or_anon on public.events for insert with check (user_id = auth.uid() or user_id is null); 

-- Public aggregate metrics (sitewide; anon-readable)
create table if not exists public.metrics_public (
	id integer primary key default 1,
	updated_at timestamptz default now(),
	avg_session_minutes integer default 0,
	total_reps_counted bigint default 0,
	rom_improved_pct integer default 0
);

alter table public.metrics_public enable row level security;

-- Anyone can read
drop policy if exists metrics_public_select on public.metrics_public;
create policy metrics_public_select on public.metrics_public for select using (true);
-- Only service role can write
drop policy if exists metrics_public_write_service on public.metrics_public;
create policy metrics_public_write_service on public.metrics_public for all
	using (auth.role() = 'service_role') with check (auth.role() = 'service_role'); 

-- Billing columns on profiles
alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists plan_renews_at timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;

-- NUTRITION TRACKING SCHEMA

create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- Foods table - master food database
create table if not exists public.foods (
	id uuid primary key default uuid_generate_v4(),
	barcode text unique,
	name text not null,
	brand text,
	category text, -- Food category (fruits, vegetables, protein, etc.)
	-- Macros per 100g
	calories_per_100g real not null default 0,
	protein_per_100g real not null default 0,
	carbs_per_100g real not null default 0,
	fat_per_100g real not null default 0,
	fiber_per_100g real not null default 0,
	sugar_per_100g real not null default 0,
	sodium_per_100g real not null default 0, -- mg
	-- Metadata
	verified boolean default false,
	created_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Meals table - user's meal sessions
create table if not exists public.meals (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	date date not null,
	meal_type meal_type not null,
	name text, -- Optional custom meal name
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Meal items - foods consumed in meals with quantities
create table if not exists public.meal_items (
	id uuid primary key default uuid_generate_v4(),
	meal_id uuid not null references public.meals(id) on delete cascade,
	food_id uuid not null references public.foods(id) on delete cascade,
	grams real not null default 0,
	-- Computed macros (denormalized for performance)
	calories real not null default 0,
	protein real not null default 0,
	carbs real not null default 0,
	fat real not null default 0,
	fiber real not null default 0,
	sugar real not null default 0,
	sodium real not null default 0,
	created_at timestamptz default now()
);

-- Daily totals materialized view for performance
create materialized view if not exists public.daily_totals as
select 
	m.user_id,
	m.date,
	sum(mi.calories) as total_calories,
	sum(mi.protein) as total_protein,
	sum(mi.carbs) as total_carbs,
	sum(mi.fat) as total_fat,
	sum(mi.fiber) as total_fiber,
	sum(mi.sugar) as total_sugar,
	sum(mi.sodium) as total_sodium,
	count(distinct m.id) as meal_count,
	count(mi.id) as item_count
from public.meals m
left join public.meal_items mi on m.id = mi.meal_id
group by m.user_id, m.date;

-- Indexes for nutrition tables
create index if not exists foods_barcode_idx on public.foods (barcode);
create index if not exists foods_name_idx on public.foods using gin (to_tsvector('english', name || ' ' || coalesce(brand, '')));
create index if not exists meals_user_date_idx on public.meals (user_id, date desc);
create index if not exists meals_user_date_type_idx on public.meals (user_id, date, meal_type);
drop index if exists meals_user_date_type_unique_idx;
create unique index meals_user_date_type_unique_idx on public.meals (user_id, date, meal_type) where name is null;
create index if not exists meal_items_meal_idx on public.meal_items (meal_id);
create index if not exists daily_totals_user_date_idx on public.daily_totals (user_id, date desc);

-- RLS for nutrition tables
alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

-- Foods policies - anyone can read, authenticated users can create
drop policy if exists foods_select_all on public.foods;
create policy foods_select_all on public.foods for select using (true);

drop policy if exists foods_insert_auth on public.foods;
create policy foods_insert_auth on public.foods for insert with check (auth.uid() is not null);

drop policy if exists foods_update_creator on public.foods;
create policy foods_update_creator on public.foods for update using (created_by = auth.uid());

-- Meals policies - users can only access their own meals
drop policy if exists meals_select_own on public.meals;
create policy meals_select_own on public.meals for select using (user_id = auth.uid());

drop policy if exists meals_cud_own on public.meals;
create policy meals_cud_own on public.meals for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Meal items policies - users can only access meal items for their meals
drop policy if exists meal_items_select_own on public.meal_items;
create policy meal_items_select_own on public.meal_items 
	for select using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));

drop policy if exists meal_items_cud_own on public.meal_items;
create policy meal_items_cud_own on public.meal_items 
	for all using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid())) 
	with check (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));

-- Function to refresh daily totals
create or replace function refresh_daily_totals()
returns void as $$
begin
	refresh materialized view public.daily_totals;
end;
$$ language plpgsql security definer;

-- Function to calculate macros for meal items
create or replace function calculate_meal_item_macros()
returns trigger as $$
begin
	-- Calculate macros based on grams and food nutritional data
	select 
		(NEW.grams / 100.0) * f.calories_per_100g,
		(NEW.grams / 100.0) * f.protein_per_100g,
		(NEW.grams / 100.0) * f.carbs_per_100g,
		(NEW.grams / 100.0) * f.fat_per_100g,
		(NEW.grams / 100.0) * f.fiber_per_100g,
		(NEW.grams / 100.0) * f.sugar_per_100g,
		(NEW.grams / 100.0) * f.sodium_per_100g
	into 
		NEW.calories,
		NEW.protein,
		NEW.carbs,
		NEW.fat,
		NEW.fiber,
		NEW.sugar,
		NEW.sodium
	from public.foods f
	where f.id = NEW.food_id;
	
	return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-calculate macros on meal item insert/update
drop trigger if exists calculate_meal_item_macros_trigger on public.meal_items;
create trigger calculate_meal_item_macros_trigger
	before insert or update on public.meal_items
	for each row execute function calculate_meal_item_macros();

-- Trigger to refresh daily totals when meal items change
create or replace function refresh_daily_totals_on_change()
returns trigger as $$
begin
	perform refresh_daily_totals();
	return coalesce(NEW, OLD);
end;
$$ language plpgsql;

drop trigger if exists refresh_daily_totals_trigger on public.meal_items;
create trigger refresh_daily_totals_trigger
	after insert or update or delete on public.meal_items
	for each statement execute function refresh_daily_totals_on_change(); 