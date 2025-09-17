-- GOALS AND TARGETS SCHEMA
-- Add user goals and daily targets for nutrition tracking

-- User goals table - stores default targets for each user
create table if not exists public.user_goals (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	-- Daily targets
	calorie_target integer not null default 2000,
	protein_target real not null default 150.0, -- grams
	carbs_target real not null default 250.0, -- grams
	fat_target real not null default 65.0, -- grams
	fiber_target real not null default 25.0, -- grams
	sugar_target real not null default 50.0, -- grams
	sodium_target real not null default 2300.0, -- mg
	-- Goal settings
	goal_type text default 'maintenance', -- maintenance, weight_loss, weight_gain, muscle_gain
	activity_level text default 'moderate', -- sedentary, light, moderate, active, very_active
	-- Metadata
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	-- Ensure one goal per user
	constraint user_goals_user_id_unique unique (user_id)
);

-- Daily goal overrides table - allows users to set different targets for specific days
create table if not exists public.daily_goal_overrides (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	date date not null,
	-- Override targets (null means use default from user_goals)
	calorie_target integer,
	protein_target real,
	carbs_target real,
	fat_target real,
	fiber_target real,
	sugar_target real,
	sodium_target real,
	-- Override reason/note
	note text,
	-- Metadata
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	-- Ensure one override per user per day
	constraint daily_goal_overrides_user_date_unique unique (user_id, date)
);

-- Goal achievements table - tracks when users meet their daily goals
create table if not exists public.goal_achievements (
	id uuid primary key default uuid_generate_v4(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	date date not null,
	-- Achievement flags
	calorie_goal_met boolean default false,
	protein_goal_met boolean default false,
	carbs_goal_met boolean default false,
	fat_goal_met boolean default false,
	fiber_goal_met boolean default false,
	sugar_goal_met boolean default false,
	sodium_goal_met boolean default false,
	-- Overall achievement
	all_goals_met boolean default false,
	-- Metadata
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	-- Ensure one achievement record per user per day
	constraint goal_achievements_user_date_unique unique (user_id, date)
);

-- Indexes for performance
create index if not exists user_goals_user_id_idx on public.user_goals (user_id);
create index if not exists daily_goal_overrides_user_date_idx on public.daily_goal_overrides (user_id, date desc);
create index if not exists goal_achievements_user_date_idx on public.goal_achievements (user_id, date desc);
create index if not exists goal_achievements_all_goals_met_idx on public.goal_achievements (user_id, all_goals_met, date desc);

-- Enable RLS
alter table public.user_goals enable row level security;
alter table public.daily_goal_overrides enable row level security;
alter table public.goal_achievements enable row level security;

-- RLS Policies
-- User goals - users can only access their own goals
create policy user_goals_select_own on public.user_goals for select using (user_id = auth.uid());
create policy user_goals_cud_own on public.user_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Daily goal overrides - users can only access their own overrides
create policy daily_goal_overrides_select_own on public.daily_goal_overrides for select using (user_id = auth.uid());
create policy daily_goal_overrides_cud_own on public.daily_goal_overrides for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Goal achievements - users can only access their own achievements
create policy goal_achievements_select_own on public.goal_achievements for select using (user_id = auth.uid());
create policy goal_achievements_cud_own on public.goal_achievements for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Function to get effective daily targets (considers overrides)
create or replace function get_effective_daily_targets(p_user_id uuid, p_date date)
returns table (
	calorie_target integer,
	protein_target real,
	carbs_target real,
	fat_target real,
	fiber_target real,
	sugar_target real,
	sodium_target real
) as $$
begin
	return query
	select 
		coalesce(dgo.calorie_target, ug.calorie_target) as calorie_target,
		coalesce(dgo.protein_target, ug.protein_target) as protein_target,
		coalesce(dgo.carbs_target, ug.carbs_target) as carbs_target,
		coalesce(dgo.fat_target, ug.fat_target) as fat_target,
		coalesce(dgo.fiber_target, ug.fiber_target) as fiber_target,
		coalesce(dgo.sugar_target, ug.sugar_target) as sugar_target,
		coalesce(dgo.sodium_target, ug.sodium_target) as sodium_target
	from public.user_goals ug
	left join public.daily_goal_overrides dgo on dgo.user_id = ug.user_id and dgo.date = p_date
	where ug.user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Function to calculate and update goal achievements for a specific date
create or replace function update_goal_achievements(p_user_id uuid, p_date date)
returns void as $$
declare
	effective_targets record;
	daily_totals record;
begin
	-- Get effective targets for the date
	select * into effective_targets from get_effective_daily_targets(p_user_id, p_date);
	
	-- Get daily totals for the date - try materialized view first, then fallback to calculation
	begin
		select * into daily_totals from public.daily_totals where user_id = p_user_id and date = p_date;
	exception when undefined_table then
		-- If daily_totals view doesn't exist, calculate from meals directly
		select * into daily_totals from calculate_daily_totals(p_user_id, p_date);
	end;
	
	-- If no daily totals, set all achievements to false
	if daily_totals is null then
		insert into public.goal_achievements (
			user_id, date, 
			calorie_goal_met, protein_goal_met, carbs_goal_met, fat_goal_met,
			fiber_goal_met, sugar_goal_met, sodium_goal_met, all_goals_met
		) values (
			p_user_id, p_date,
			false, false, false, false, false, false, false, false
		) on conflict (user_id, date) do update set
			calorie_goal_met = false,
			protein_goal_met = false,
			carbs_goal_met = false,
			fat_goal_met = false,
			fiber_goal_met = false,
			sugar_goal_met = false,
			sodium_goal_met = false,
			all_goals_met = false,
			updated_at = now();
		return;
	end if;
	
	-- Calculate achievements
	insert into public.goal_achievements (
		user_id, date,
		calorie_goal_met, protein_goal_met, carbs_goal_met, fat_goal_met,
		fiber_goal_met, sugar_goal_met, sodium_goal_met, all_goals_met
	) values (
		p_user_id, p_date,
		coalesce(daily_totals.total_calories, 0) >= effective_targets.calorie_target,
		coalesce(daily_totals.total_protein, 0) >= effective_targets.protein_target,
		coalesce(daily_totals.total_carbs, 0) >= effective_targets.carbs_target,
		coalesce(daily_totals.total_fat, 0) >= effective_targets.fat_target,
		coalesce(daily_totals.total_fiber, 0) >= effective_targets.fiber_target,
		coalesce(daily_totals.total_sugar, 0) <= effective_targets.sugar_target, -- Sugar is a limit, not a target
		coalesce(daily_totals.total_sodium, 0) <= effective_targets.sodium_target, -- Sodium is a limit, not a target
		-- All goals met if calories, protein, carbs, fat, and fiber are met, and sugar/sodium are within limits
		coalesce(daily_totals.total_calories, 0) >= effective_targets.calorie_target and
		coalesce(daily_totals.total_protein, 0) >= effective_targets.protein_target and
		coalesce(daily_totals.total_carbs, 0) >= effective_targets.carbs_target and
		coalesce(daily_totals.total_fat, 0) >= effective_targets.fat_target and
		coalesce(daily_totals.total_fiber, 0) >= effective_targets.fiber_target and
		coalesce(daily_totals.total_sugar, 0) <= effective_targets.sugar_target and
		coalesce(daily_totals.total_sodium, 0) <= effective_targets.sodium_target
	) on conflict (user_id, date) do update set
		calorie_goal_met = coalesce(daily_totals.total_calories, 0) >= effective_targets.calorie_target,
		protein_goal_met = coalesce(daily_totals.total_protein, 0) >= effective_targets.protein_target,
		carbs_goal_met = coalesce(daily_totals.total_carbs, 0) >= effective_targets.carbs_target,
		fat_goal_met = coalesce(daily_totals.total_fat, 0) >= effective_targets.fat_target,
		fiber_goal_met = coalesce(daily_totals.total_fiber, 0) >= effective_targets.fiber_target,
		sugar_goal_met = coalesce(daily_totals.total_sugar, 0) <= effective_targets.sugar_target,
		sodium_goal_met = coalesce(daily_totals.total_sodium, 0) <= effective_targets.sodium_target,
		all_goals_met = coalesce(daily_totals.total_calories, 0) >= effective_targets.calorie_target and
		coalesce(daily_totals.total_protein, 0) >= effective_targets.protein_target and
		coalesce(daily_totals.total_carbs, 0) >= effective_targets.carbs_target and
		coalesce(daily_totals.total_fat, 0) >= effective_targets.fat_target and
		coalesce(daily_totals.total_fiber, 0) >= effective_targets.fiber_target and
		coalesce(daily_totals.total_sugar, 0) <= effective_targets.sugar_target and
		coalesce(daily_totals.total_sodium, 0) <= effective_targets.sodium_target,
		updated_at = now();
end;
$$ language plpgsql security definer;

-- Function to calculate daily totals from meals and meal_items (fallback if materialized view doesn't exist)
create or replace function calculate_daily_totals(p_user_id uuid, p_date date)
returns table (
	total_calories real,
	total_protein real,
	total_carbs real,
	total_fat real,
	total_fiber real,
	total_sugar real,
	total_sodium real
) as $$
begin
	return query
	select 
		coalesce(sum(mi.calories), 0) as total_calories,
		coalesce(sum(mi.protein), 0) as total_protein,
		coalesce(sum(mi.carbs), 0) as total_carbs,
		coalesce(sum(mi.fat), 0) as total_fat,
		coalesce(sum(mi.fiber), 0) as total_fiber,
		coalesce(sum(mi.sugar), 0) as total_sugar,
		coalesce(sum(mi.sodium), 0) as total_sodium
	from public.meals m
	left join public.meal_items mi on m.id = mi.meal_id
	where m.user_id = p_user_id and m.date = p_date;
end;
$$ language plpgsql security definer;

-- Function to get current streak for a user
create or replace function get_current_streak(p_user_id uuid)
returns integer as $$
declare
	streak_count integer := 0;
	check_date date := current_date;
begin
	-- Count consecutive days where all_goals_met is true, starting from today and going backwards
	while true loop
		if exists (
			select 1 from public.goal_achievements 
			where user_id = p_user_id and date = check_date and all_goals_met = true
		) then
			streak_count := streak_count + 1;
			check_date := check_date - interval '1 day';
		else
			exit;
		end if;
	end loop;
	
	return streak_count;
end;
$$ language plpgsql security definer;

-- Trigger to update goal achievements when daily totals change
create or replace function update_goal_achievements_on_totals_change()
returns trigger as $$
begin
	-- Update achievements for the affected user and date
	if TG_OP = 'DELETE' then
		perform update_goal_achievements(OLD.user_id, OLD.date);
	else
		perform update_goal_achievements(NEW.user_id, NEW.date);
	end if;
	
	return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Create trigger on daily_totals materialized view refresh
-- Note: This will be handled in the application layer since materialized views don't support triggers directly
