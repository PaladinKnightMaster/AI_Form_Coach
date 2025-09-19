-- Add Missing Data Structures (Ultra Safe Version)
-- This migration safely adds the missing tables and fields to complete the required data structure

-- 1. Add source field to foods table
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
COMMENT ON COLUMN public.foods.source IS 'Source of food data: manual, barcode, openfoodfacts, usda, etc.';

-- 2. Create programs table for structured plan storage
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    equipment_required TEXT[], -- Array of required equipment
    target_goals TEXT[], -- Array of target goals (strength, endurance, etc.)
    created_by UUID, -- Will add foreign key constraint after ensuring profiles table exists
    is_template BOOLEAN DEFAULT true, -- Templates can be used by multiple users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to programs table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'created_by' AND table_schema = 'public') THEN
        ALTER TABLE public.programs ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'is_template' AND table_schema = 'public') THEN
        ALTER TABLE public.programs ADD COLUMN is_template BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        ALTER TABLE public.programs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Create program_weeks table
CREATE TABLE IF NOT EXISTS public.program_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1),
    focus TEXT, -- e.g., "Strength Building", "Endurance", "Recovery"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, week_number)
);

-- 4. Create program_days table
CREATE TABLE IF NOT EXISTS public.program_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_week_id UUID NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
    day_name TEXT, -- e.g., "Monday", "Upper Body", "Rest Day"
    is_rest_day BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_week_id, day_number)
);

-- 5. Create day_blocks table (links to coach templates)
CREATE TABLE IF NOT EXISTS public.day_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_day_id UUID NOT NULL,
    block_order INTEGER NOT NULL DEFAULT 1,
    block_type TEXT NOT NULL CHECK (block_type IN ('warmup', 'main_workout', 'cooldown', 'accessory')),
    exercise_type TEXT CHECK (exercise_type IN ('squat', 'pushup', 'plank', 'custom')),
    template_id UUID, -- References coach templates or custom exercises
    sets INTEGER,
    reps INTEGER,
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to day_blocks table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'template_id' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN template_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'block_order' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN block_order INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'block_type' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN block_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'exercise_type' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN exercise_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'sets' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN sets INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'reps' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN reps INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'duration_seconds' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN duration_seconds INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'rest_seconds' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN rest_seconds INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'intensity' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN intensity TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'notes' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'created_at' AND table_schema = 'public') THEN
        ALTER TABLE public.day_blocks ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 6. Create unified readiness_day table
CREATE TABLE IF NOT EXISTS public.readiness_day (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    
    -- Manual inputs (from readiness_assessments)
    soreness_level INTEGER CHECK (soreness_level >= 0 AND soreness_level <= 10),
    fatigue_level INTEGER CHECK (fatigue_level >= 0 AND fatigue_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
    stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10),
    
    -- Health data inputs (from health_data)
    sleep_duration REAL, -- hours
    resting_heart_rate INTEGER, -- bpm
    hrv_average INTEGER, -- ms
    step_count INTEGER,
    training_load REAL,
    
    -- Computed readiness score (0-1)
    computed_readiness REAL CHECK (computed_readiness >= 0 AND computed_readiness <= 1),
    readiness_category TEXT CHECK (readiness_category IN ('poor', 'fair', 'good', 'excellent')),
    
    -- Metadata
    data_sources TEXT[], -- ['manual', 'healthkit', 'health_connect', 'google_fit']
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Add foreign key constraints safely
DO $$
BEGIN
    -- Add foreign key constraint for programs.created_by if profiles table exists and created_by column exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'created_by' AND table_schema = 'public') THEN
        -- Check if constraint doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_programs_created_by' AND table_name = 'programs') THEN
            ALTER TABLE public.programs ADD CONSTRAINT fk_programs_created_by 
                FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Add foreign key constraint for program_weeks.program_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_program_weeks_program_id' AND table_name = 'program_weeks') THEN
        ALTER TABLE public.program_weeks ADD CONSTRAINT fk_program_weeks_program_id 
            FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for program_days.program_week_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_program_days_program_week_id' AND table_name = 'program_days') THEN
        ALTER TABLE public.program_days ADD CONSTRAINT fk_program_days_program_week_id 
            FOREIGN KEY (program_week_id) REFERENCES public.program_weeks(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for day_blocks.program_day_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_day_blocks_program_day_id' AND table_name = 'day_blocks') THEN
        ALTER TABLE public.day_blocks ADD CONSTRAINT fk_day_blocks_program_day_id 
            FOREIGN KEY (program_day_id) REFERENCES public.program_days(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for readiness_day.user_id if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_readiness_day_user_id' AND table_name = 'readiness_day') THEN
            ALTER TABLE public.readiness_day ADD CONSTRAINT fk_readiness_day_user_id 
                FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create indexes for performance (only if columns exist)
DO $$
BEGIN
    -- Programs indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'created_by' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_programs_created_by ON public.programs(created_by);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'is_template' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_programs_is_template ON public.programs(is_template);
    END IF;
    
    -- Program weeks indexes
    CREATE INDEX IF NOT EXISTS idx_program_weeks_program_id ON public.program_weeks(program_id);
    
    -- Program days indexes
    CREATE INDEX IF NOT EXISTS idx_program_days_program_week_id ON public.program_days(program_week_id);
    
    -- Day blocks indexes
    CREATE INDEX IF NOT EXISTS idx_day_blocks_program_day_id ON public.day_blocks(program_day_id);
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_blocks' AND column_name = 'template_id' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_day_blocks_template_id ON public.day_blocks(template_id);
    END IF;
    
    -- Readiness day indexes
    CREATE INDEX IF NOT EXISTS idx_readiness_day_user_id ON public.readiness_day(user_id);
    CREATE INDEX IF NOT EXISTS idx_readiness_day_date ON public.readiness_day(date);
    CREATE INDEX IF NOT EXISTS idx_readiness_day_user_date ON public.readiness_day(user_id, date);
END $$;

-- Enable Row Level Security
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_day ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Programs are readable by all authenticated users" ON public.programs;
DROP POLICY IF EXISTS "Users can create programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON public.programs;
DROP POLICY IF EXISTS "Program weeks are readable by all authenticated users" ON public.program_weeks;
DROP POLICY IF EXISTS "Users can manage program weeks for their programs" ON public.program_weeks;
DROP POLICY IF EXISTS "Program days are readable by all authenticated users" ON public.program_days;
DROP POLICY IF EXISTS "Users can manage program days for their programs" ON public.program_days;
DROP POLICY IF EXISTS "Day blocks are readable by all authenticated users" ON public.day_blocks;
DROP POLICY IF EXISTS "Users can manage day blocks for their programs" ON public.day_blocks;
DROP POLICY IF EXISTS "Users can manage their own readiness data" ON public.readiness_day;

-- RLS Policies for programs
CREATE POLICY "Programs are readable by all authenticated users" ON public.programs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create programs" ON public.programs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own programs" ON public.programs
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own programs" ON public.programs
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for program_weeks
CREATE POLICY "Program weeks are readable by all authenticated users" ON public.program_weeks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage program weeks for their programs" ON public.program_weeks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.programs p 
            WHERE p.id = program_id AND p.created_by = auth.uid()
        )
    );

-- RLS Policies for program_days
CREATE POLICY "Program days are readable by all authenticated users" ON public.program_days
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage program days for their programs" ON public.program_days
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.program_weeks pw
            JOIN public.programs p ON p.id = pw.program_id
            WHERE pw.id = program_week_id AND p.created_by = auth.uid()
        )
    );

-- RLS Policies for day_blocks
CREATE POLICY "Day blocks are readable by all authenticated users" ON public.day_blocks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage day blocks for their programs" ON public.day_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.program_days pd
            JOIN public.program_weeks pw ON pw.id = pd.program_week_id
            JOIN public.programs p ON p.id = pw.program_id
            WHERE pd.id = program_day_id AND p.created_by = auth.uid()
        )
    );

-- RLS Policies for readiness_day
CREATE POLICY "Users can manage their own readiness data" ON public.readiness_day
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
CREATE TRIGGER update_programs_updated_at 
    BEFORE UPDATE ON public.programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_programs_updated_at();

CREATE OR REPLACE FUNCTION update_readiness_day_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_readiness_day_updated_at ON public.readiness_day;
CREATE TRIGGER update_readiness_day_updated_at 
    BEFORE UPDATE ON public.readiness_day 
    FOR EACH ROW 
    EXECUTE FUNCTION update_readiness_day_updated_at();

-- Function to calculate readiness score from all inputs
-- Drop all versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS calculate_readiness_score CASCADE;
CREATE OR REPLACE FUNCTION calculate_readiness_score(
    p_soreness INTEGER,
    p_fatigue INTEGER,
    p_sleep_quality INTEGER,
    p_stress INTEGER,
    p_motivation INTEGER,
    p_sleep_duration REAL,
    p_resting_hr INTEGER,
    p_hrv INTEGER,
    p_steps INTEGER,
    p_training_load REAL
)
RETURNS REAL AS $$
DECLARE
    manual_score REAL;
    health_score REAL;
    final_score REAL;
BEGIN
    -- Calculate manual assessment score (0-1, higher is better)
    IF p_soreness IS NOT NULL AND p_fatigue IS NOT NULL AND p_sleep_quality IS NOT NULL 
       AND p_stress IS NOT NULL AND p_motivation IS NOT NULL THEN
        manual_score := (
            (10 - p_soreness) + (10 - p_fatigue) + p_sleep_quality + 
            (10 - p_stress) + p_motivation
        ) / 50.0; -- Normalize to 0-1
    ELSE
        manual_score := 0.5; -- Neutral if missing
    END IF;
    
    -- Calculate health data score (0-1, higher is better)
    health_score := 0.5; -- Start neutral
    
    -- Sleep duration scoring (7-9 hours optimal)
    IF p_sleep_duration IS NOT NULL THEN
        IF p_sleep_duration >= 7 AND p_sleep_duration <= 9 THEN
            health_score := health_score + 0.2;
        ELSIF p_sleep_duration >= 6 AND p_sleep_duration <= 10 THEN
            health_score := health_score + 0.1;
        END IF;
    END IF;
    
    -- Resting HR scoring (lower is better, assuming 60-80 bpm normal)
    IF p_resting_hr IS NOT NULL THEN
        IF p_resting_hr <= 60 THEN
            health_score := health_score + 0.2;
        ELSIF p_resting_hr <= 70 THEN
            health_score := health_score + 0.15;
        ELSIF p_resting_hr <= 80 THEN
            health_score := health_score + 0.1;
        END IF;
    END IF;
    
    -- HRV scoring (higher is better)
    IF p_hrv IS NOT NULL THEN
        IF p_hrv >= 50 THEN
            health_score := health_score + 0.2;
        ELSIF p_hrv >= 30 THEN
            health_score := health_score + 0.1;
        END IF;
    END IF;
    
    -- Steps scoring (8000+ steps good)
    IF p_steps IS NOT NULL THEN
        IF p_steps >= 10000 THEN
            health_score := health_score + 0.2;
        ELSIF p_steps >= 8000 THEN
            health_score := health_score + 0.15;
        ELSIF p_steps >= 5000 THEN
            health_score := health_score + 0.1;
        END IF;
    END IF;
    
    -- Training load scoring (moderate is optimal)
    IF p_training_load IS NOT NULL THEN
        IF p_training_load >= 50 AND p_training_load <= 150 THEN
            health_score := health_score + 0.2;
        ELSIF p_training_load >= 25 AND p_training_load <= 200 THEN
            health_score := health_score + 0.1;
        END IF;
    END IF;
    
    -- Combine manual and health scores (weighted average)
    final_score := (manual_score * 0.6) + (health_score * 0.4);
    
    -- Clamp between 0 and 1
    RETURN LEAST(GREATEST(final_score, 0), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get readiness category from score
-- Drop all versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS get_readiness_category CASCADE;
CREATE OR REPLACE FUNCTION get_readiness_category(p_score REAL)
RETURNS TEXT AS $$
BEGIN
    IF p_score >= 0.8 THEN
        RETURN 'excellent';
    ELSIF p_score >= 0.6 THEN
        RETURN 'good';
    ELSIF p_score >= 0.4 THEN
        RETURN 'fair';
    ELSE
        RETURN 'poor';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.programs IS 'Stores workout programs with structured week/day/block hierarchy';
COMMENT ON TABLE public.program_weeks IS 'Stores individual weeks within programs';
COMMENT ON TABLE public.program_days IS 'Stores individual days within program weeks';
COMMENT ON TABLE public.day_blocks IS 'Stores workout blocks within program days, links to coach templates';
COMMENT ON TABLE public.readiness_day IS 'Unified table for daily readiness assessment combining manual and health data';
COMMENT ON COLUMN public.foods.source IS 'Source of food data: manual, barcode, openfoodfacts, usda, etc.';
COMMENT ON FUNCTION calculate_readiness_score IS 'Calculates readiness score (0-1) from manual and health inputs';
COMMENT ON FUNCTION get_readiness_category IS 'Converts readiness score to category (poor/fair/good/excellent)';
