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