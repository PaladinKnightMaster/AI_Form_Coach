-- =====================================================
-- ORGANIZATION SCHEMA
-- B2B features and organization management
-- =====================================================

-- Organizations
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

-- Organization Users
CREATE TABLE IF NOT EXISTS public.organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Organization Invites
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer', 'member')) DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Metrics Cache
CREATE TABLE IF NOT EXISTS public.organization_metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Exports
CREATE TABLE IF NOT EXISTS public.organization_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    file_url TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Organization Webhook Logs
CREATE TABLE IF NOT EXISTS public.organization_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_domain_unique ON public.organizations(domain) WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_users_performance ON public.organization_users 
  (organization_id, is_active, user_id) 
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invites_unique_pending ON public.organization_invites(organization_id, email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_organization_metrics_cache_performance ON public.organization_metrics_cache 
  (organization_id, metric_type, calculated_at DESC) 
  WHERE calculated_at >= CURRENT_DATE - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_organization_exports_organization_id ON public.organization_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_exports_status ON public.organization_exports(status);
CREATE INDEX IF NOT EXISTS idx_organization_exports_created_at ON public.organization_exports(created_at);

CREATE INDEX IF NOT EXISTS idx_organization_webhook_logs_organization_id ON public.organization_webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_webhook_logs_sent_at ON public.organization_webhook_logs(sent_at);

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'B2B organization management with settings and metadata';
COMMENT ON TABLE public.organization_users IS 'Organization membership with role-based access control';
COMMENT ON TABLE public.organization_invites IS 'Organization invitation system with expiration';
COMMENT ON TABLE public.organization_metrics_cache IS 'Cached organization metrics for improved dashboard performance';
COMMENT ON TABLE public.organization_exports IS 'Organization data export tracking and management';
COMMENT ON TABLE public.organization_webhook_logs IS 'Webhook delivery logs for organization integrations';
