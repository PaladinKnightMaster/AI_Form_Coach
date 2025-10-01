-- Health Data Integration Schema
-- This migration adds tables for storing health data from HealthKit, Health Connect, and manual input

-- Create health_data table with official data types
CREATE TABLE IF NOT EXISTS public.health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Sleep data (official types)
    sleep_sessions JSONB, -- SleepSession[] from Health Connect
    sleep_duration REAL DEFAULT 0, -- hours (calculated from sessions)
    sleep_efficiency REAL, -- percentage (calculated from sessions)
    
    -- Heart rate data (official types)
    heart_rate_samples JSONB, -- HeartRate[] from Health Connect
    resting_heart_rate INTEGER DEFAULT 0, -- bpm (calculated from samples)
    max_heart_rate INTEGER, -- bpm (calculated from samples)
    
    -- HRV data (official types)
    hrv_samples JSONB, -- HeartRateVariability[] from Health Connect
    hrv_average INTEGER, -- ms (calculated from samples)
    hrv_rmssd INTEGER, -- ms (calculated from samples)
    
    -- Activity data (official types)
    step_samples JSONB, -- Steps[] from Health Connect
    step_count INTEGER DEFAULT 0, -- steps (calculated from samples)
    active_minutes INTEGER DEFAULT 0, -- minutes (calculated from samples)
    distance_meters REAL DEFAULT 0, -- meters (calculated from samples)
    
    -- Workout data (official types)
    workout_sessions JSONB, -- WorkoutSession[] from Health Connect
    training_load REAL DEFAULT 0, -- arbitrary units (calculated from sessions)
    total_calories_burned REAL DEFAULT 0, -- kcal (calculated from sessions)
    
    -- Body measurements (official types)
    body_mass REAL, -- kg
    body_fat_percentage REAL, -- percentage
    
    -- Metadata
    data_sources TEXT[], -- ['HealthKit', 'Health Connect', 'Google Fit']
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    data_quality TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create health_baselines table with official data types
CREATE TABLE IF NOT EXISTS public.health_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Sleep baseline
    sleep_baseline REAL NOT NULL DEFAULT 8, -- hours
    sleep_efficiency_baseline REAL DEFAULT 85, -- percentage
    
    -- Heart rate baseline
    resting_hr_baseline INTEGER NOT NULL DEFAULT 60, -- bpm
    max_hr_baseline INTEGER DEFAULT 180, -- bpm (calculated as 220 - age)
    
    -- HRV baseline
    hrv_baseline INTEGER, -- ms (average)
    hrv_rmssd_baseline INTEGER, -- ms (RMSSD)
    
    -- Activity baseline
    step_baseline INTEGER NOT NULL DEFAULT 10000, -- steps
    active_minutes_baseline INTEGER DEFAULT 30, -- minutes
    distance_baseline REAL DEFAULT 8000, -- meters
    
    -- Workout baseline
    weekly_training_load_baseline REAL DEFAULT 100, -- arbitrary units
    weekly_calories_baseline REAL DEFAULT 2000, -- kcal
    
    -- Body measurements baseline
    body_mass_baseline REAL, -- kg
    body_fat_percentage_baseline REAL, -- percentage
    
    -- Metadata
    data_quality TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    calculation_method TEXT DEFAULT 'manual', -- 'manual', 'auto_calculated', 'ai_estimated'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON public.health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_date ON public.health_data(date);
CREATE INDEX IF NOT EXISTS idx_health_data_user_date ON public.health_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_baselines_user_id ON public.health_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_health_baselines_created_at ON public.health_baselines(created_at);

-- Enable Row Level Security
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_data
CREATE POLICY "Users can manage their own health data" ON public.health_data
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for health_baselines
CREATE POLICY "Users can manage their own health baselines" ON public.health_baselines
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp for health_data
CREATE OR REPLACE FUNCTION update_health_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_data_updated_at 
    BEFORE UPDATE ON public.health_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_health_data_updated_at();

-- Add trigger to update created_at timestamp for health_baselines
CREATE OR REPLACE FUNCTION update_health_baselines_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_baselines_created_at 
    BEFORE INSERT ON public.health_baselines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_health_baselines_created_at();

-- Create a function to calculate readiness score from health data
CREATE OR REPLACE FUNCTION calculate_health_readiness_score(
    p_user_id UUID,
    p_date DATE
)
RETURNS REAL AS $$
DECLARE
    health_record RECORD;
    baseline_record RECORD;
    sleep_score REAL;
    hr_score REAL;
    hrv_score REAL;
    steps_score REAL;
    training_load_score REAL;
    readiness_score REAL;
BEGIN
    -- Get health data for the date
    SELECT * INTO health_record
    FROM public.health_data
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Get latest baseline
    SELECT * INTO baseline_record
    FROM public.health_baselines
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no health data or baseline, return neutral score
    IF health_record IS NULL OR baseline_record IS NULL THEN
        RETURN 0.5;
    END IF;
    
    -- Calculate sleep score (0-1)
    IF health_record.sleep_duration > 0 AND baseline_record.sleep_baseline > 0 THEN
        DECLARE
            sleep_ratio REAL := health_record.sleep_duration / baseline_record.sleep_baseline;
        BEGIN
            IF sleep_ratio >= 0.9 AND sleep_ratio <= 1.1 THEN
                sleep_score := 1.0;
            ELSIF sleep_ratio >= 0.8 AND sleep_ratio <= 1.2 THEN
                sleep_score := 0.8;
            ELSIF sleep_ratio >= 0.7 AND sleep_ratio <= 1.3 THEN
                sleep_score := 0.6;
            ELSE
                sleep_score := GREATEST(0, 1 - ABS(sleep_ratio - 1) * 2);
            END IF;
        END;
    ELSE
        sleep_score := 0.5;
    END IF;
    
    -- Calculate heart rate score (0-1) - lower is better
    IF health_record.resting_heart_rate > 0 AND baseline_record.resting_hr_baseline > 0 THEN
        DECLARE
            hr_ratio REAL := health_record.resting_heart_rate::REAL / baseline_record.resting_hr_baseline::REAL;
        BEGIN
            IF hr_ratio <= 0.95 THEN
                hr_score := 1.0;
            ELSIF hr_ratio <= 1.05 THEN
                hr_score := 0.8;
            ELSIF hr_ratio <= 1.15 THEN
                hr_score := 0.6;
            ELSE
                hr_score := GREATEST(0, 1 - (hr_ratio - 1) * 3);
            END IF;
        END;
    ELSE
        hr_score := 0.5;
    END IF;
    
    -- Calculate HRV score (0-1) - higher is better
    IF health_record.hrv IS NOT NULL AND baseline_record.hrv_baseline IS NOT NULL THEN
        DECLARE
            hrv_ratio REAL := health_record.hrv::REAL / baseline_record.hrv_baseline::REAL;
        BEGIN
            IF hrv_ratio >= 1.1 THEN
                hrv_score := 1.0;
            ELSIF hrv_ratio >= 1.0 THEN
                hrv_score := 0.8;
            ELSIF hrv_ratio >= 0.9 THEN
                hrv_score := 0.6;
            ELSE
                hrv_score := GREATEST(0, hrv_ratio);
            END IF;
        END;
    ELSE
        hrv_score := 0.5;
    END IF;
    
    -- Calculate steps score (0-1)
    IF health_record.step_count > 0 AND baseline_record.step_baseline > 0 THEN
        DECLARE
            steps_ratio REAL := health_record.step_count::REAL / baseline_record.step_baseline::REAL;
        BEGIN
            IF steps_ratio >= 0.8 AND steps_ratio <= 1.2 THEN
                steps_score := 1.0;
            ELSIF steps_ratio >= 0.6 AND steps_ratio <= 1.4 THEN
                steps_score := 0.8;
            ELSIF steps_ratio >= 0.4 AND steps_ratio <= 1.6 THEN
                steps_score := 0.6;
            ELSE
                steps_score := GREATEST(0, 1 - ABS(steps_ratio - 1) * 1.5);
            END IF;
        END;
    ELSE
        steps_score := 0.5;
    END IF;
    
    -- Calculate training load score (0-1) - moderate is optimal
    IF health_record.training_load > 0 THEN
        DECLARE
            training_ratio REAL := health_record.training_load / 100.0; -- Assume 100 as baseline
        BEGIN
            IF training_ratio >= 0.7 AND training_ratio <= 1.3 THEN
                training_load_score := 1.0;
            ELSIF training_ratio >= 0.5 AND training_ratio <= 1.5 THEN
                training_load_score := 0.8;
            ELSIF training_ratio >= 0.3 AND training_ratio <= 1.7 THEN
                training_load_score := 0.6;
            ELSE
                training_load_score := GREATEST(0, 1 - ABS(training_ratio - 1) * 1.2);
            END IF;
        END;
    ELSE
        training_load_score := 0.5;
    END IF;
    
    -- Calculate weighted average
    readiness_score := (
        sleep_score * 0.3 +
        hr_score * 0.2 +
        hrv_score * 0.2 +
        steps_score * 0.15 +
        training_load_score * 0.15
    );
    
    -- Clamp between 0 and 1
    RETURN LEAST(GREATEST(readiness_score, 0), 1);
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Create a view for easy readiness score access
CREATE OR REPLACE VIEW public.health_readiness_scores
WITH (security_invoker = true)
AS
SELECT 
    hd.user_id,
    hd.date,
    hd.sleep_duration,
    hd.resting_heart_rate,
    hd.hrv,
    hd.step_count,
    hd.training_load,
    calculate_health_readiness_score(hd.user_id, hd.date) as readiness_score,
    CASE 
        WHEN calculate_health_readiness_score(hd.user_id, hd.date) >= 0.8 THEN 'excellent'
        WHEN calculate_health_readiness_score(hd.user_id, hd.date) >= 0.6 THEN 'good'
        WHEN calculate_health_readiness_score(hd.user_id, hd.date) >= 0.4 THEN 'fair'
        ELSE 'poor'
    END as readiness_category
FROM public.health_data hd;

-- Add comments for documentation
COMMENT ON TABLE public.health_data IS 'Stores daily health metrics from HealthKit, Health Connect, and manual input';
COMMENT ON TABLE public.health_baselines IS 'Stores user baseline health values for personalized readiness calculations';
COMMENT ON COLUMN public.health_data.sleep_duration IS 'Sleep duration in hours';
COMMENT ON COLUMN public.health_data.resting_heart_rate IS 'Resting heart rate in beats per minute';
COMMENT ON COLUMN public.health_data.hrv IS 'Heart rate variability in milliseconds';
COMMENT ON COLUMN public.health_data.step_count IS 'Daily step count';
COMMENT ON COLUMN public.health_data.training_load IS 'Training load in arbitrary units';
COMMENT ON FUNCTION calculate_health_readiness_score IS 'Calculates readiness score (0-1) from health data and baseline';
COMMENT ON VIEW public.health_readiness_scores IS 'View providing health data with calculated readiness scores and categories';
