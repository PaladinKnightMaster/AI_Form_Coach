-- =====================================================
-- P10: ENHANCED LEADERBOARDS
-- Implements verified-first filtering, pagination, and enhanced analytics
-- =====================================================

-- Add indexes for better performance on leaderboard queries
CREATE INDEX IF NOT EXISTS idx_sessions_verified_started_at ON public.sessions (verified, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_exercise_verified_started_at ON public.sessions (exercise, verified, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_exercise_verified ON public.sessions (user_id, exercise, verified);

-- Enhanced function to get leaderboard by exercise with pagination and verified-first
CREATE OR REPLACE FUNCTION get_leaderboard_by_exercise_paginated(
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'reps' -- 'reps', 'correct_rate', 'volume', 'integrity'
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  user_email TEXT,
  exercise TEXT,
  total_reps INTEGER,
  total_sessions INTEGER,
  avg_quality_score REAL,
  correct_rate REAL,
  integrity_score REAL,
  total_volume REAL,
  best_session_date TIMESTAMPTZ,
  last_session_date TIMESTAMPTZ,
  verified_sessions INTEGER,
  total_entries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      s.user_id,
      p.email as user_email,
      s.exercise,
      SUM(s.total_reps) as total_reps,
      COUNT(*) as total_sessions,
      AVG(s.avg_quality_score) as avg_quality_score,
      AVG(s.correct_rate) as correct_rate,
      AVG(s.integrity_score) as integrity_score,
      SUM(s.total_reps * COALESCE(s.avg_quality_score, 0)) as total_volume,
      MAX(s.started_at) as last_session_date,
      COUNT(CASE WHEN s.verified = true THEN 1 END) as verified_sessions,
      (SELECT started_at FROM public.sessions s2 
       WHERE s2.user_id = s.user_id AND s2.exercise = s.exercise 
       AND s2.avg_quality_score = (SELECT MAX(avg_quality_score) FROM public.sessions s3 WHERE s3.user_id = s.user_id AND s3.exercise = s.exercise)
       ORDER BY s2.started_at DESC LIMIT 1) as best_session_date
    FROM public.sessions s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.exercise = p_exercise
      AND (p_time_filter = '1=1' OR s.started_at >= (CASE 
        WHEN p_time_filter LIKE '%today%' THEN CURRENT_DATE
        WHEN p_time_filter LIKE '%week%' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN p_time_filter LIKE '%month%' THEN CURRENT_DATE - INTERVAL '30 days'
        ELSE '1900-01-01'::date
      END))
      AND (NOT p_verified_only OR s.verified = true)
      AND s.ended_at IS NOT NULL
    GROUP BY s.user_id, p.email, s.exercise
    HAVING COUNT(*) >= 1 -- At least 1 session
  ),
  ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE p_sort_by
            WHEN 'correct_rate' THEN COALESCE(avg_quality_score, 0)
            WHEN 'volume' THEN COALESCE(total_volume, 0)
            WHEN 'integrity' THEN COALESCE(integrity_score, 0)
            ELSE total_reps
          END DESC,
          -- Secondary sort: verified sessions first, then total volume
          verified_sessions DESC,
          COALESCE(total_volume, 0) DESC
      ) as rank,
      COUNT(*) OVER () as total_entries,
      user_id,
      user_email,
      exercise,
      total_reps,
      total_sessions,
      COALESCE(avg_quality_score, 0) as avg_quality_score,
      COALESCE(correct_rate, 0) as correct_rate,
      COALESCE(integrity_score, 0) as integrity_score,
      COALESCE(total_volume, 0) as total_volume,
      best_session_date,
      last_session_date,
      verified_sessions
    FROM user_stats
  )
  SELECT 
    r.rank,
    r.user_id,
    r.user_email,
    r.exercise,
    r.total_reps,
    r.total_sessions,
    r.avg_quality_score,
    r.correct_rate,
    r.integrity_score,
    r.total_volume,
    r.best_session_date,
    r.last_session_date,
    r.verified_sessions,
    r.total_entries
  FROM ranked_users r
  ORDER BY r.rank
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to get overall leaderboard with pagination
CREATE OR REPLACE FUNCTION get_overall_leaderboard_paginated(
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'volume'
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  user_email TEXT,
  exercise TEXT,
  total_reps INTEGER,
  total_sessions INTEGER,
  avg_quality_score REAL,
  correct_rate REAL,
  integrity_score REAL,
  total_volume REAL,
  best_session_date TIMESTAMPTZ,
  last_session_date TIMESTAMPTZ,
  verified_sessions INTEGER,
  total_entries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      s.user_id,
      p.email as user_email,
      'overall' as exercise,
      SUM(s.total_reps) as total_reps,
      COUNT(*) as total_sessions,
      AVG(s.avg_quality_score) as avg_quality_score,
      AVG(s.correct_rate) as correct_rate,
      AVG(s.integrity_score) as integrity_score,
      SUM(s.total_reps * COALESCE(s.avg_quality_score, 0)) as total_volume,
      MAX(s.started_at) as last_session_date,
      COUNT(CASE WHEN s.verified = true THEN 1 END) as verified_sessions,
      (SELECT started_at FROM public.sessions s2 
       WHERE s2.user_id = s.user_id 
       AND s2.avg_quality_score = (SELECT MAX(avg_quality_score) FROM public.sessions s3 WHERE s3.user_id = s.user_id)
       ORDER BY s2.started_at DESC LIMIT 1) as best_session_date
    FROM public.sessions s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE (p_time_filter = '1=1' OR s.started_at >= (CASE 
      WHEN p_time_filter LIKE '%today%' THEN CURRENT_DATE
      WHEN p_time_filter LIKE '%week%' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN p_time_filter LIKE '%month%' THEN CURRENT_DATE - INTERVAL '30 days'
      ELSE '1900-01-01'::date
    END))
      AND (NOT p_verified_only OR s.verified = true)
      AND s.ended_at IS NOT NULL
    GROUP BY s.user_id, p.email
    HAVING COUNT(*) >= 1 -- At least 1 session
  ),
  ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE p_sort_by
            WHEN 'reps' THEN total_reps
            WHEN 'correct_rate' THEN COALESCE(avg_quality_score, 0)
            WHEN 'integrity' THEN COALESCE(integrity_score, 0)
            ELSE COALESCE(total_volume, 0)
          END DESC,
          -- Secondary sort: verified sessions first, then total reps
          verified_sessions DESC,
          total_reps DESC
      ) as rank,
      COUNT(*) OVER () as total_entries,
      user_id,
      user_email,
      exercise,
      total_reps,
      total_sessions,
      COALESCE(avg_quality_score, 0) as avg_quality_score,
      COALESCE(correct_rate, 0) as correct_rate,
      COALESCE(integrity_score, 0) as integrity_score,
      COALESCE(total_volume, 0) as total_volume,
      best_session_date,
      last_session_date,
      verified_sessions
    FROM user_stats
  )
  SELECT 
    r.rank,
    r.user_id,
    r.user_email,
    r.exercise,
    r.total_reps,
    r.total_sessions,
    r.avg_quality_score,
    r.correct_rate,
    r.integrity_score,
    r.total_volume,
    r.best_session_date,
    r.last_session_date,
    r.verified_sessions,
    r.total_entries
  FROM ranked_users r
  ORDER BY r.rank
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's rank with pagination context
CREATE OR REPLACE FUNCTION get_user_rank_with_context(
  p_user_id UUID,
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_sort_by TEXT DEFAULT 'reps'
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  user_email TEXT,
  exercise TEXT,
  total_reps INTEGER,
  total_sessions INTEGER,
  avg_quality_score REAL,
  correct_rate REAL,
  integrity_score REAL,
  total_volume REAL,
  best_session_date TIMESTAMPTZ,
  last_session_date TIMESTAMPTZ,
  verified_sessions INTEGER,
  total_entries BIGINT,
  is_current_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      s.user_id,
      p.email as user_email,
      COALESCE(s.exercise, 'overall') as exercise,
      SUM(s.total_reps) as total_reps,
      COUNT(*) as total_sessions,
      AVG(s.avg_quality_score) as avg_quality_score,
      AVG(s.correct_rate) as correct_rate,
      AVG(s.integrity_score) as integrity_score,
      SUM(s.total_reps * COALESCE(s.avg_quality_score, 0)) as total_volume,
      MAX(s.started_at) as last_session_date,
      COUNT(CASE WHEN s.verified = true THEN 1 END) as verified_sessions,
      (SELECT started_at FROM public.sessions s2 
       WHERE s2.user_id = s.user_id 
       AND (p_exercise = 'overall' OR s2.exercise = p_exercise)
       AND s2.avg_quality_score = (SELECT MAX(avg_quality_score) FROM public.sessions s3 WHERE s3.user_id = s.user_id AND (p_exercise = 'overall' OR s3.exercise = p_exercise))
       ORDER BY s2.started_at DESC LIMIT 1) as best_session_date
    FROM public.sessions s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE (p_exercise = 'overall' OR s.exercise = p_exercise)
      AND (p_time_filter = '1=1' OR s.started_at >= (CASE 
        WHEN p_time_filter LIKE '%today%' THEN CURRENT_DATE
        WHEN p_time_filter LIKE '%week%' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN p_time_filter LIKE '%month%' THEN CURRENT_DATE - INTERVAL '30 days'
        ELSE '1900-01-01'::date
      END))
      AND (NOT p_verified_only OR s.verified = true)
      AND s.ended_at IS NOT NULL
    GROUP BY s.user_id, p.email, s.exercise
    HAVING COUNT(*) >= 1 -- At least 1 session
  ),
  ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE p_sort_by
            WHEN 'correct_rate' THEN COALESCE(avg_quality_score, 0)
            WHEN 'volume' THEN COALESCE(total_volume, 0)
            WHEN 'integrity' THEN COALESCE(integrity_score, 0)
            ELSE total_reps
          END DESC,
          verified_sessions DESC,
          COALESCE(total_volume, 0) DESC
      ) as rank,
      COUNT(*) OVER () as total_entries,
      user_id,
      user_email,
      exercise,
      total_reps,
      total_sessions,
      COALESCE(avg_quality_score, 0) as avg_quality_score,
      COALESCE(correct_rate, 0) as correct_rate,
      COALESCE(integrity_score, 0) as integrity_score,
      COALESCE(total_volume, 0) as total_volume,
      best_session_date,
      last_session_date,
      verified_sessions
    FROM user_stats
  )
  SELECT 
    r.rank,
    r.user_id,
    r.user_email,
    r.exercise,
    r.total_reps,
    r.total_sessions,
    r.avg_quality_score,
    r.correct_rate,
    r.integrity_score,
    r.total_volume,
    r.best_session_date,
    r.last_session_date,
    r.verified_sessions,
    r.total_entries,
    (r.user_id = p_user_id) as is_current_user
  FROM ranked_users r
  WHERE r.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get depth sparkline data for a user
CREATE OR REPLACE FUNCTION get_user_depth_sparkline(
  p_user_id UUID,
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  session_date DATE,
  avg_depth REAL,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.started_at::DATE as session_date,
    AVG(
      CASE p_exercise
        WHEN 'squat' THEN (r.exercise_metrics->>'depth')::REAL
        WHEN 'pushup' THEN (r.exercise_metrics->>'elbowAngle')::REAL
        WHEN 'plank' THEN (r.exercise_metrics->>'bodyLinePercentage')::REAL
        ELSE 0
      END
    ) as avg_depth,
    COUNT(DISTINCT s.id) as session_count
  FROM public.sessions s
  JOIN public.reps r ON r.session_id = s.id
  WHERE s.user_id = p_user_id
    AND (p_exercise = 'overall' OR s.exercise = p_exercise)
    AND (p_time_filter = '1=1' OR s.started_at >= (CASE 
      WHEN p_time_filter LIKE '%today%' THEN CURRENT_DATE
      WHEN p_time_filter LIKE '%week%' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN p_time_filter LIKE '%month%' THEN CURRENT_DATE - INTERVAL '30 days'
      ELSE '1900-01-01'::date
    END))
    AND (NOT p_verified_only OR s.verified = true)
    AND s.ended_at IS NOT NULL
    AND r.exercise_metrics IS NOT NULL
  GROUP BY s.started_at::DATE
  ORDER BY s.started_at::DATE DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user entered top 10 (for toast notifications)
CREATE OR REPLACE FUNCTION check_top_10_entry(
  p_user_id UUID,
  p_exercise TEXT,
  p_time_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  entered BOOLEAN,
  leaderboards TEXT[]
) AS $$
DECLARE
  time_filter_text TEXT;
BEGIN
  -- Convert time filter
  time_filter_text := CASE p_time_filter
    WHEN 'today' THEN 'today'
    WHEN 'week' THEN 'week'
    WHEN 'month' THEN 'month'
    ELSE '1=1'
  END;

  RETURN QUERY
  WITH user_ranks AS (
    -- Check overall leaderboard
    SELECT 'overall' as leaderboard, rank
    FROM get_user_rank_with_context(p_user_id, 'overall', time_filter_text, true, 'volume')
    WHERE rank <= 10
    
    UNION ALL
    
    -- Check exercise-specific leaderboards
    SELECT p_exercise as leaderboard, rank
    FROM get_user_rank_with_context(p_user_id, p_exercise, time_filter_text, true, 'reps')
    WHERE rank <= 10
  )
  SELECT 
    COUNT(*) > 0 as entered,
    ARRAY_AGG(leaderboard) as leaderboards
  FROM user_ranks;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION get_leaderboard_by_exercise_paginated IS 'Enhanced leaderboard query with pagination, verified-first sorting, and multiple sort options';
COMMENT ON FUNCTION get_overall_leaderboard_paginated IS 'Enhanced overall leaderboard query with pagination and verified-first sorting';
COMMENT ON FUNCTION get_user_rank_with_context IS 'Get user rank with full context including total entries and pagination info';
COMMENT ON FUNCTION get_user_depth_sparkline IS 'Get depth sparkline data for user performance visualization';
COMMENT ON FUNCTION check_top_10_entry IS 'Check if user entered top 10 for toast notifications';
