-- Movement Embeddings Schema
-- This migration adds tables for storing movement feature vectors and similarity search

-- Create session_embeddings table for storing feature vectors
CREATE TABLE IF NOT EXISTS public.session_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise exercise_type NOT NULL,
    
    -- Feature vector (stored as JSONB for flexibility)
    feature_vector JSONB NOT NULL,
    
    -- Vector dimensions and metadata
    vector_dimensions INTEGER NOT NULL DEFAULT 30,
    vector_version TEXT NOT NULL DEFAULT '1.0',
    
    -- Session metadata for quick filtering
    total_reps INTEGER NOT NULL,
    avg_quality REAL NOT NULL,
    avg_rom REAL NOT NULL,
    session_duration INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_embeddings_user_id ON public.session_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_exercise ON public.session_embeddings(exercise);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_created_at ON public.session_embeddings(created_at);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_avg_quality ON public.session_embeddings(avg_quality);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_avg_rom ON public.session_embeddings(avg_rom);

-- Create GIN index for feature vector similarity search
CREATE INDEX IF NOT EXISTS idx_session_embeddings_feature_vector ON public.session_embeddings USING GIN (feature_vector);

-- Create unique constraint to prevent duplicate embeddings
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_embeddings_session_unique ON public.session_embeddings(session_id);

-- Enable RLS
ALTER TABLE public.session_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own embeddings" ON public.session_embeddings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own embeddings" ON public.session_embeddings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own embeddings" ON public.session_embeddings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own embeddings" ON public.session_embeddings
    FOR DELETE USING (user_id = auth.uid());

-- Create similarity search function
CREATE OR REPLACE FUNCTION public.find_similar_sessions(
    p_session_id UUID,
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5,
    p_min_similarity REAL DEFAULT 0.7,
    p_exercise exercise_type DEFAULT NULL
)
RETURNS TABLE (
    similar_session_id UUID,
    similarity REAL,
    exercise exercise_type,
    total_reps INTEGER,
    avg_quality REAL,
    avg_rom REAL,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    target_vector JSONB;
    target_exercise exercise_type;
BEGIN
    -- Get the target session's feature vector
    SELECT feature_vector, exercise INTO target_vector, target_exercise
    FROM public.session_embeddings
    WHERE session_id = p_session_id AND user_id = p_user_id;
    
    -- If no target vector found, return empty
    IF target_vector IS NULL THEN
        RETURN;
    END IF;
    
    -- If no exercise specified, use the target session's exercise
    IF p_exercise IS NULL THEN
        p_exercise := target_exercise;
    END IF;
    
    -- Find similar sessions using cosine similarity
    RETURN QUERY
    SELECT 
        se.session_id,
        -- Calculate cosine similarity (simplified version)
        CASE 
            WHEN se.feature_vector = target_vector THEN 1.0
            ELSE 0.8 -- Placeholder for actual cosine similarity calculation
        END as similarity,
        se.exercise,
        se.total_reps,
        se.avg_quality,
        se.avg_rom,
        se.created_at
    FROM public.session_embeddings se
    WHERE se.user_id = p_user_id
        AND se.session_id != p_session_id
        AND (p_exercise IS NULL OR se.exercise = p_exercise)
    ORDER BY similarity DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's best session for comparison
CREATE OR REPLACE FUNCTION public.get_user_best_session(
    p_user_id UUID,
    p_exercise exercise_type
)
RETURNS TABLE (
    session_id UUID,
    total_reps INTEGER,
    avg_quality REAL,
    avg_rom REAL,
    created_at TIMESTAMPTZ,
    is_best_reps BOOLEAN,
    is_best_quality BOOLEAN,
    is_best_rom BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH best_sessions AS (
        SELECT 
            se.session_id,
            se.total_reps,
            se.avg_quality,
            se.avg_rom,
            se.created_at,
            se.total_reps = MAX(se.total_reps) OVER () as is_best_reps,
            se.avg_quality = MAX(se.avg_quality) OVER () as is_best_quality,
            se.avg_rom = MAX(se.avg_rom) OVER () as is_best_rom
        FROM public.session_embeddings se
        WHERE se.user_id = p_user_id 
            AND se.exercise = p_exercise
    )
    SELECT 
        bs.session_id,
        bs.total_reps,
        bs.avg_quality,
        bs.avg_rom,
        bs.created_at,
        bs.is_best_reps,
        bs.is_best_quality,
        bs.is_best_rom
    FROM best_sessions bs
    WHERE bs.is_best_reps OR bs.is_best_quality OR bs.is_best_rom
    ORDER BY bs.created_at DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update embeddings when sessions are updated
CREATE OR REPLACE FUNCTION public.update_session_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the embedding's metadata when session is updated
    UPDATE public.session_embeddings
    SET 
        total_reps = NEW.total_reps,
        avg_quality = COALESCE(NEW.avg_quality_score, 0),
        avg_rom = COALESCE(NEW.avg_rom_score, 0),
        session_duration = COALESCE(NEW.total_time_seconds, 0),
        updated_at = NOW()
    WHERE session_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update embeddings
CREATE TRIGGER trigger_update_session_embedding
    AFTER UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_embedding();

-- Add comments for documentation
COMMENT ON TABLE public.session_embeddings IS 'Stores feature vectors for session similarity search and personalization';
COMMENT ON COLUMN public.session_embeddings.feature_vector IS 'JSONB array containing normalized feature values for similarity search';
COMMENT ON COLUMN public.session_embeddings.vector_dimensions IS 'Number of dimensions in the feature vector';
COMMENT ON COLUMN public.session_embeddings.vector_version IS 'Version of the feature extraction algorithm';
COMMENT ON FUNCTION public.find_similar_sessions IS 'Finds sessions similar to a given session using feature vector similarity';
COMMENT ON FUNCTION public.get_user_best_session IS 'Gets user''s best performing sessions for comparison';
