-- =====================================================
-- MIGRATION 07: MACHINE LEARNING & EMBEDDINGS
-- Session embeddings and movement pattern analysis
-- =====================================================

-- =====================================================
-- SESSION EMBEDDINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.session_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    
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

-- =====================================================
-- MOVEMENT EMBEDDINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS movement_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    rep_id UUID,
    embedding_vector JSONB NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('squat', 'pushup', 'plank', 'custom')),
    quality_score REAL DEFAULT 0,
    confidence_score REAL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_session_embeddings_user_id ON public.session_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_session_id ON public.session_embeddings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_exercise ON public.session_embeddings(exercise);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_avg_quality ON public.session_embeddings(avg_quality);
CREATE INDEX IF NOT EXISTS idx_session_embeddings_created_at ON public.session_embeddings(created_at);

-- Indexes for movement embeddings
CREATE INDEX IF NOT EXISTS idx_movement_embeddings_user_id ON movement_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_movement_embeddings_session_id ON movement_embeddings(session_id);
CREATE INDEX IF NOT EXISTS idx_movement_embeddings_movement_type ON movement_embeddings(movement_type);
CREATE INDEX IF NOT EXISTS idx_movement_embeddings_quality_score ON movement_embeddings(quality_score);

-- Note: Vector similarity search requires pgvector extension
-- Uncomment when pgvector extension is installed:
-- CREATE INDEX IF NOT EXISTS idx_movement_embeddings_vector ON movement_embeddings 
--   USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE public.session_embeddings IS 'Session-level movement feature vectors for similarity analysis and recommendations';
COMMENT ON COLUMN public.session_embeddings.feature_vector IS 'JSONB array of movement features extracted from session';
COMMENT ON COLUMN public.session_embeddings.vector_dimensions IS 'Number of dimensions in the feature vector';
COMMENT ON COLUMN public.session_embeddings.vector_version IS 'Version of the feature extraction algorithm used';
COMMENT ON TABLE movement_embeddings IS 'Vector embeddings for movement pattern analysis and similarity search';
COMMENT ON COLUMN movement_embeddings.embedding_vector IS 'JSONB vector representation of movement pattern';
COMMENT ON COLUMN movement_embeddings.movement_type IS 'Type of movement being analyzed';
COMMENT ON COLUMN movement_embeddings.quality_score IS 'Overall quality score of the movement (0-1)';
COMMENT ON COLUMN movement_embeddings.confidence_score IS 'Model confidence in the embedding (0-1)';
