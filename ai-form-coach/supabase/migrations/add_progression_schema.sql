-- Progressive Overload and Readiness Assessment Schema (Fixed)
-- This migration safely adds tables for tracking workout progression and readiness assessments

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.readiness_assessments CASCADE;
DROP TABLE IF EXISTS public.workout_targets CASCADE;

-- Create readiness_assessments table
CREATE TABLE public.readiness_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    soreness_level INTEGER NOT NULL CHECK (soreness_level >= 0 AND soreness_level <= 10),
    fatigue_level INTEGER NOT NULL CHECK (fatigue_level >= 0 AND fatigue_level <= 10),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
    stress_level INTEGER NOT NULL CHECK (stress_level >= 0 AND stress_level <= 10),
    motivation_level INTEGER NOT NULL CHECK (motivation_level >= 0 AND motivation_level <= 10),
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_targets table
CREATE TABLE public.workout_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL CHECK (exercise IN ('squat', 'pushup', 'plank')),
    target_reps INTEGER,
    target_time_seconds INTEGER,
    intensity TEXT NOT NULL CHECK (intensity IN ('low', 'moderate', 'high')),
    volume TEXT NOT NULL CHECK (volume IN ('low', 'moderate', 'high')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add quality tracking columns to sessions table if they don't exist
DO $$
BEGIN
    -- Add avg_rom_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'avg_rom_score'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN avg_rom_score REAL DEFAULT 0;
    END IF;

    -- Add avg_tempo_ms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'avg_tempo_ms'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN avg_tempo_ms INTEGER DEFAULT 0;
    END IF;

    -- Add quality_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'quality_score'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.sessions ADD COLUMN quality_score REAL DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_readiness_assessments_user_id ON public.readiness_assessments(user_id);
CREATE INDEX idx_readiness_assessments_date ON public.readiness_assessments(assessment_date);
CREATE INDEX idx_workout_targets_user_id ON public.workout_targets(user_id);
CREATE INDEX idx_workout_targets_exercise ON public.workout_targets(exercise);
CREATE INDEX idx_workout_targets_created_at ON public.workout_targets(created_at);

-- Enable Row Level Security
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for readiness_assessments
CREATE POLICY "Users can manage their own readiness assessments" ON public.readiness_assessments
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for workout_targets
CREATE POLICY "Users can manage their own workout targets" ON public.workout_targets
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger to update created_at timestamp for workout_targets
CREATE OR REPLACE FUNCTION update_workout_targets_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_targets_created_at 
    BEFORE INSERT ON public.workout_targets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_workout_targets_created_at();

-- Add trigger to update created_at timestamp for readiness_assessments
CREATE OR REPLACE FUNCTION update_readiness_assessments_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_readiness_assessments_created_at 
    BEFORE INSERT ON public.readiness_assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_readiness_assessments_created_at();

-- Create a function to calculate quality score from reps data
CREATE OR REPLACE FUNCTION calculate_session_quality_score(session_id UUID)
RETURNS REAL AS $$
DECLARE
    avg_rom REAL;
    tempo_consistency REAL;
    quality_score REAL;
BEGIN
    -- Calculate average ROM score from reps
    SELECT AVG(rom_score) INTO avg_rom
    FROM public.reps
    WHERE session_id = calculate_session_quality_score.session_id;
    
    -- Calculate tempo consistency (lower standard deviation = higher consistency)
    SELECT CASE 
        WHEN COUNT(*) > 1 THEN 
            1.0 - (STDDEV(avg_tempo_ms) / NULLIF(AVG(avg_tempo_ms), 0))
        ELSE 1.0
    END INTO tempo_consistency
    FROM public.reps
    WHERE session_id = calculate_session_quality_score.session_id
    AND avg_tempo_ms > 0;
    
    -- Combine ROM and tempo consistency (weighted average)
    quality_score := COALESCE(avg_rom, 0) * 0.7 + COALESCE(tempo_consistency, 0) * 0.3;
    
    RETURN LEAST(GREATEST(quality_score, 0), 1); -- Clamp between 0 and 1
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update quality scores when reps are added
CREATE OR REPLACE FUNCTION update_session_quality_metrics()
RETURNS TRIGGER AS $$
DECLARE
    session_exercise TEXT;
    avg_rom REAL;
    avg_tempo INTEGER;
    quality REAL;
BEGIN
    -- Get the exercise type for the session
    SELECT exercise INTO session_exercise
    FROM public.sessions
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    -- Calculate average ROM score
    SELECT AVG(rom_score) INTO avg_rom
    FROM public.reps
    WHERE session_id = COALESCE(NEW.session_id, OLD.session_id);
    
    -- Calculate average tempo (only for exercises that use tempo)
    IF session_exercise IN ('squat', 'pushup') THEN
        SELECT AVG(avg_tempo_ms)::INTEGER INTO avg_tempo
        FROM public.reps
        WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
        AND avg_tempo_ms > 0;
    ELSE
        avg_tempo := 0;
    END IF;
    
    -- Calculate quality score
    SELECT calculate_session_quality_score(COALESCE(NEW.session_id, OLD.session_id)) INTO quality;
    
    -- Update the session with calculated metrics
    UPDATE public.sessions
    SET 
        avg_rom_score = COALESCE(avg_rom, 0),
        avg_tempo_ms = COALESCE(avg_tempo, 0),
        quality_score = COALESCE(quality, 0)
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update session quality metrics when reps change
DROP TRIGGER IF EXISTS update_session_quality_metrics_trigger ON public.reps;
CREATE TRIGGER update_session_quality_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reps
    FOR EACH ROW
    EXECUTE FUNCTION update_session_quality_metrics();

-- Add comments for documentation
COMMENT ON TABLE public.readiness_assessments IS 'Stores user readiness assessments for workout intensity adjustment';
COMMENT ON TABLE public.workout_targets IS 'Stores workout targets generated by progressive overload engine';
COMMENT ON COLUMN public.readiness_assessments.soreness_level IS 'Muscle soreness level (0-10 scale)';
COMMENT ON COLUMN public.readiness_assessments.fatigue_level IS 'Fatigue level (0-10 scale)';
COMMENT ON COLUMN public.readiness_assessments.sleep_quality IS 'Sleep quality (0-10 scale)';
COMMENT ON COLUMN public.readiness_assessments.stress_level IS 'Stress level (0-10 scale)';
COMMENT ON COLUMN public.readiness_assessments.motivation_level IS 'Motivation level (0-10 scale)';
COMMENT ON COLUMN public.sessions.avg_rom_score IS 'Average range of motion score for the session (0-1 scale)';
COMMENT ON COLUMN public.sessions.avg_tempo_ms IS 'Average tempo in milliseconds for the session';
COMMENT ON COLUMN public.sessions.quality_score IS 'Overall quality score combining ROM and tempo consistency (0-1 scale)';
