-- =====================================================
-- MIGRATION 01: POSE QUALITY METRICS & COACHING
-- Pose detection, quality tracking, coaching hints, skeleton events
-- =====================================================

-- =====================================================
-- DEVICE CALIBRATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.device_calibration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    exercise TEXT NOT NULL,
    calibration_data JSONB NOT NULL DEFAULT '{}',
    quality_score REAL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 1),
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id, exercise)
);

-- =====================================================
-- REP QUALITY ENHANCEMENTS
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

-- =====================================================
-- POSE QUALITY METRICS TABLE
-- Real-time pose quality tracking and performance
-- =====================================================

CREATE TABLE IF NOT EXISTS pose_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quality metrics (0-1 scale)
  visibility_score DECIMAL(3,2) CHECK (visibility_score >= 0 AND visibility_score <= 1),
  stability_score DECIMAL(3,2) CHECK (stability_score >= 0 AND stability_score <= 1),
  tracking_confidence DECIMAL(3,2) CHECK (tracking_confidence >= 0 AND tracking_confidence <= 1),
  
  -- Frame metrics
  fps INTEGER CHECK (fps >= 0),
  dropped_frames INTEGER DEFAULT 0,
  low_visibility_frames INTEGER DEFAULT 0,
  total_frames INTEGER DEFAULT 0,
  
  -- Pose data
  average_landmark_visibility DECIMAL(3,2),
  best_side VARCHAR(10) CHECK (best_side IN ('left', 'right')),
  
  -- Smoothing metrics
  median_filter_applied BOOLEAN DEFAULT false,
  outlier_rejections INTEGER DEFAULT 0,
  kalman_filter_applied BOOLEAN DEFAULT false,
  
  -- Metadata
  exercise VARCHAR(50),
  model VARCHAR(10) CHECK (model IN ('lite', 'full')),
  device_info JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COACHING SYSTEM TABLES
-- Coach cues and coaching hints
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

-- Coaching hints table
CREATE TABLE IF NOT EXISTS coaching_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Hint details
  hint_key VARCHAR(50) NOT NULL,
  hint_text TEXT NOT NULL,
  severity VARCHAR(10) CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Trigger info
  joint_id INTEGER,
  error_type VARCHAR(50),
  
  -- Timing
  duration_ms INTEGER,
  cooldown_ms INTEGER DEFAULT 2000,
  
  -- Effectiveness
  was_followed BOOLEAN,
  follow_up_frames INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SKELETON RENDERING EVENTS
-- Performance and visual quality tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS skeleton_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Rendering metrics
  render_time_ms DECIMAL(5,2),
  canvas_width INTEGER,
  canvas_height INTEGER,
  
  -- Visual quality
  joints_rendered INTEGER,
  edges_rendered INTEGER,
  hidden_joints INTEGER,
  
  -- Depth info
  z_depth_used BOOLEAN,
  average_z_depth DECIMAL(5,3),
  
  -- Performance
  frame_rate INTEGER,
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_mb DECIMAL(8,2),
  
  -- Quality flags
  visual_artifacts BOOLEAN DEFAULT false,
  framerate_dropped BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pose_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE skeleton_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own pose_quality_metrics" ON pose_quality_metrics
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert pose_quality_metrics" ON pose_quality_metrics
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can access own coaching_hints" ON coaching_hints
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert coaching_hints" ON coaching_hints
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can access own skeleton_events" ON skeleton_events
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert skeleton_events" ON skeleton_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX idx_pose_quality_user ON pose_quality_metrics(user_id);
CREATE INDEX idx_pose_quality_session ON pose_quality_metrics(session_id);
CREATE INDEX idx_pose_quality_timestamp ON pose_quality_metrics(timestamp);
CREATE INDEX idx_pose_quality_visibility ON pose_quality_metrics(visibility_score);
CREATE INDEX idx_pose_quality_composite ON pose_quality_metrics(session_id, timestamp DESC);

CREATE INDEX idx_coach_cues_severity ON public.coach_cues(severity);
CREATE INDEX idx_coach_cues_key ON public.coach_cues(key);

CREATE INDEX IF NOT EXISTS idx_coaching_hints_user ON coaching_hints(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_hints_session ON coaching_hints(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_hints_timestamp ON coaching_hints(timestamp);
CREATE INDEX IF NOT EXISTS idx_coaching_hints_key ON coaching_hints(hint_key);

CREATE INDEX idx_skeleton_user ON skeleton_events(user_id);
CREATE INDEX idx_skeleton_session ON skeleton_events(session_id);
CREATE INDEX idx_skeleton_timestamp ON skeleton_events(timestamp);

-- =====================================================
-- ANALYTICAL VIEWS
-- =====================================================

CREATE OR REPLACE VIEW session_quality_summary
WITH (security_invoker = true) AS
SELECT
  s.id as session_id,
  s.user_id,
  COUNT(DISTINCT pqm.id) as metric_count,
  AVG(pqm.visibility_score) as avg_visibility,
  AVG(pqm.stability_score) as avg_stability,
  AVG(pqm.fps) as avg_fps,
  MIN(pqm.visibility_score) as min_visibility,
  MAX(pqm.fps) as max_fps
FROM sessions s
LEFT JOIN pose_quality_metrics pqm ON s.id = pqm.session_id
GROUP BY s.id, s.user_id;

CREATE OR REPLACE VIEW hint_effectiveness
WITH (security_invoker = true) AS
SELECT
  hint_key,
  severity,
  COUNT(*) as total_hints,
  COUNT(CASE WHEN was_followed THEN 1 END) as followed_count,
  ROUND(100.0 * COUNT(CASE WHEN was_followed THEN 1 END) / COUNT(*), 2) as follow_rate
FROM coaching_hints
WHERE was_followed IS NOT NULL
GROUP BY hint_key, severity;

CREATE OR REPLACE VIEW skeleton_performance
WITH (security_invoker = true) AS
SELECT
  user_id,
  ROUND(AVG(render_time_ms)::numeric, 2) as avg_render_time,
  ROUND(AVG(frame_rate)::numeric, 2) as avg_frame_rate,
  ROUND(AVG(cpu_usage_percent)::numeric, 2) as avg_cpu,
  COUNT(*) as event_count
FROM skeleton_events
GROUP BY user_id;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_stability_score(
  p_session_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_base_score DECIMAL;
  v_outlier_penalty DECIMAL;
  v_final_score DECIMAL;
BEGIN
  SELECT
    (AVG(CASE WHEN visibility_score > 0.55 THEN 1 ELSE 0 END) * 100)::DECIMAL,
    (COUNT(CASE WHEN outlier_rejections > 5 THEN 1 END)::DECIMAL / COUNT(*) * 10)::DECIMAL
  INTO v_base_score, v_outlier_penalty
  FROM pose_quality_metrics
  WHERE session_id = p_session_id;
  
  v_final_score := GREATEST(0, LEAST(100, COALESCE(v_base_score, 0) - COALESCE(v_outlier_penalty, 0)));
  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_coaching_insights(
  p_user_id UUID
)
RETURNS TABLE(
  total_sessions BIGINT,
  avg_visibility DECIMAL,
  most_common_hint VARCHAR,
  hint_follow_rate DECIMAL,
  last_session_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::BIGINT,
    AVG(pqm.visibility_score)::DECIMAL,
    (SELECT hint_key FROM coaching_hints 
     WHERE user_id = p_user_id 
     GROUP BY hint_key 
     ORDER BY COUNT(*) DESC LIMIT 1)::VARCHAR,
    ROUND((COUNT(CASE WHEN ch.was_followed THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(CASE WHEN ch.was_followed IS NOT NULL THEN 1 END), 0) * 100), 2)::DECIMAL,
    MAX(s.ended_at)::TIMESTAMPTZ
  FROM sessions s
  LEFT JOIN pose_quality_metrics pqm ON s.id = pqm.session_id
  LEFT JOIN coaching_hints ch ON s.id = ch.session_id
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE pose_quality_metrics IS 'Frame-by-frame quality metrics for pose detection and analysis';
COMMENT ON TABLE coaching_hints IS 'Coaching hint events with effectiveness tracking';
COMMENT ON TABLE skeleton_events IS 'Skeleton rendering performance and quality events';
COMMENT ON TABLE public.coach_cues IS 'Coach cues for mentor system with priority and cooldown management';
COMMENT ON COLUMN public.coach_cues.key IS 'Unique cue identifier (e.g., knees_out, go_deeper)';
COMMENT ON COLUMN public.coach_cues.severity IS 'Cue priority level (1=low, 5=critical)';
COMMENT ON COLUMN public.coach_cues.short IS 'Short cue message for real-time display';
COMMENT ON COLUMN public.coach_cues.long IS 'Detailed explanation for post-session review';
COMMENT ON COLUMN public.reps.is_correct IS 'Whether this rep was performed correctly (≥80% valid frames + no critical errors)';
COMMENT ON COLUMN public.reps.confidence IS 'Confidence score (0-1) based on error time vs rep time';
COMMENT ON COLUMN public.reps.quality_score IS 'Overall quality score for this rep (0-1)';
COMMENT ON COLUMN public.reps.tempo IS 'Tempo of the rep in seconds';
COMMENT ON COLUMN public.reps.peak_depth IS 'Peak depth achieved during the rep';
COMMENT ON COLUMN public.sessions.correct_rate IS 'Percentage of correct reps in this session (0-1)';
COMMENT ON COLUMN public.sessions.device_calibration IS 'Device calibration data and settings';
COMMENT ON COLUMN public.sessions.calibration_quality IS 'Quality of device calibration (0-1)';
COMMENT ON VIEW session_quality_summary IS 'Aggregated quality metrics per session';
COMMENT ON VIEW hint_effectiveness IS 'Analysis of coaching hint performance across all users';
COMMENT ON VIEW skeleton_performance IS 'Skeleton rendering performance analysis';
