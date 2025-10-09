-- Metrics & Guardrails Schema (Investor-grade analytics)
-- This migration creates comprehensive analytics and monitoring for unit economics and quality

-- 1. Enhanced Analytics Events Table for Retention & Conversion Tracking
CREATE TABLE IF NOT EXISTS public.analytics_events_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'retention', 'conversion', 'session_quality', 'performance', 'user_behavior', 'monetization'
    )),
    event_name TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    device_info JSONB,
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Retention Tracking Table
CREATE TABLE IF NOT EXISTS public.user_retention_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cohort_date DATE NOT NULL, -- Date user first signed up
    day_1_active BOOLEAN DEFAULT false,
    day_7_active BOOLEAN DEFAULT false,
    day_14_active BOOLEAN DEFAULT false,
    day_30_active BOOLEAN DEFAULT false,
    week_1_active BOOLEAN DEFAULT false,
    week_2_active BOOLEAN DEFAULT false,
    week_4_active BOOLEAN DEFAULT false,
    week_8_active BOOLEAN DEFAULT false,
    week_12_active BOOLEAN DEFAULT false,
    last_activity_date DATE,
    total_sessions INTEGER DEFAULT 0,
    total_verified_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, cohort_date)
);

-- 3. Session Quality Metrics Table
CREATE TABLE IF NOT EXISTS public.session_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    median_fps REAL,
    low_visibility_rate REAL, -- Percentage of time with low visibility
    false_rep_undo_rate REAL, -- Percentage of reps that were undone
    average_pose_confidence REAL,
    device_type TEXT, -- mobile, desktop, tablet
    browser_type TEXT,
    
    -- Quality Metrics
    session_completion_rate REAL, -- Percentage of sessions completed vs started
    verification_rate REAL, -- Percentage of sessions that were verified
    quality_score REAL, -- Overall session quality score
    
    -- Technical Metrics
    api_latency_ms INTEGER, -- Median API response time
    processing_time_ms INTEGER, -- Time to process session
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conversion Funnel Tracking Table
CREATE TABLE IF NOT EXISTS public.conversion_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Funnel Stages
    landing_page_viewed BOOLEAN DEFAULT false,
    signup_started BOOLEAN DEFAULT false,
    signup_completed BOOLEAN DEFAULT false,
    first_session_started BOOLEAN DEFAULT false,
    first_session_completed BOOLEAN DEFAULT false,
    first_verified_session BOOLEAN DEFAULT false,
    pro_trial_started BOOLEAN DEFAULT false,
    pro_converted BOOLEAN DEFAULT false,
    pack_purchased BOOLEAN DEFAULT false,
    
    -- Timestamps
    landing_page_at TIMESTAMPTZ,
    signup_started_at TIMESTAMPTZ,
    signup_completed_at TIMESTAMPTZ,
    first_session_at TIMESTAMPTZ,
    first_completed_at TIMESTAMPTZ,
    first_verified_at TIMESTAMPTZ,
    pro_trial_at TIMESTAMPTZ,
    pro_converted_at TIMESTAMPTZ,
    pack_purchased_at TIMESTAMPTZ,
    
    -- Conversion Data
    conversion_source TEXT, -- organic, paid, referral, etc.
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 5. Performance Guardrails Table
CREATE TABLE IF NOT EXISTS public.performance_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
    measurement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    
    UNIQUE(metric_name, measurement_date)
);

-- 6. Cost Guardrails Table
CREATE TABLE IF NOT EXISTS public.cost_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    target_value REAL NOT NULL,
    unit TEXT NOT NULL, -- MB, ms, %, etc.
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
    measurement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    
    UNIQUE(metric_name, measurement_date)
);

-- 7. Add missing columns to sessions table for enhanced tracking
ALTER TABLE public.sessions 
    ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS correct_rate REAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_quality_score REAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS integrity_score REAL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS device_type TEXT,
    ADD COLUMN IF NOT EXISTS browser_type TEXT,
    ADD COLUMN IF NOT EXISTS api_latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_user_id ON public.analytics_events_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_event_type ON public.analytics_events_enhanced(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_timestamp ON public.analytics_events_enhanced(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_session_id ON public.analytics_events_enhanced(session_id);

CREATE INDEX IF NOT EXISTS idx_user_retention_metrics_user_id ON public.user_retention_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_retention_metrics_cohort_date ON public.user_retention_metrics(cohort_date);
CREATE INDEX IF NOT EXISTS idx_user_retention_metrics_last_activity ON public.user_retention_metrics(last_activity_date);

CREATE INDEX IF NOT EXISTS idx_session_quality_metrics_session_id ON public.session_quality_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_quality_metrics_user_id ON public.session_quality_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_session_quality_metrics_created_at ON public.session_quality_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_conversion_funnel_user_id ON public.conversion_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_conversion_source ON public.conversion_funnel(conversion_source);

CREATE INDEX IF NOT EXISTS idx_performance_guardrails_metric_name ON public.performance_guardrails(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_guardrails_measurement_date ON public.performance_guardrails(measurement_date);
CREATE INDEX IF NOT EXISTS idx_performance_guardrails_status ON public.performance_guardrails(status);

CREATE INDEX IF NOT EXISTS idx_cost_guardrails_metric_name ON public.cost_guardrails(metric_name);
CREATE INDEX IF NOT EXISTS idx_cost_guardrails_measurement_date ON public.cost_guardrails(measurement_date);
CREATE INDEX IF NOT EXISTS idx_cost_guardrails_status ON public.cost_guardrails(status);

-- 9. Enable RLS
ALTER TABLE public.analytics_events_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_retention_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_guardrails ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Analytics events: Users can only see their own events
CREATE POLICY "Users can view own analytics events" ON public.analytics_events_enhanced
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events" ON public.analytics_events_enhanced
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Retention metrics: Users can only see their own metrics
CREATE POLICY "Users can view own retention metrics" ON public.user_retention_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- Session quality: Users can only see their own session quality
CREATE POLICY "Users can view own session quality" ON public.session_quality_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- Conversion funnel: Users can only see their own funnel data
CREATE POLICY "Users can view own conversion funnel" ON public.conversion_funnel
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own conversion funnel" ON public.conversion_funnel
    FOR UPDATE USING (auth.uid() = user_id);

-- Performance and cost guardrails: Read-only for all authenticated users (internal monitoring)
CREATE POLICY "Authenticated users can view performance guardrails" ON public.performance_guardrails
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view cost guardrails" ON public.cost_guardrails
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 11. Functions for calculating key metrics

-- Function to calculate D1/W1 retention
CREATE OR REPLACE FUNCTION calculate_retention_metrics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INTEGER;
    d1_retained INTEGER;
    w1_retained INTEGER;
    d1_rate REAL;
    w1_rate REAL;
BEGIN
    -- Get total users in cohort
    SELECT COUNT(*) INTO total_users
    FROM public.user_retention_metrics
    WHERE cohort_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate D1 retention
    SELECT COUNT(*) INTO d1_retained
    FROM public.user_retention_metrics
    WHERE cohort_date BETWEEN p_start_date AND p_end_date
      AND day_1_active = true;
    
    -- Calculate W1 retention
    SELECT COUNT(*) INTO w1_retained
    FROM public.user_retention_metrics
    WHERE cohort_date BETWEEN p_start_date AND p_end_date
      AND week_1_active = true;
    
    -- Calculate rates
    d1_rate := CASE WHEN total_users > 0 THEN (d1_retained::REAL / total_users) * 100 ELSE 0 END;
    w1_rate := CASE WHEN total_users > 0 THEN (w1_retained::REAL / total_users) * 100 ELSE 0 END;
    
    result := jsonb_build_object(
        'totalUsers', total_users,
        'd1Retained', d1_retained,
        'w1Retained', w1_retained,
        'd1Rate', d1_rate,
        'w1Rate', w1_rate,
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate session completion and verification rates
CREATE OR REPLACE FUNCTION calculate_session_metrics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_sessions INTEGER;
    completed_sessions INTEGER;
    verified_sessions INTEGER;
    completion_rate REAL;
    verification_rate REAL;
BEGIN
    -- Get session counts
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN ended_at IS NOT NULL THEN 1 END),
        COUNT(CASE WHEN verified = true THEN 1 END)
    INTO total_sessions, completed_sessions, verified_sessions
    FROM public.sessions
    WHERE started_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate rates
    completion_rate := CASE WHEN total_sessions > 0 THEN (completed_sessions::REAL / total_sessions) * 100 ELSE 0 END;
    verification_rate := CASE WHEN total_sessions > 0 THEN (verified_sessions::REAL / total_sessions) * 100 ELSE 0 END;
    
    result := jsonb_build_object(
        'totalSessions', total_sessions,
        'completedSessions', completed_sessions,
        'verifiedSessions', verified_sessions,
        'completionRate', completion_rate,
        'verificationRate', verification_rate,
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Pro conversion rate
CREATE OR REPLACE FUNCTION calculate_pro_conversion_metrics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INTEGER;
    pro_trials INTEGER;
    pro_conversions INTEGER;
    pack_purchases INTEGER;
    trial_rate REAL;
    conversion_rate REAL;
    pack_attach_rate REAL;
BEGIN
    -- Get user counts
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN pro_trial_started = true THEN 1 END),
        COUNT(CASE WHEN pro_converted = true THEN 1 END),
        COUNT(CASE WHEN pack_purchased = true THEN 1 END)
    INTO total_users, pro_trials, pro_conversions, pack_purchases
    FROM public.conversion_funnel
    WHERE signup_completed_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate rates
    trial_rate := CASE WHEN total_users > 0 THEN (pro_trials::REAL / total_users) * 100 ELSE 0 END;
    conversion_rate := CASE WHEN pro_trials > 0 THEN (pro_conversions::REAL / pro_trials) * 100 ELSE 0 END;
    pack_attach_rate := CASE WHEN total_users > 0 THEN (pack_purchases::REAL / total_users) * 100 ELSE 0 END;
    
    result := jsonb_build_object(
        'totalUsers', total_users,
        'proTrials', pro_trials,
        'proConversions', pro_conversions,
        'packPurchases', pack_purchases,
        'trialRate', trial_rate,
        'conversionRate', conversion_rate,
        'packAttachRate', pack_attach_rate,
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate quality metrics
CREATE OR REPLACE FUNCTION calculate_quality_metrics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    median_fps REAL;
    avg_visibility_rate REAL;
    avg_undo_rate REAL;
    avg_confidence REAL;
    device_breakdown JSONB;
BEGIN
    -- Calculate median FPS
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_fps) INTO median_fps
    FROM public.session_quality_metrics
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate average visibility rate (inverse of low visibility rate)
    SELECT AVG(1 - low_visibility_rate) * 100 INTO avg_visibility_rate
    FROM public.session_quality_metrics
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate average undo rate
    SELECT AVG(false_rep_undo_rate) * 100 INTO avg_undo_rate
    FROM public.session_quality_metrics
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate average confidence
    SELECT AVG(average_pose_confidence) * 100 INTO avg_confidence
    FROM public.session_quality_metrics
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    -- Device breakdown
    SELECT jsonb_build_object(
        'mobile', AVG(CASE WHEN device_type = 'mobile' THEN average_pose_confidence END) * 100,
        'desktop', AVG(CASE WHEN device_type = 'desktop' THEN average_pose_confidence END) * 100,
        'tablet', AVG(CASE WHEN device_type = 'tablet' THEN average_pose_confidence END) * 100
    ) INTO device_breakdown
    FROM public.session_quality_metrics
    WHERE created_at BETWEEN p_start_date AND p_end_date;
    
    result := jsonb_build_object(
        'medianFPS', COALESCE(median_fps, 0),
        'avgVisibilityRate', COALESCE(avg_visibility_rate, 0),
        'avgUndoRate', COALESCE(avg_undo_rate, 0),
        'avgConfidence', COALESCE(avg_confidence, 0),
        'deviceBreakdown', COALESCE(device_breakdown, '{}'::jsonb),
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check performance guardrails
CREATE OR REPLACE FUNCTION check_performance_guardrails()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    device_processing_rate REAL;
    median_api_latency REAL;
    storage_per_user REAL;
BEGIN
    -- Calculate device processing rate (sessions processed on device)
    SELECT 
        (COUNT(CASE WHEN api_latency_ms IS NULL OR api_latency_ms = 0 THEN 1 END)::REAL / COUNT(*)) * 100
    INTO device_processing_rate
    FROM public.sessions
    WHERE started_at >= NOW() - INTERVAL '7 days';
    
    -- Calculate median API latency
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY api_latency_ms) 
    INTO median_api_latency
    FROM public.sessions
    WHERE started_at >= NOW() - INTERVAL '7 days'
      AND api_latency_ms IS NOT NULL;
    
    -- Calculate storage per active user (approximate)
    SELECT 
        (pg_database_size(current_database()) / 1024.0 / 1024.0) / 
        (SELECT COUNT(DISTINCT user_id) FROM public.sessions WHERE started_at >= NOW() - INTERVAL '30 days')
    INTO storage_per_user;
    
    result := jsonb_build_object(
        'deviceProcessingRate', COALESCE(device_processing_rate, 0),
        'medianApiLatency', COALESCE(median_api_latency, 0),
        'storagePerUserMB', COALESCE(storage_per_user, 0),
        'thresholds', jsonb_build_object(
            'deviceProcessingMin', 95.0,
            'apiLatencyMax', 150.0,
            'storagePerUserMax', 50.0
        ),
        'status', jsonb_build_object(
            'deviceProcessing', CASE WHEN device_processing_rate >= 95.0 THEN 'pass' ELSE 'fail' END,
            'apiLatency', CASE WHEN median_api_latency <= 150.0 THEN 'pass' ELSE 'fail' END,
            'storage', CASE WHEN storage_per_user <= 50.0 THEN 'pass' ELSE 'fail' END
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Triggers for automatic metric updates

-- Trigger to update retention metrics when user activity occurs
CREATE OR REPLACE FUNCTION update_retention_metrics()
RETURNS TRIGGER AS $$
DECLARE
    user_cohort_date DATE;
    days_since_signup INTEGER;
    weeks_since_signup INTEGER;
BEGIN
    -- Get user's cohort date
    SELECT cohort_date INTO user_cohort_date
    FROM public.user_retention_metrics
    WHERE user_id = NEW.user_id;
    
    -- If no cohort date exists, create one
    IF user_cohort_date IS NULL THEN
        user_cohort_date := CURRENT_DATE;
        INSERT INTO public.user_retention_metrics (user_id, cohort_date)
        VALUES (NEW.user_id, user_cohort_date)
        ON CONFLICT (user_id, cohort_date) DO NOTHING;
    END IF;
    
    -- Calculate days and weeks since signup
    days_since_signup := EXTRACT(DAY FROM (CURRENT_DATE - user_cohort_date));
    weeks_since_signup := EXTRACT(WEEK FROM (CURRENT_DATE - user_cohort_date));
    
    -- Update retention flags based on activity
    UPDATE public.user_retention_metrics
    SET 
        day_1_active = CASE WHEN days_since_signup >= 1 THEN true ELSE day_1_active END,
        day_7_active = CASE WHEN days_since_signup >= 7 THEN true ELSE day_7_active END,
        day_14_active = CASE WHEN days_since_signup >= 14 THEN true ELSE day_14_active END,
        day_30_active = CASE WHEN days_since_signup >= 30 THEN true ELSE day_30_active END,
        week_1_active = CASE WHEN weeks_since_signup >= 1 THEN true ELSE week_1_active END,
        week_2_active = CASE WHEN weeks_since_signup >= 2 THEN true ELSE week_2_active END,
        week_4_active = CASE WHEN weeks_since_signup >= 4 THEN true ELSE week_4_active END,
        week_8_active = CASE WHEN weeks_since_signup >= 8 THEN true ELSE week_8_active END,
        week_12_active = CASE WHEN weeks_since_signup >= 12 THEN true ELSE week_12_active END,
        last_activity_date = CURRENT_DATE,
        total_sessions = total_sessions + 1,
        total_verified_minutes = total_verified_minutes + COALESCE(EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60, 0),
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND cohort_date = user_cohort_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session completion
CREATE TRIGGER trigger_update_retention_on_session
    AFTER INSERT OR UPDATE ON public.sessions
    FOR EACH ROW
    WHEN (NEW.ended_at IS NOT NULL)
    EXECUTE FUNCTION update_retention_metrics();

-- 13. Create alerts table for monitoring and alerting
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    metric TEXT NOT NULL,
    message TEXT NOT NULL,
    value REAL NOT NULL,
    threshold REAL NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_metric ON public.alerts(metric);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON public.alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);

-- Enable RLS for alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view alerts (internal monitoring)
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 14. Comments for documentation
COMMENT ON TABLE public.analytics_events_enhanced IS 'Enhanced analytics events for comprehensive tracking of user behavior, retention, and conversion metrics';
COMMENT ON TABLE public.user_retention_metrics IS 'User retention tracking with cohort analysis for D1/W1 retention calculations';
COMMENT ON TABLE public.session_quality_metrics IS 'Session quality metrics including FPS, visibility, confidence, and technical performance';
COMMENT ON TABLE public.conversion_funnel IS 'Conversion funnel tracking from landing to paid conversion';
COMMENT ON TABLE public.performance_guardrails IS 'Performance guardrails monitoring for system health and SLA compliance';
COMMENT ON TABLE public.cost_guardrails IS 'Cost guardrails monitoring for unit economics and resource usage';
COMMENT ON TABLE public.alerts IS 'Monitoring alerts for system health and performance thresholds';

COMMENT ON FUNCTION calculate_retention_metrics IS 'Calculates D1 and W1 retention rates for specified cohort period';
COMMENT ON FUNCTION calculate_session_metrics IS 'Calculates session completion and verification rates';
COMMENT ON FUNCTION calculate_pro_conversion_metrics IS 'Calculates Pro trial and conversion rates, plus pack attach rate';
COMMENT ON FUNCTION calculate_quality_metrics IS 'Calculates quality metrics including FPS, visibility, undo rate, and confidence by device';
COMMENT ON FUNCTION check_performance_guardrails IS 'Checks performance guardrails against defined thresholds';
