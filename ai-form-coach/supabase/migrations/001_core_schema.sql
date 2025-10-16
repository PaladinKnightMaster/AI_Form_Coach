-- =====================================================
-- MIGRATION 001: CORE FOUNDATION
-- Users, sessions, programs, and basic infrastructure
-- =====================================================

-- Add source field to foods table
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
COMMENT ON COLUMN public.foods.source IS 'Source of food data: manual, barcode, openfoodfacts, usda, etc.';

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

-- Add template_id column to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.programs(id);

-- Add session verification columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS verification_score REAL DEFAULT 0;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Core indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_core_performance ON public.sessions 
  (user_id, started_at DESC, ended_at) 
  WHERE ended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_template_id ON public.sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_verified ON public.sessions(verified);

-- Core comments
COMMENT ON SCHEMA public IS 'Core schema for AI Form Coach application';
COMMENT ON TABLE public.programs IS 'Structured workout programs and templates';
COMMENT ON COLUMN public.sessions.template_id IS 'Reference to the program template used for this session';
COMMENT ON COLUMN public.sessions.verified IS 'Whether this session has been verified for quality';
COMMENT ON COLUMN public.sessions.verification_score IS 'Quality score for session verification (0-1)';
COMMENT ON COLUMN public.sessions.verification_notes IS 'Notes about session verification';

-- =====================================================
-- EMAIL UNIQUENESS & PROFILE INTEGRITY
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