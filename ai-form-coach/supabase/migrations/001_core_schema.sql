-- =====================================================
-- CORE SCHEMA
-- Basic tables and foundational structure
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
