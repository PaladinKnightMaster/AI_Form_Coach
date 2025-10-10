-- =====================================================
-- ANALYTICS & MONITORING SCHEMA
-- Metrics, tracking, and performance monitoring
-- =====================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('error', 'performance', 'user_event')),
    event_data JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Analytics Events Table
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

-- User Retention Metrics
CREATE TABLE IF NOT EXISTS public.user_retention_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cohort_date DATE NOT NULL,
    day_1_active BOOLEAN DEFAULT false,
    week_1_active BOOLEAN DEFAULT false,
    week_2_active BOOLEAN DEFAULT false,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cohort_date)
);

-- Session Quality Metrics
CREATE TABLE IF NOT EXISTS public.session_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    fps REAL,
    visibility_score REAL,
    confidence_score REAL,
    processing_time_ms INTEGER,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion Funnel
CREATE TABLE IF NOT EXISTS public.conversion_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('signup', 'first_session', 'pro_trial', 'pro_convert', 'pack_purchase')),
    stage_data JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage)
);

-- Performance Guardrails
CREATE TABLE IF NOT EXISTS public.performance_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'critical')),
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Guardrails
CREATE TABLE IF NOT EXISTS public.cost_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'critical')),
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
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

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Enhanced analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_performance ON public.analytics_events_enhanced 
  (event_type, timestamp DESC, user_id) 
  WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS idx_user_retention_metrics_performance ON public.user_retention_metrics 
  (cohort_date DESC, user_id) 
  WHERE cohort_date >= CURRENT_DATE - INTERVAL '365 days';

CREATE INDEX IF NOT EXISTS idx_session_quality_metrics_performance ON public.session_quality_metrics 
  (created_at DESC, user_id, session_id) 
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Basic analytics events for error tracking and performance monitoring';
COMMENT ON TABLE public.analytics_events_enhanced IS 'Enhanced analytics events with detailed tracking for investor-grade metrics';
COMMENT ON TABLE public.user_retention_metrics IS 'User retention tracking with D1/W1 metrics and cohort analysis';
COMMENT ON TABLE public.session_quality_metrics IS 'Session quality metrics including FPS, visibility, and confidence tracking';
COMMENT ON TABLE public.conversion_funnel IS 'Conversion funnel tracking for user journey analysis';
COMMENT ON TABLE public.performance_guardrails IS 'Performance monitoring with threshold-based alerts';
COMMENT ON TABLE public.cost_guardrails IS 'Cost monitoring with threshold-based alerts';
COMMENT ON TABLE public.alerts IS 'System alerts for monitoring and alerting';
