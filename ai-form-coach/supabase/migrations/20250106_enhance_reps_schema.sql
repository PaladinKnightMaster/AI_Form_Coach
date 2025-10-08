-- Enhance reps table to support enhanced form analysis metrics
-- This migration adds columns for the new RepMetric fields without breaking existing data

-- Add enhanced metrics columns to reps table
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS tempo TEXT CHECK (tempo IN ('fast', 'normal', 'slow'));
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS quality TEXT CHECK (quality IN ('excellent', 'good', 'fair', 'poor'));
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS quality_score REAL CHECK (quality_score >= 0 AND quality_score <= 100);

-- Add error tracking columns
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS errors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS error_types JSONB DEFAULT '{}'::jsonb;

-- Add exercise-specific metrics columns
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS exercise_metrics JSONB DEFAULT '{}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reps_quality_score ON public.reps(quality_score);
CREATE INDEX IF NOT EXISTS idx_reps_quality ON public.reps(quality);
CREATE INDEX IF NOT EXISTS idx_reps_tempo ON public.reps(tempo);
CREATE INDEX IF NOT EXISTS idx_reps_error_count ON public.reps(error_count);

-- Add comments for documentation
COMMENT ON COLUMN public.reps.duration_ms IS 'Rep duration in milliseconds';
COMMENT ON COLUMN public.reps.tempo IS 'Rep tempo classification: fast, normal, or slow';
COMMENT ON COLUMN public.reps.quality IS 'Overall rep quality: excellent, good, fair, or poor';
COMMENT ON COLUMN public.reps.quality_score IS 'Quality score from 0-100';
COMMENT ON COLUMN public.reps.errors IS 'Array of form errors detected during this rep';
COMMENT ON COLUMN public.reps.error_count IS 'Total number of errors in this rep';
COMMENT ON COLUMN public.reps.error_types IS 'Count of each error type in this rep';
COMMENT ON COLUMN public.reps.exercise_metrics IS 'Exercise-specific metrics (squat, pushup, plank data)';

-- Update sessions table to include enhanced session metrics
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS avg_quality_score REAL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS quality_distribution JSONB DEFAULT '{"excellent": 0, "good": 0, "fair": 0, "poor": 0}'::jsonb;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS total_errors INTEGER DEFAULT 0;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS error_rate REAL DEFAULT 0;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS consistency_score REAL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS improvement_trend REAL;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS form_progression TEXT CHECK (form_progression IN ('improving', 'stable', 'declining'));

-- Add indexes for session metrics
CREATE INDEX IF NOT EXISTS idx_sessions_avg_quality_score ON public.sessions(avg_quality_score);
CREATE INDEX IF NOT EXISTS idx_sessions_error_rate ON public.sessions(error_rate);
CREATE INDEX IF NOT EXISTS idx_sessions_consistency_score ON public.sessions(consistency_score);

-- Add comments for session metrics
COMMENT ON COLUMN public.sessions.avg_quality_score IS 'Average quality score across all reps (0-100)';
COMMENT ON COLUMN public.sessions.quality_distribution IS 'Distribution of rep qualities in this session';
COMMENT ON COLUMN public.sessions.total_errors IS 'Total number of form errors across all reps';
COMMENT ON COLUMN public.sessions.error_rate IS 'Average number of errors per rep';
COMMENT ON COLUMN public.sessions.consistency_score IS 'Form consistency score (0-100)';
COMMENT ON COLUMN public.sessions.improvement_trend IS 'Improvement trend (-1 to 1)';
COMMENT ON COLUMN public.sessions.form_progression IS 'Overall form progression: improving, stable, or declining';

-- Create a function to update session metrics when reps are inserted/updated
CREATE OR REPLACE FUNCTION update_session_metrics()
RETURNS TRIGGER AS $$
DECLARE
    session_id_val UUID;
    avg_quality REAL;
    quality_dist JSONB;
    total_errors_count INTEGER;
    error_rate_val REAL;
    consistency_score_val REAL;
    improvement_trend_val REAL;
    form_progression_val TEXT;
BEGIN
    -- Get session_id from the rep
    IF TG_OP = 'DELETE' THEN
        session_id_val := OLD.session_id;
    ELSE
        session_id_val := NEW.session_id;
    END IF;
    
    -- Calculate session metrics
    SELECT 
        COALESCE(AVG(quality_score), 0),
        jsonb_build_object(
            'excellent', SUM(CASE WHEN quality = 'excellent' THEN 1 ELSE 0 END),
            'good', SUM(CASE WHEN quality = 'good' THEN 1 ELSE 0 END),
            'fair', SUM(CASE WHEN quality = 'fair' THEN 1 ELSE 0 END),
            'poor', SUM(CASE WHEN quality = 'poor' THEN 1 ELSE 0 END)
        ),
        COALESCE(SUM(error_count), 0),
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(error_count), 0)::REAL / COUNT(*)
            ELSE 0
        END,
        -- Simplified consistency calculation (can be enhanced)
        CASE 
            WHEN COUNT(*) > 1 THEN 
                GREATEST(0, 100 - (STDDEV(quality_score) * 2))
            ELSE 100
        END,
        -- Simplified improvement trend (can be enhanced)
        CASE 
            WHEN COUNT(*) > 2 THEN
                LEAST(1, GREATEST(-1, 
                    (AVG(CASE WHEN idx > COUNT(*) * 0.7 THEN quality_score END) - 
                     AVG(CASE WHEN idx <= COUNT(*) * 0.3 THEN quality_score END)) / 10
                ))
            ELSE 0
        END
    INTO avg_quality, quality_dist, total_errors_count, error_rate_val, consistency_score_val, improvement_trend_val
    FROM public.reps 
    WHERE session_id = session_id_val;
    
    -- Determine form progression
    IF improvement_trend_val > 0.1 THEN
        form_progression_val := 'improving';
    ELSIF improvement_trend_val < -0.1 THEN
        form_progression_val := 'declining';
    ELSE
        form_progression_val := 'stable';
    END IF;
    
    -- Update session with calculated metrics
    UPDATE public.sessions 
    SET 
        avg_quality_score = avg_quality,
        quality_distribution = quality_dist,
        total_errors = total_errors_count,
        error_rate = error_rate_val,
        consistency_score = consistency_score_val,
        improvement_trend = improvement_trend_val,
        form_progression = form_progression_val
    WHERE id = session_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session metrics
DROP TRIGGER IF EXISTS trigger_update_session_metrics ON public.reps;
CREATE TRIGGER trigger_update_session_metrics
    AFTER INSERT OR UPDATE OR DELETE ON public.reps
    FOR EACH ROW
    EXECUTE FUNCTION update_session_metrics();
