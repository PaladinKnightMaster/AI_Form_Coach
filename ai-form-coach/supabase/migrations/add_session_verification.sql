-- =====================================================
-- SESSION VERIFICATION SYSTEM
-- Implements Strava-like integrity checking for sessions
-- =====================================================

-- Step 1: Add verification columns to sessions table
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrity_score real CHECK (integrity_score >= 0 AND integrity_score <= 1),
  ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);

-- Add helpful comments
COMMENT ON COLUMN public.sessions.verified IS 'Whether this session has been verified as legitimate';
COMMENT ON COLUMN public.sessions.integrity_score IS 'Automated integrity score (0-1). Higher is better. Based on ROM consistency, tempo realism, progression naturalness';
COMMENT ON COLUMN public.sessions.flagged IS 'Whether this session has been flagged for suspicious activity';
COMMENT ON COLUMN public.sessions.flag_reason IS 'Reason why session was flagged (if applicable)';
COMMENT ON COLUMN public.sessions.verified_at IS 'When the session was verified';
COMMENT ON COLUMN public.sessions.verified_by IS 'Who verified the session (null for auto-verification)';

-- Create index for verified sessions (for leaderboard queries)
CREATE INDEX IF NOT EXISTS sessions_verified_idx ON public.sessions (verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS sessions_flagged_idx ON public.sessions (flagged) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS sessions_integrity_score_idx ON public.sessions (integrity_score DESC);

-- Step 2: Create session verification audit table
CREATE TABLE IF NOT EXISTS public.session_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN (
    'auto_integrity_check',
    'rom_consistency_check',
    'tempo_realism_check',
    'progression_check',
    'outlier_detection',
    'manual_review',
    'admin_override',
    'community_report'
  )),
  verified_by text NOT NULL, -- 'system' or user_id
  passed boolean NOT NULL,
  score real CHECK (score >= 0 AND score <= 1),
  details jsonb, -- Store check details, thresholds, actual values
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.session_verifications IS 'Audit log of all verification checks performed on sessions';
COMMENT ON COLUMN public.session_verifications.verification_type IS 'Type of verification check performed';
COMMENT ON COLUMN public.session_verifications.verified_by IS 'System or user who performed the verification';
COMMENT ON COLUMN public.session_verifications.passed IS 'Whether the session passed this verification check';
COMMENT ON COLUMN public.session_verifications.score IS 'Score for this specific check (0-1)';
COMMENT ON COLUMN public.session_verifications.details IS 'Detailed check results in JSON format';

-- Create indexes for verification audits
CREATE INDEX IF NOT EXISTS verifications_session_idx ON public.session_verifications (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verifications_type_idx ON public.session_verifications (verification_type);
CREATE INDEX IF NOT EXISTS verifications_passed_idx ON public.session_verifications (passed);

-- Step 3: Create integrity check configuration table
CREATE TABLE IF NOT EXISTS public.integrity_check_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_name text NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  weight real DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1), -- Weight in overall integrity score
  thresholds jsonb NOT NULL, -- Check-specific thresholds
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Add comments
COMMENT ON TABLE public.integrity_check_config IS 'Configuration for various integrity checks';
COMMENT ON COLUMN public.integrity_check_config.weight IS 'Weight of this check in overall integrity score calculation';
COMMENT ON COLUMN public.integrity_check_config.thresholds IS 'JSON configuration of thresholds for this check';

-- Insert default integrity check configurations
INSERT INTO public.integrity_check_config (check_name, enabled, weight, thresholds, description) VALUES
  (
    'rom_consistency',
    true,
    0.30,
    '{
      "min_avg_rom_score": 0.3,
      "max_rom_std_deviation": 0.4,
      "min_reps_for_check": 3
    }'::jsonb,
    'Checks that range of motion scores are consistent across reps'
  ),
  (
    'tempo_realism',
    true,
    0.25,
    '{
      "min_tempo_ms": 800,
      "max_tempo_ms": 8000,
      "max_tempo_variance": 2.0
    }'::jsonb,
    'Checks that rep tempo is realistic and not suspiciously fast/slow'
  ),
  (
    'progression_naturalness',
    true,
    0.25,
    '{
      "max_rep_increase_percent": 50,
      "max_time_increase_percent": 100,
      "min_sessions_for_check": 2
    }'::jsonb,
    'Checks that performance improvements are natural and not sudden jumps'
  ),
  (
    'outlier_detection',
    true,
    0.20,
    '{
      "z_score_threshold": 3.0,
      "min_sessions_for_baseline": 5
    }'::jsonb,
    'Detects statistical outliers compared to user history'
  )
ON CONFLICT (check_name) DO NOTHING;

-- Step 4: Create function to calculate overall integrity score
CREATE OR REPLACE FUNCTION calculate_session_integrity_score(p_session_id uuid)
RETURNS real AS $$
DECLARE
  v_total_weighted_score real := 0;
  v_total_weight real := 0;
  v_check record;
BEGIN
  -- Sum weighted scores from all verification checks
  FOR v_check IN 
    SELECT 
      sv.score,
      icc.weight
    FROM public.session_verifications sv
    JOIN public.integrity_check_config icc ON sv.verification_type = icc.check_name
    WHERE sv.session_id = p_session_id
      AND icc.enabled = true
      AND sv.score IS NOT NULL
  LOOP
    v_total_weighted_score := v_total_weighted_score + (v_check.score * v_check.weight);
    v_total_weight := v_total_weight + v_check.weight;
  END LOOP;
  
  -- Return weighted average, or null if no checks performed
  IF v_total_weight > 0 THEN
    RETURN v_total_weighted_score / v_total_weight;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Add comment
COMMENT ON FUNCTION calculate_session_integrity_score IS 'Calculates weighted average integrity score from all verification checks';

-- Step 5: Create function to auto-verify session
CREATE OR REPLACE FUNCTION auto_verify_session(p_session_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_integrity_score real;
  v_passed_all boolean;
  v_flag_reasons text[];
BEGIN
  -- Calculate integrity score
  v_integrity_score := calculate_session_integrity_score(p_session_id);
  
  -- Check if all verification checks passed
  SELECT 
    bool_and(passed),
    array_agg(notes) FILTER (WHERE NOT passed)
  INTO v_passed_all, v_flag_reasons
  FROM public.session_verifications
  WHERE session_id = p_session_id;
  
  -- Update session with verification results
  UPDATE public.sessions
  SET 
    integrity_score = v_integrity_score,
    verified = CASE 
      WHEN v_integrity_score >= 0.7 AND v_passed_all THEN true 
      ELSE false 
    END,
    flagged = CASE 
      WHEN v_integrity_score < 0.5 OR NOT v_passed_all THEN true 
      ELSE false 
    END,
    flag_reason = CASE 
      WHEN v_integrity_score < 0.5 OR NOT v_passed_all 
      THEN array_to_string(v_flag_reasons, '; ') 
      ELSE NULL 
    END,
    verified_at = CASE 
      WHEN v_integrity_score >= 0.7 AND v_passed_all 
      THEN now() 
      ELSE NULL 
    END
  WHERE id = p_session_id;
  
  -- Return results
  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'integrity_score', v_integrity_score,
    'verified', (v_integrity_score >= 0.7 AND v_passed_all),
    'flagged', (v_integrity_score < 0.5 OR NOT v_passed_all),
    'flag_reasons', v_flag_reasons
  );
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Add comment
COMMENT ON FUNCTION auto_verify_session IS 'Automatically verifies a session based on integrity checks. Threshold: >=0.7 verified, <0.5 flagged';

-- Step 6: Enable RLS on new tables
ALTER TABLE public.session_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_check_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_verifications
-- Users can view verifications for their own sessions
CREATE POLICY verifications_select_own ON public.session_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Only system/admin can insert verifications
CREATE POLICY verifications_insert_system ON public.session_verifications
  FOR INSERT
  WITH CHECK (verified_by = 'system' OR verified_by = auth.uid()::text);

-- RLS Policies for integrity_check_config
-- Everyone can view config
CREATE POLICY config_select_all ON public.integrity_check_config
  FOR SELECT
  USING (true);

-- Only admins can modify config (implement admin check in application layer)
CREATE POLICY config_modify_admin ON public.integrity_check_config
  FOR ALL
  USING (false) -- Modify through admin API only
  WITH CHECK (false);

-- Step 7: Create trigger to auto-verify on session completion
CREATE OR REPLACE FUNCTION trigger_auto_verify_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run verification when session is completed (ended_at is set)
  IF NEW.ended_at IS NOT NULL AND (OLD.ended_at IS NULL OR OLD.ended_at IS DISTINCT FROM NEW.ended_at) THEN
    -- Schedule async verification (to avoid blocking the session save)
    -- In production, this would use a job queue
    -- For now, we'll call it directly but could be made async with pg_cron or similar
    PERFORM auto_verify_session(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Create trigger
DROP TRIGGER IF EXISTS session_auto_verify_trigger ON public.sessions;
CREATE TRIGGER session_auto_verify_trigger
  AFTER INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_verify_session();

-- Add comment
COMMENT ON TRIGGER session_auto_verify_trigger ON public.sessions IS 'Automatically verifies session when it is completed (ended_at is set)';

-- Step 8: Create helper views for common queries
CREATE OR REPLACE VIEW public.verified_sessions_summary
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.user_id,
  s.exercise,
  s.total_reps,
  s.total_time_seconds,
  s.avg_rom_score,
  s.avg_tempo_ms,
  s.verified,
  s.integrity_score,
  s.flagged,
  s.flag_reason,
  s.started_at,
  s.ended_at,
  COUNT(sv.id) as verification_checks_run,
  COUNT(sv.id) FILTER (WHERE sv.passed = true) as checks_passed,
  COUNT(sv.id) FILTER (WHERE sv.passed = false) as checks_failed
FROM public.sessions s
LEFT JOIN public.session_verifications sv ON s.id = sv.session_id
GROUP BY s.id;

-- Add comment
COMMENT ON VIEW public.verified_sessions_summary IS 'Summary view of sessions with verification status';

-- Grant appropriate permissions
GRANT SELECT ON public.verified_sessions_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds:
-- 1. Verification columns to sessions table
-- 2. session_verifications audit table
-- 3. integrity_check_config table with default configs
-- 4. Functions for calculating integrity scores
-- 5. Auto-verification trigger
-- 6. RLS policies for security
-- 7. Helper views for queries
-- =====================================================

