-- Analytics and Monitoring Schema
-- This migration adds comprehensive analytics and monitoring capabilities

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

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT NOT NULL,
    component TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Error Events Table
CREATE TABLE IF NOT EXISTS error_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    error_level TEXT NOT NULL CHECK (error_level IN ('error', 'warning', 'info')),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component TEXT,
    action TEXT,
    metadata JSONB,
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error events
CREATE INDEX IF NOT EXISTS idx_error_events_user_id ON error_events(user_id);
CREATE INDEX IF NOT EXISTS idx_error_events_session_id ON error_events(session_id);
CREATE INDEX IF NOT EXISTS idx_error_events_level ON error_events(error_level);
CREATE INDEX IF NOT EXISTS idx_error_events_component ON error_events(component);
CREATE INDEX IF NOT EXISTS idx_error_events_timestamp ON error_events(timestamp);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    metadata JSONB
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);

-- Analytics Summary Views (with SECURITY INVOKER for safety)
CREATE OR REPLACE VIEW analytics_summary
WITH (security_invoker = true)
AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
GROUP BY DATE_TRUNC('day', created_at), event_type
ORDER BY date DESC, event_type;

-- Performance Summary View (with SECURITY INVOKER for safety)
CREATE OR REPLACE VIEW performance_summary
WITH (security_invoker = true)
AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    metric_name,
    component,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as sample_count
FROM performance_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), metric_name, component
ORDER BY hour DESC, metric_name, component;

-- Error Summary View (with SECURITY INVOKER for safety)
CREATE OR REPLACE VIEW error_summary
WITH (security_invoker = true)
AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    error_level,
    component,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users,
    COUNT(DISTINCT session_id) as affected_sessions
FROM error_events
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), error_level, component
ORDER BY hour DESC, error_count DESC;

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics data
CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own error events" ON error_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own error events" ON error_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cleanup function for old analytics data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM error_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM user_sessions WHERE started_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_data();');

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    total_events BIGINT,
    total_errors BIGINT,
    avg_session_duration NUMERIC,
    most_active_hour INTEGER,
    error_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.session_id) as total_sessions,
        COUNT(a.id) as total_events,
        COUNT(e.id) as total_errors,
        AVG(s.duration_seconds) as avg_session_duration,
        EXTRACT(HOUR FROM a.timestamp)::INTEGER as most_active_hour,
        CASE 
            WHEN COUNT(a.id) > 0 THEN (COUNT(e.id)::NUMERIC / COUNT(a.id)::NUMERIC) * 100
            ELSE 0
        END as error_rate
    FROM user_sessions s
    LEFT JOIN analytics_events a ON a.user_id = p_user_id
    LEFT JOIN error_events e ON e.user_id = p_user_id
    WHERE s.user_id = p_user_id
    GROUP BY EXTRACT(HOUR FROM a.timestamp);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
