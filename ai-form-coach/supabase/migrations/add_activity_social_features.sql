-- Add Activity Social Features (Likes, Comments, etc.)
-- This migration adds the missing tables for social features in the activity feed

-- 1. Create activity_likes table
CREATE TABLE IF NOT EXISTS public.activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL, -- Can be session-{id} or achievement-{id}
    activity_type TEXT NOT NULL CHECK (activity_type IN ('session', 'achievement')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id)
);

-- 2. Create activity_comments table
CREATE TABLE IF NOT EXISTS public.activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL, -- Can be session-{id} or achievement-{id}
    activity_type TEXT NOT NULL CHECK (activity_type IN ('session', 'achievement')),
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add is_public column to sessions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'is_public' AND table_schema = 'public') THEN
        ALTER TABLE public.sessions ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Add is_public column to achievements table if it exists and column doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'is_public' AND table_schema = 'public') THEN
            ALTER TABLE public.achievements ADD COLUMN is_public BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- 5. Add quality_score column to sessions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'quality_score' AND table_schema = 'public') THEN
        ALTER TABLE public.sessions ADD COLUMN quality_score REAL;
    END IF;
END $$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS activity_likes_activity_id_idx ON public.activity_likes (activity_id);
CREATE INDEX IF NOT EXISTS activity_likes_user_id_idx ON public.activity_likes (user_id);
CREATE INDEX IF NOT EXISTS activity_comments_activity_id_idx ON public.activity_comments (activity_id);
CREATE INDEX IF NOT EXISTS activity_comments_user_id_idx ON public.activity_comments (user_id);
CREATE INDEX IF NOT EXISTS sessions_is_public_idx ON public.sessions (is_public);

-- Create achievements index only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS achievements_is_public_idx ON public.achievements (is_public);
    END IF;
END $$;

-- 7. Enable RLS
ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for activity_likes
DROP POLICY IF EXISTS activity_likes_select_own ON public.activity_likes;
CREATE POLICY activity_likes_select_own ON public.activity_likes 
    FOR SELECT USING (true); -- Anyone can see likes

DROP POLICY IF EXISTS activity_likes_insert_own ON public.activity_likes;
CREATE POLICY activity_likes_insert_own ON public.activity_likes 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS activity_likes_delete_own ON public.activity_likes;
CREATE POLICY activity_likes_delete_own ON public.activity_likes 
    FOR DELETE USING (user_id = auth.uid());

-- 9. Create RLS policies for activity_comments
DROP POLICY IF EXISTS activity_comments_select_own ON public.activity_comments;
CREATE POLICY activity_comments_select_own ON public.activity_comments 
    FOR SELECT USING (true); -- Anyone can see comments

DROP POLICY IF EXISTS activity_comments_insert_own ON public.activity_comments;
CREATE POLICY activity_comments_insert_own ON public.activity_comments 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS activity_comments_update_own ON public.activity_comments;
CREATE POLICY activity_comments_update_own ON public.activity_comments 
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS activity_comments_delete_own ON public.activity_comments;
CREATE POLICY activity_comments_delete_own ON public.activity_comments 
    FOR DELETE USING (user_id = auth.uid());

-- 10. Create function to get like count for an activity
CREATE OR REPLACE FUNCTION get_activity_like_count(activity_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.activity_likes 
        WHERE activity_id = activity_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get comment count for an activity
CREATE OR REPLACE FUNCTION get_activity_comment_count(activity_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.activity_comments 
        WHERE activity_id = activity_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to check if user liked an activity
CREATE OR REPLACE FUNCTION user_liked_activity(user_id_param UUID, activity_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.activity_likes 
        WHERE user_id = user_id_param AND activity_id = activity_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.activity_likes IS 'Stores user likes for activities (sessions and achievements)';
COMMENT ON TABLE public.activity_comments IS 'Stores user comments for activities (sessions and achievements)';
COMMENT ON COLUMN public.sessions.is_public IS 'Whether the session is visible in public activity feed';
COMMENT ON COLUMN public.achievements.is_public IS 'Whether the achievement is visible in public activity feed';
COMMENT ON COLUMN public.sessions.quality_score IS 'Overall quality score for the session (0-1)';

-- Additional helper functions for activity feed
CREATE OR REPLACE FUNCTION get_public_activities(limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE(
    activity_id TEXT,
    activity_type TEXT,
    user_id UUID,
    username TEXT,
    description TEXT,
    activity_timestamp TIMESTAMPTZ,
    metrics JSONB,
    like_count INTEGER,
    comment_count INTEGER,
    is_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH activity_data AS (
        -- Public sessions
        SELECT 
            'session-' || s.id::TEXT as activity_id,
            'session'::TEXT as activity_type,
            s.user_id,
            p.username,
            'Completed ' || s.exercise || ' workout' as description,
            s.ended_at as activity_timestamp,
            jsonb_build_object(
                'duration', s.total_time_seconds,
                'reps', s.total_reps,
                'quality_score', s.avg_rom_score
            ) as metrics
        FROM public.sessions s
        JOIN public.profiles p ON s.user_id = p.id
        WHERE s.is_public = true AND s.ended_at IS NOT NULL
        
        UNION ALL
        
        -- Public achievements
        SELECT 
            'achievement-' || a.id::TEXT as activity_id,
            'achievement'::TEXT as activity_type,
            a.user_id,
            p.username,
            a.title as description,
            a.earned_at as activity_timestamp,
            jsonb_build_object(
                'type', a.type,
                'title', a.title
            ) as metrics
        FROM public.achievements a
        JOIN public.profiles p ON a.user_id = p.id
        WHERE a.is_public = true
    )
    SELECT 
        ad.activity_id,
        ad.activity_type,
        ad.user_id,
        ad.username,
        ad.description,
        ad.activity_timestamp,
        ad.metrics,
        COALESCE(al.like_count, 0)::INTEGER as like_count,
        COALESCE(ac.comment_count, 0)::INTEGER as comment_count,
        false as is_liked -- This would need to be calculated per user
    FROM activity_data ad
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as like_count
        FROM public.activity_likes
        GROUP BY activity_id
    ) al ON ad.activity_id = al.activity_id
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as comment_count
        FROM public.activity_comments
        GROUP BY activity_id
    ) ac ON ad.activity_id = ac.activity_id
    ORDER BY ad.activity_timestamp DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_public_activities(INTEGER, INTEGER) IS 'Get public activities for the activity feed with like and comment counts';
