-- Add correctness and confidence columns to reps table
-- This migration adds the A4 correctness evaluation columns

-- Add correctness evaluation columns to reps table
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE public.reps ADD COLUMN IF NOT EXISTS confidence REAL CHECK (confidence >= 0 AND confidence <= 1);

-- Add correct_rate column to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS correct_rate REAL DEFAULT 0 CHECK (correct_rate >= 0 AND correct_rate <= 1);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reps_is_correct ON public.reps(is_correct);
CREATE INDEX IF NOT EXISTS idx_reps_confidence ON public.reps(confidence);
CREATE INDEX IF NOT EXISTS idx_sessions_correct_rate ON public.sessions(correct_rate);

-- Add comments for documentation
COMMENT ON COLUMN public.reps.is_correct IS 'Whether this rep was performed correctly (≥80% valid frames + no critical errors)';
COMMENT ON COLUMN public.reps.confidence IS 'Confidence score (0-1) based on error time vs rep time';
COMMENT ON COLUMN public.sessions.correct_rate IS 'Percentage of correct reps in this session (0-1)';

-- Update the session metrics function to include correct_rate calculation
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
    correct_rate_val REAL;
BEGIN
    -- Get session_id from the rep
    IF TG_OP = 'DELETE' THEN
        session_id_val := OLD.session_id;
    ELSE
        session_id_val := NEW.session_id;
    END IF;
    
    -- Calculate session metrics including correct_rate
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
        END,
        -- Calculate correct_rate
        CASE 
            WHEN COUNT(*) > 0 THEN 
                SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END)::REAL / COUNT(*)
            ELSE 0
        END
    INTO avg_quality, quality_dist, total_errors_count, error_rate_val, consistency_score_val, improvement_trend_val, correct_rate_val
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
    
    -- Update session with calculated metrics including correct_rate
    UPDATE public.sessions 
    SET 
        avg_quality_score = avg_quality,
        quality_distribution = quality_dist,
        total_errors = total_errors_count,
        error_rate = error_rate_val,
        consistency_score = consistency_score_val,
        improvement_trend = improvement_trend_val,
        form_progression = form_progression_val,
        correct_rate = correct_rate_val
    WHERE id = session_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
