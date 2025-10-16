-- =====================================================
-- MIGRATION 003: COACHING SYSTEM
-- Coach cues, hints, and feedback delivery
-- =====================================================

-- Create coach_cues table for mentor cue system
CREATE TABLE IF NOT EXISTS public.coach_cues (
    key TEXT PRIMARY KEY,
    severity SMALLINT NOT NULL CHECK (severity >= 1 AND severity <= 5),
    short TEXT NOT NULL,
    long TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_cues_severity ON public.coach_cues(severity);
CREATE INDEX IF NOT EXISTS idx_coach_cues_key ON public.coach_cues(key);

-- Add comments for documentation
COMMENT ON TABLE public.coach_cues IS 'Coach cues for mentor system with priority and cooldown management';
COMMENT ON COLUMN public.coach_cues.key IS 'Unique cue identifier (e.g., knees_out, go_deeper)';
COMMENT ON COLUMN public.coach_cues.severity IS 'Cue priority level (1=low, 5=critical)';
COMMENT ON COLUMN public.coach_cues.short IS 'Short cue message for real-time display';
COMMENT ON COLUMN public.coach_cues.long IS 'Detailed explanation for post-session review';
