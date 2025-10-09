-- Organization Dashboard Schema (B2B-ready, read-only pilot)
-- This migration creates the organization system for enterprise-friendly analytics

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    domain TEXT, -- Optional domain for auto-assignment
    settings JSONB NOT NULL DEFAULT '{
        "allowPHI": false,
        "dataRetentionDays": 365,
        "exportFormat": "csv",
        "defaultTimeRange": "30d",
        "refreshInterval": 60,
        "webhookEnabled": false
    }'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{
        "industry": null,
        "size": null,
        "region": null,
        "contactEmail": null,
        "billingTier": "pilot"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Create organization_users table for user assignments
CREATE TABLE IF NOT EXISTS public.organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'viewer', 'member')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(organization_id, user_id)
);

-- 3. Create organization_invites table for user invitations
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'viewer', 'member')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- 4. Create organization_metrics_cache table for performance
CREATE TABLE IF NOT EXISTS public.organization_metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    time_range TEXT NOT NULL,
    metrics_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    
    -- Constraints
    UNIQUE(organization_id, time_range)
);

-- 5. Create organization_exports table for tracking exports
CREATE TABLE IF NOT EXISTS public.organization_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json')),
    metrics_included TEXT[] NOT NULL,
    include_phi BOOLEAN DEFAULT false,
    time_range TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    download_url TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    record_count INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Create organization_webhook_logs table for webhook tracking
CREATE TABLE IF NOT EXISTS public.organization_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ
);

-- 7. Add indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_domain_unique ON public.organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON public.organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_role ON public.organization_users(role);
CREATE INDEX IF NOT EXISTS idx_organization_users_active ON public.organization_users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_status ON public.organization_invites(status);
CREATE INDEX IF NOT EXISTS idx_organization_invites_expires_at ON public.organization_invites(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invites_unique_pending ON public.organization_invites(organization_id, email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_organization_metrics_cache_org_id ON public.organization_metrics_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_cache_time_range ON public.organization_metrics_cache(time_range);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_cache_expires_at ON public.organization_metrics_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_organization_exports_org_id ON public.organization_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_exports_requested_by ON public.organization_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_organization_exports_status ON public.organization_exports(status);
CREATE INDEX IF NOT EXISTS idx_organization_exports_created_at ON public.organization_exports(created_at);

CREATE INDEX IF NOT EXISTS idx_organization_webhook_logs_org_id ON public.organization_webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_webhook_logs_event_type ON public.organization_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_organization_webhook_logs_sent_at ON public.organization_webhook_logs(sent_at);

-- 8. Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_webhook_logs ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can update their organizations" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- 10. Create RLS policies for organization_users
CREATE POLICY "Users can view organization users for their organizations" ON public.organization_users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage organization users" ON public.organization_users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- 11. Create RLS policies for organization_invites
CREATE POLICY "Users can view invites for their organizations" ON public.organization_invites
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage organization invites" ON public.organization_invites
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- 12. Create RLS policies for organization_metrics_cache
CREATE POLICY "Users can view metrics for their organizations" ON public.organization_metrics_cache
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "System can manage metrics cache" ON public.organization_metrics_cache
    FOR ALL USING (true); -- Allow system access for cache management

-- 13. Create RLS policies for organization_exports
CREATE POLICY "Users can view exports for their organizations" ON public.organization_exports
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create exports for their organizations" ON public.organization_exports
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND is_active = true
        ) AND requested_by = auth.uid()
    );

-- 14. Create RLS policies for organization_webhook_logs
CREATE POLICY "Admins can view webhook logs for their organizations" ON public.organization_webhook_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_users 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- 15. Create functions for organization metrics calculation
CREATE OR REPLACE FUNCTION calculate_organization_form_iq(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    avg_form_iq REAL;
    trend_data JSONB;
    distribution JSONB;
BEGIN
    -- Calculate average Form IQ from sessions
    SELECT AVG(COALESCE(s.avg_quality_score, 0) / 100.0) INTO avg_form_iq
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL;

    -- Calculate weekly trend data
    SELECT jsonb_agg(
        jsonb_build_object(
            'week', to_char(week_start, 'YYYY-MM-DD'),
            'average', COALESCE(week_avg, 0),
            'count', COALESCE(week_count, 0)
        ) ORDER BY week_start
    ) INTO trend_data
    FROM (
        SELECT 
            date_trunc('week', s.started_at) as week_start,
            AVG(COALESCE(s.avg_quality_score, 0) / 100.0) as week_avg,
            COUNT(*) as week_count
        FROM public.sessions s
        JOIN public.organization_users ou ON ou.user_id = s.user_id
        WHERE ou.organization_id = p_organization_id
          AND ou.is_active = true
          AND s.started_at >= p_start_date
          AND s.started_at <= p_end_date
          AND s.ended_at IS NOT NULL
        GROUP BY date_trunc('week', s.started_at)
    ) weekly_data;

    -- Calculate quality distribution
    SELECT jsonb_build_object(
        'excellent', COUNT(CASE WHEN COALESCE(s.avg_quality_score, 0) >= 80 THEN 1 END),
        'good', COUNT(CASE WHEN COALESCE(s.avg_quality_score, 0) >= 60 AND COALESCE(s.avg_quality_score, 0) < 80 THEN 1 END),
        'fair', COUNT(CASE WHEN COALESCE(s.avg_quality_score, 0) >= 40 AND COALESCE(s.avg_quality_score, 0) < 60 THEN 1 END),
        'poor', COUNT(CASE WHEN COALESCE(s.avg_quality_score, 0) < 40 THEN 1 END)
    ) INTO distribution
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL;

    -- Build result
    result := jsonb_build_object(
        'average', COALESCE(avg_form_iq, 0),
        'trend', 'stable', -- TODO: Calculate actual trend
        'weeklyData', COALESCE(trend_data, '[]'::jsonb),
        'distribution', COALESCE(distribution, '{"excellent": 0, "good": 0, "fair": 0, "poor": 0}'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_organization_verified_minutes(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_minutes INTEGER;
    avg_per_user REAL;
    user_count INTEGER;
    weekly_data JSONB;
    by_exercise JSONB;
BEGIN
    -- Calculate total verified minutes
    SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60), 0)::INTEGER,
        COUNT(DISTINCT s.user_id)
    INTO total_minutes, user_count
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL
      AND s.verified = true;

    -- Calculate average per user
    avg_per_user := CASE WHEN user_count > 0 THEN total_minutes::REAL / user_count ELSE 0 END;

    -- Calculate weekly data
    SELECT jsonb_agg(
        jsonb_build_object(
            'week', to_char(week_start, 'YYYY-MM-DD'),
            'totalMinutes', COALESCE(week_minutes, 0),
            'userCount', COALESCE(week_users, 0)
        ) ORDER BY week_start
    ) INTO weekly_data
    FROM (
        SELECT 
            date_trunc('week', s.started_at) as week_start,
            COALESCE(SUM(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60), 0)::INTEGER as week_minutes,
            COUNT(DISTINCT s.user_id) as week_users
        FROM public.sessions s
        JOIN public.organization_users ou ON ou.user_id = s.user_id
        WHERE ou.organization_id = p_organization_id
          AND ou.is_active = true
          AND s.started_at >= p_start_date
          AND s.started_at <= p_end_date
          AND s.ended_at IS NOT NULL
          AND s.verified = true
        GROUP BY date_trunc('week', s.started_at)
    ) weekly_stats;

    -- Calculate by exercise
    SELECT jsonb_build_object(
        'squat', COALESCE(SUM(CASE WHEN s.exercise = 'squat' THEN EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60 ELSE 0 END), 0)::INTEGER,
        'pushup', COALESCE(SUM(CASE WHEN s.exercise = 'pushup' THEN EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60 ELSE 0 END), 0)::INTEGER,
        'plank', COALESCE(SUM(CASE WHEN s.exercise = 'plank' THEN EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60 ELSE 0 END), 0)::INTEGER,
        'other', COALESCE(SUM(CASE WHEN s.exercise NOT IN ('squat', 'pushup', 'plank') THEN EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60 ELSE 0 END), 0)::INTEGER
    ) INTO by_exercise
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL
      AND s.verified = true;

    -- Build result
    result := jsonb_build_object(
        'total', total_minutes,
        'averagePerUser', avg_per_user,
        'trend', 'stable', -- TODO: Calculate actual trend
        'weeklyData', COALESCE(weekly_data, '[]'::jsonb),
        'byExercise', COALESCE(by_exercise, '{"squat": 0, "pushup": 0, "plank": 0, "other": 0}'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_organization_adherence(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INTEGER;
    active_users INTEGER;
    total_sessions INTEGER;
    target_sessions INTEGER;
    overall_adherence REAL;
    weekly_data JSONB;
    user_data JSONB;
BEGIN
    -- Get total users in organization
    SELECT COUNT(*) INTO total_users
    FROM public.organization_users
    WHERE organization_id = p_organization_id AND is_active = true;

    -- Get active users (users with sessions in time range)
    SELECT COUNT(DISTINCT s.user_id) INTO active_users
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL;

    -- Calculate total sessions and target (assuming 3 sessions per week per user)
    SELECT 
        COUNT(*),
        total_users * 3 * EXTRACT(WEEK FROM (p_end_date - p_start_date))::INTEGER
    INTO total_sessions, target_sessions
    FROM public.sessions s
    JOIN public.organization_users ou ON ou.user_id = s.user_id
    WHERE ou.organization_id = p_organization_id
      AND ou.is_active = true
      AND s.started_at >= p_start_date
      AND s.started_at <= p_end_date
      AND s.ended_at IS NOT NULL;

    -- Calculate overall adherence
    overall_adherence := CASE WHEN target_sessions > 0 THEN (total_sessions::REAL / target_sessions) * 100 ELSE 0 END;

    -- Calculate weekly adherence data
    SELECT jsonb_agg(
        jsonb_build_object(
            'week', to_char(week_start, 'YYYY-MM-DD'),
            'percentage', COALESCE(week_adherence, 0),
            'targetSessions', COALESCE(week_target, 0),
            'actualSessions', COALESCE(week_actual, 0)
        ) ORDER BY week_start
    ) INTO weekly_data
    FROM (
        SELECT 
            date_trunc('week', s.started_at) as week_start,
            CASE WHEN (total_users * 3) > 0 THEN (COUNT(*)::REAL / (total_users * 3)) * 100 ELSE 0 END as week_adherence,
            total_users * 3 as week_target,
            COUNT(*) as week_actual
        FROM public.sessions s
        JOIN public.organization_users ou ON ou.user_id = s.user_id
        WHERE ou.organization_id = p_organization_id
          AND ou.is_active = true
          AND s.started_at >= p_start_date
          AND s.started_at <= p_end_date
          AND s.ended_at IS NOT NULL
        GROUP BY date_trunc('week', s.started_at)
    ) weekly_stats;

    -- Calculate user-level adherence data
    SELECT jsonb_agg(
        jsonb_build_object(
            'userId', u.user_id,
            'userEmail', p.email,
            'adherence', COALESCE(u.adherence, 0),
            'totalSessions', COALESCE(u.total_sessions, 0),
            'targetSessions', COALESCE(u.target_sessions, 0),
            'lastSessionDate', u.last_session_date
        )
    ) INTO user_data
    FROM (
        SELECT 
            ou.user_id,
            COUNT(s.id) as total_sessions,
            total_users * 3 * EXTRACT(WEEK FROM (p_end_date - p_start_date))::INTEGER as target_sessions,
            CASE WHEN (total_users * 3 * EXTRACT(WEEK FROM (p_end_date - p_start_date))::INTEGER) > 0 
                 THEN (COUNT(s.id)::REAL / (total_users * 3 * EXTRACT(WEEK FROM (p_end_date - p_start_date))::INTEGER)) * 100 
                 ELSE 0 END as adherence,
            MAX(s.started_at) as last_session_date
        FROM public.organization_users ou
        LEFT JOIN public.sessions s ON s.user_id = ou.user_id
            AND s.started_at >= p_start_date
            AND s.started_at <= p_end_date
            AND s.ended_at IS NOT NULL
        WHERE ou.organization_id = p_organization_id AND ou.is_active = true
        GROUP BY ou.user_id
    ) u
    LEFT JOIN public.profiles p ON p.id = u.user_id;

    -- Build result
    result := jsonb_build_object(
        'overall', overall_adherence,
        'trend', 'stable', -- TODO: Calculate actual trend
        'weeklyData', COALESCE(weekly_data, '[]'::jsonb),
        'byUser', COALESCE(user_data, '[]'::jsonb)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to get organization dashboard data
CREATE OR REPLACE FUNCTION get_organization_dashboard_data(
    p_organization_id UUID,
    p_time_range TEXT DEFAULT '30d'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    start_date TIMESTAMPTZ;
    end_date TIMESTAMPTZ;
    org_data JSONB;
    form_iq_data JSONB;
    verified_minutes_data JSONB;
    adherence_data JSONB;
    resolution_data JSONB;
    user_summary JSONB;
BEGIN
    -- Calculate date range
    end_date := NOW();
    start_date := CASE p_time_range
        WHEN '7d' THEN end_date - INTERVAL '7 days'
        WHEN '30d' THEN end_date - INTERVAL '30 days'
        WHEN '90d' THEN end_date - INTERVAL '90 days'
        WHEN '1y' THEN end_date - INTERVAL '1 year'
        ELSE end_date - INTERVAL '30 days'
    END;

    -- Get organization data
    SELECT to_jsonb(o.*) INTO org_data
    FROM public.organizations o
    WHERE o.id = p_organization_id AND o.is_active = true;

    -- Calculate metrics
    SELECT calculate_organization_form_iq(p_organization_id, start_date, end_date) INTO form_iq_data;
    SELECT calculate_organization_verified_minutes(p_organization_id, start_date, end_date) INTO verified_minutes_data;
    SELECT calculate_organization_adherence(p_organization_id, start_date, end_date) INTO adherence_data;

    -- Calculate resolution data (placeholder for now)
    resolution_data := jsonb_build_object(
        'totalFlagged', 0,
        'totalResolved', 0,
        'resolutionRate', 0,
        'averageResolutionTime', 0,
        'weeklyData', '[]'::jsonb,
        'commonIssues', '[]'::jsonb
    );

    -- Calculate user summary
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(CASE WHEN s.user_id IS NOT NULL THEN 1 END),
        'new', COUNT(CASE WHEN ou.assigned_at >= start_date THEN 1 END),
        'engagement', jsonb_build_object(
            'high', COUNT(CASE WHEN user_sessions.weekly_sessions > 3 THEN 1 END),
            'medium', COUNT(CASE WHEN user_sessions.weekly_sessions BETWEEN 1 AND 3 THEN 1 END),
            'low', COUNT(CASE WHEN user_sessions.weekly_sessions < 1 THEN 1 END)
        )
    ) INTO user_summary
    FROM public.organization_users ou
    LEFT JOIN public.sessions s ON s.user_id = ou.user_id
        AND s.started_at >= start_date
        AND s.started_at <= end_date
        AND s.ended_at IS NOT NULL
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) / EXTRACT(WEEK FROM (end_date - start_date)) as weekly_sessions
        FROM public.sessions
        WHERE started_at >= start_date AND started_at <= end_date AND ended_at IS NOT NULL
        GROUP BY user_id
    ) user_sessions ON user_sessions.user_id = ou.user_id
    WHERE ou.organization_id = p_organization_id AND ou.is_active = true;

    -- Build final result
    result := jsonb_build_object(
        'organizationId', p_organization_id,
        'timeRange', p_time_range,
        'generatedAt', NOW(),
        'formIQ', form_iq_data,
        'verifiedMinutes', verified_minutes_data,
        'adherence', adherence_data,
        'resolution', resolution_data,
        'users', user_summary
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Create trigger to update organization updated_at
CREATE OR REPLACE FUNCTION update_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_updated_at();

-- 18. Create trigger to update organization_user last_accessed_at
CREATE OR REPLACE FUNCTION update_organization_user_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_user_access
    BEFORE UPDATE ON public.organization_users
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_user_access();

-- 19. Create function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalOrganizations', COUNT(*),
        'totalUsers', (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.organization_users 
            WHERE is_active = true
        ),
        'activeOrganizations', COUNT(CASE WHEN is_active = true THEN 1 END),
        'totalSessions', (
            SELECT COUNT(*) 
            FROM public.sessions s
            JOIN public.organization_users ou ON ou.user_id = s.user_id
            WHERE ou.is_active = true
        ),
        'averageFormIQ', (
            SELECT COALESCE(AVG(s.avg_quality_score) / 100.0, 0)
            FROM public.sessions s
            JOIN public.organization_users ou ON ou.user_id = s.user_id
            WHERE ou.is_active = true
              AND s.ended_at IS NOT NULL
        ),
        'totalVerifiedMinutes', (
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60), 0)::INTEGER
            FROM public.sessions s
            JOIN public.organization_users ou ON ou.user_id = s.user_id
            WHERE ou.is_active = true
              AND s.ended_at IS NOT NULL
              AND s.verified = true
        )
    ) INTO result
    FROM public.organizations;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Organizations for B2B dashboard access';
COMMENT ON TABLE public.organization_users IS 'User assignments to organizations with roles';
COMMENT ON TABLE public.organization_invites IS 'Pending invitations to join organizations';
COMMENT ON TABLE public.organization_metrics_cache IS 'Cached organization metrics for performance';
COMMENT ON TABLE public.organization_exports IS 'Export requests and results for organization data';
COMMENT ON TABLE public.organization_webhook_logs IS 'Webhook delivery logs for organization events';

COMMENT ON FUNCTION calculate_organization_form_iq(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculate Form IQ metrics for an organization';
COMMENT ON FUNCTION calculate_organization_verified_minutes(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculate verified minutes metrics for an organization';
COMMENT ON FUNCTION calculate_organization_adherence(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculate adherence metrics for an organization';
COMMENT ON FUNCTION get_organization_dashboard_data(UUID, TEXT) IS 'Get complete dashboard data for an organization';
COMMENT ON FUNCTION get_organization_stats() IS 'Get global organization statistics';
