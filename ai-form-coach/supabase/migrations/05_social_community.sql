-- =====================================================
-- MIGRATION 05: SOCIAL & COMMUNITY FEATURES
-- Activity feed, likes, comments, and social stats
-- =====================================================

-- =====================================================
-- MONTHLY CHALLENGES (Social/Community Features)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.monthly_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    challenge_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    target_unit TEXT NOT NULL,
    exercise_type TEXT NOT NULL,
    reward_description TEXT,
    is_active BOOLEAN DEFAULT true,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHALLENGE PARTICIPATIONS (Social/Community Features)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL,
    progress_value INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACHIEVEMENTS (Social/Community Features)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY FEED
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('session_completed', 'goal_achieved', 'milestone_reached', 'challenge_joined')),
    activity_data JSONB NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY LIKES
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- =====================================================
-- ACTIVITY COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY STATISTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_activities INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_comments_received INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    total_following INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_activity_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_is_public ON activity_feed(is_public);

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON activity_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON activity_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_stats_user_id ON activity_stats(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_stats ENABLE ROW LEVEL SECURITY;

-- Monthly challenges policies
CREATE POLICY "Users can view active challenges" ON public.monthly_challenges
    FOR SELECT USING (is_active = true);

-- Challenge participations policies
CREATE POLICY "Users can view own challenge participations" ON public.challenge_participations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge participations" ON public.challenge_participations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge participations" ON public.challenge_participations
    FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view public achievements" ON public.achievements
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Users can view public activity feed" ON activity_feed
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own activity feed" ON activity_feed
    FOR ALL USING (auth.uid() = user_id);

-- Activity likes policies
CREATE POLICY "Users can manage own activity likes" ON activity_likes
    FOR ALL USING (auth.uid() = user_id);

-- Activity comments policies
CREATE POLICY "Users can manage own activity comments" ON activity_comments
    FOR ALL USING (auth.uid() = user_id);

-- Activity stats policies
CREATE POLICY "Users can manage own activity stats" ON activity_stats
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get activity like count
CREATE OR REPLACE FUNCTION get_activity_like_count(activity_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.activity_likes 
        WHERE activity_id = activity_id_param::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity comment count
CREATE OR REPLACE FUNCTION get_activity_comment_count(activity_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.activity_comments 
        WHERE activity_id = activity_id_param::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_activity_like_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_comment_count(TEXT) TO authenticated;

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE public.monthly_challenges IS 'Monthly fitness challenges for community engagement';
COMMENT ON TABLE public.challenge_participations IS 'User participation in monthly challenges';
COMMENT ON TABLE public.achievements IS 'User achievements and badges';
COMMENT ON TABLE activity_feed IS 'Social activity feed for community engagement';
COMMENT ON TABLE activity_likes IS 'Like system for social activities';
COMMENT ON TABLE activity_comments IS 'Comment system for social activities';
COMMENT ON TABLE activity_stats IS 'User social statistics and engagement metrics';
