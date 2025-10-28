-- =====================================================
-- MIGRATION 00: AUTHENTICATION & CORE FOUNDATION
-- Users, programs, sessions, and basic infrastructure
-- =====================================================

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Add source field to foods table
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
COMMENT ON COLUMN public.foods.source IS 'Source of food data: manual, barcode, openfoodfacts, usda, etc.';

-- Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    plan TEXT DEFAULT 'free',
    plan_renews_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    ai_credits_used INTEGER DEFAULT 0,
    ai_credits_reset_at TIMESTAMPTZ,
    avatar_url TEXT
);

-- Add missing avatar_url column to profiles table (fixes activity feed error)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user''s avatar image.';

-- Create sessions table (core workout sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_reps INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    avg_tempo_ms INTEGER,
    avg_rom_score REAL,
    notes TEXT,
    goal_type TEXT,
    goal_value INTEGER,
    rpe INTEGER,
    device_info JSONB,
    avg_pose_quality REAL,
    quality_score REAL DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    integrity_score REAL,
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    avg_quality_score REAL,
    quality_distribution JSONB DEFAULT '{"excellent": 0, "good": 0, "fair": 0, "poor": 0}',
    total_errors INTEGER DEFAULT 0,
    error_rate REAL DEFAULT 0,
    consistency_score REAL,
    improvement_trend REAL,
    form_progression TEXT,
    correct_rate REAL DEFAULT 0,
    template_id UUID,
    verification_score REAL DEFAULT 0,
    verification_notes TEXT,
    device_calibration JSONB DEFAULT '{}'::jsonb,
    calibration_quality REAL DEFAULT 0
);

-- Create reps table (individual rep data)
CREATE TABLE IF NOT EXISTS public.reps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    idx INTEGER NOT NULL,
    start_ms INTEGER NOT NULL,
    end_ms INTEGER,
    peak_depth REAL,
    avg_tempo_ms INTEGER,
    rom_score REAL,
    cues TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    valid BOOLEAN DEFAULT true,
    duration_ms INTEGER,
    tempo TEXT,
    quality TEXT,
    quality_score REAL,
    errors JSONB DEFAULT '[]',
    error_count INTEGER DEFAULT 0,
    error_types JSONB DEFAULT '{}',
    exercise_metrics JSONB DEFAULT '{}',
    is_correct BOOLEAN,
    confidence REAL
);

-- Create programs table for structured plan storage
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

-- Add foreign key constraint for programs.created_by
ALTER TABLE public.programs ADD CONSTRAINT fk_programs_created_by 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =====================================================
-- CORE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sessions_core_performance ON public.sessions 
  (user_id, started_at DESC, ended_at) 
  WHERE ended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_template_id ON public.sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_verified ON public.sessions(verified);

-- =====================================================
-- SCHEMA & TABLE DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS 'Core schema for AI Form Coach application';
COMMENT ON TABLE public.programs IS 'Structured workout programs and templates';
COMMENT ON COLUMN public.sessions.template_id IS 'Reference to the program template used for this session';
COMMENT ON COLUMN public.sessions.verified IS 'Whether this session has been verified for quality';
COMMENT ON COLUMN public.sessions.verification_score IS 'Quality score for session verification (0-1)';
COMMENT ON COLUMN public.sessions.verification_notes IS 'Notes about session verification';

-- =====================================================
-- AUTHENTICATION FUNCTIONS
-- =====================================================

-- Function to check if user exists by email
CREATE OR REPLACE FUNCTION check_user_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM auth.users WHERE email = p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO authenticated;

-- Function to get user by email (for client-side checks)
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.email_confirmed_at
    FROM auth.users u
    WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;

-- =====================================================
-- PROFILE INTEGRITY TRIGGERS
-- =====================================================

-- Trigger to prevent duplicate profiles
CREATE OR REPLACE FUNCTION prevent_duplicate_profiles()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'Profile already exists for user %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_duplicate_profiles_trigger ON public.profiles;
CREATE TRIGGER prevent_duplicate_profiles_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_profiles();
