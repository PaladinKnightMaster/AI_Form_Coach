-- =====================================================
-- LEADERBOARD FUNCTIONS
-- Implements leaderboard queries with verification filtering
-- =====================================================

-- Function to get leaderboard by exercise (total reps)
CREATE OR REPLACE FUNCTION get_leaderboard_by_exercise(
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50
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
  last_session_date TIMESTAMPTZ
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
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_reps DESC, total_volume DESC) as rank,
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
    last_session_date
  FROM user_stats
  ORDER BY total_reps DESC, total_volume DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard by correct rate
CREATE OR REPLACE FUNCTION get_leaderboard_by_correct_rate(
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50
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
  last_session_date TIMESTAMPTZ
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
    HAVING COUNT(*) >= 3 -- At least 3 sessions for meaningful correct rate
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY correct_rate DESC, total_reps DESC) as rank,
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
    last_session_date
  FROM user_stats
  ORDER BY correct_rate DESC, total_reps DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard by volume (reps * quality)
CREATE OR REPLACE FUNCTION get_leaderboard_by_volume(
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50
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
  last_session_date TIMESTAMPTZ
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
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_volume DESC, total_reps DESC) as rank,
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
    last_session_date
  FROM user_stats
  ORDER BY total_volume DESC, total_reps DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get overall leaderboard (all exercises combined)
CREATE OR REPLACE FUNCTION get_overall_leaderboard(
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 50
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
  last_session_date TIMESTAMPTZ
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
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_volume DESC, total_reps DESC) as rank,
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
    last_session_date
  FROM user_stats
  ORDER BY total_volume DESC, total_reps DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's rank in a specific exercise
CREATE OR REPLACE FUNCTION get_user_rank(
  p_user_id UUID,
  p_exercise TEXT,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
  rank BIGINT,
  total_entries BIGINT,
  percentile REAL,
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
  last_session_date TIMESTAMPTZ
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
    HAVING COUNT(*) >= 1
  ),
  ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY total_volume DESC, total_reps DESC) as rank,
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
      last_session_date
    FROM user_stats
  )
  SELECT 
    r.rank,
    r.total_entries,
    CASE 
      WHEN r.total_entries > 0 THEN (r.total_entries - r.rank + 1)::REAL / r.total_entries * 100
      ELSE 0
    END as percentile,
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
    r.last_session_date
  FROM ranked_users r
  WHERE r.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's overall rank
CREATE OR REPLACE FUNCTION get_user_overall_rank(
  p_user_id UUID,
  p_time_filter TEXT,
  p_verified_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
  rank BIGINT,
  total_entries BIGINT,
  percentile REAL,
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
  last_session_date TIMESTAMPTZ
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
    HAVING COUNT(*) >= 1
  ),
  ranked_users AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY total_volume DESC, total_reps DESC) as rank,
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
      last_session_date
    FROM user_stats
  )
  SELECT 
    r.rank,
    r.total_entries,
    CASE 
      WHEN r.total_entries > 0 THEN (r.total_entries - r.rank + 1)::REAL / r.total_entries * 100
      ELSE 0
    END as percentile,
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
    r.last_session_date
  FROM ranked_users r
  WHERE r.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user entered top 10
CREATE OR REPLACE FUNCTION check_top10_entry(
  p_user_id UUID,
  p_exercise TEXT,
  p_time_filter TEXT
)
RETURNS TABLE (
  entered BOOLEAN,
  leaderboards TEXT[]
) AS $$
DECLARE
  entered_boards TEXT[] := '{}';
  current_rank BIGINT;
  total_entries BIGINT;
BEGIN
  -- Check overall leaderboard
  SELECT rank, total_entries INTO current_rank, total_entries
  FROM get_user_overall_rank(p_user_id, p_time_filter, true)
  WHERE user_id = p_user_id;
  
  IF current_rank IS NOT NULL AND current_rank <= 10 THEN
    entered_boards := array_append(entered_boards, 'overall');
  END IF;
  
  -- Check exercise-specific leaderboard
  SELECT rank, total_entries INTO current_rank, total_entries
  FROM get_user_rank(p_user_id, p_exercise, p_time_filter, true)
  WHERE user_id = p_user_id;
  
  IF current_rank IS NOT NULL AND current_rank <= 10 THEN
    entered_boards := array_append(entered_boards, p_exercise);
  END IF;
  
  RETURN QUERY SELECT 
    array_length(entered_boards, 1) > 0 as entered,
    entered_boards as leaderboards;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION get_leaderboard_by_exercise IS 'Get leaderboard ranked by total reps for a specific exercise';
COMMENT ON FUNCTION get_leaderboard_by_correct_rate IS 'Get leaderboard ranked by correct rate for a specific exercise';
COMMENT ON FUNCTION get_leaderboard_by_volume IS 'Get leaderboard ranked by volume (reps * quality) for a specific exercise';
COMMENT ON FUNCTION get_overall_leaderboard IS 'Get overall leaderboard across all exercises';
COMMENT ON FUNCTION get_user_rank IS 'Get user rank in a specific exercise leaderboard';
COMMENT ON FUNCTION get_user_overall_rank IS 'Get user rank in overall leaderboard';
COMMENT ON FUNCTION check_top10_entry IS 'Check if user entered top 10 in any leaderboard';
