-- =====================================================
-- POSE ANALYSIS SCHEMA
-- Form analysis, validation, and rep tracking
-- =====================================================

-- Add correctness and confidence columns to reps table
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS confidence REAL CHECK (confidence >= 0 AND confidence <= 1);

-- Add correct_rate column to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS correct_rate REAL DEFAULT 0 CHECK (correct_rate >= 0 AND correct_rate <= 1);

-- Add device calibration columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS device_calibration JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS calibration_quality REAL DEFAULT 0 CHECK (calibration_quality >= 0 AND calibration_quality <= 1);

-- Enhance reps schema with additional tracking
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS quality_score REAL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 1);
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS tempo REAL DEFAULT 0;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS peak_depth REAL DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reps_is_correct ON public.reps(is_correct);
CREATE INDEX IF NOT EXISTS idx_reps_confidence ON public.reps(confidence);
CREATE INDEX IF NOT EXISTS idx_reps_quality_score ON public.reps(quality_score);
CREATE INDEX IF NOT EXISTS idx_sessions_correct_rate ON public.sessions(correct_rate);
CREATE INDEX IF NOT EXISTS idx_sessions_calibration_quality ON public.sessions(calibration_quality);

-- Add comments for documentation
COMMENT ON COLUMN public.reps.is_correct IS 'Whether this rep was performed correctly (≥80% valid frames + no critical errors)';
COMMENT ON COLUMN public.reps.confidence IS 'Confidence score (0-1) based on error time vs rep time';
COMMENT ON COLUMN public.reps.quality_score IS 'Overall quality score for this rep (0-1)';
COMMENT ON COLUMN public.reps.tempo IS 'Tempo of the rep in seconds';
COMMENT ON COLUMN public.reps.peak_depth IS 'Peak depth achieved during the rep';
COMMENT ON COLUMN public.sessions.correct_rate IS 'Percentage of correct reps in this session (0-1)';
COMMENT ON COLUMN public.sessions.device_calibration IS 'Device calibration data and settings';
COMMENT ON COLUMN public.sessions.calibration_quality IS 'Quality of device calibration (0-1)';
