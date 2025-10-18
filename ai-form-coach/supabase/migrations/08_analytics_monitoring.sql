-- =====================================================
-- MIGRATION 08: ANALYTICS, MONITORING & MONETIZATION
-- Analytics events, retention metrics, subscriptions, coach packs
-- =====================================================

-- =====================================================
-- ANALYTICS EVENTS
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

-- =====================================================
-- USER RETENTION METRICS
-- =====================================================

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

-- =====================================================
-- SESSION QUALITY METRICS
-- =====================================================

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

-- =====================================================
-- CONVERSION FUNNEL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversion_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('signup', 'first_session', 'pro_trial', 'pro_convert', 'pack_purchase')),
    stage_data JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stage)
);

-- =====================================================
-- PERFORMANCE & COST GUARDRAILS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'critical')),
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cost_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'critical')),
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM ALERTS
-- =====================================================

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

-- =====================================================
-- SUBSCRIPTIONS & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'founder')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- COACH PACKS (MARKETPLACE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coach_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    price INTEGER NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'usd',
    program_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    equipment_required TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Enhanced marketplace fields
    title TEXT,
    short_description TEXT,
    preview JSONB DEFAULT '{}'::jsonb,
    creator JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    target_goals TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    purchase_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0
);

-- =====================================================
-- COACH PACK PURCHASES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coach_pack_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_pack_id UUID NOT NULL REFERENCES public.coach_packs(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PACK REVIEWS & UPLOADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pack_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES public.coach_packs(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

CREATE TABLE IF NOT EXISTS public.pack_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.coach_packs(id) ON DELETE CASCADE,
    upload_data JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Enhanced analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_enhanced_performance ON public.analytics_events_enhanced 
  (event_type, timestamp DESC, user_id) 
  WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';

-- Retention metrics indexes
CREATE INDEX IF NOT EXISTS idx_user_retention_metrics_performance ON public.user_retention_metrics 
  (cohort_date DESC, user_id) 
  WHERE cohort_date >= CURRENT_DATE - INTERVAL '365 days';

-- Session quality indexes
CREATE INDEX IF NOT EXISTS idx_session_quality_metrics_performance ON public.session_quality_metrics 
  (created_at DESC, user_id, session_id) 
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);

-- Coach packs indexes
CREATE INDEX IF NOT EXISTS idx_coach_packs_performance ON public.coach_packs 
  (is_active, is_featured, created_at DESC) 
  WHERE is_active = true;

-- Coach pack purchases indexes
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_performance ON public.coach_pack_purchases 
  (user_id, status, purchased_at DESC) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_user_id ON public.coach_pack_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_pack_id ON public.coach_pack_purchases(coach_pack_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_purchased_at ON public.coach_pack_purchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_status ON public.coach_pack_purchases(status);

-- Pack reviews indexes
CREATE INDEX IF NOT EXISTS idx_pack_reviews_pack_id ON public.pack_reviews(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_user_id ON public.pack_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_rating ON public.pack_reviews(rating);

-- Pack uploads indexes
CREATE INDEX IF NOT EXISTS idx_pack_uploads_creator_id ON public.pack_uploads(creator_id);
CREATE INDEX IF NOT EXISTS idx_pack_uploads_status ON public.pack_uploads(status);

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE analytics_events IS 'Basic analytics events for error tracking and performance monitoring';
COMMENT ON TABLE public.analytics_events_enhanced IS 'Enhanced analytics events with detailed tracking for investor-grade metrics';
COMMENT ON TABLE public.user_retention_metrics IS 'User retention tracking with D1/W1 metrics and cohort analysis';
COMMENT ON TABLE public.session_quality_metrics IS 'Session quality metrics including FPS, visibility, and confidence tracking';
COMMENT ON TABLE public.conversion_funnel IS 'Conversion funnel tracking for user journey analysis';
COMMENT ON TABLE public.performance_guardrails IS 'Performance monitoring with threshold-based alerts';
COMMENT ON TABLE public.cost_guardrails IS 'Cost monitoring with threshold-based alerts';
COMMENT ON TABLE public.alerts IS 'System alerts for monitoring and alerting';
COMMENT ON TABLE user_subscriptions IS 'User subscription management with Stripe integration';
COMMENT ON TABLE public.coach_packs IS 'Creator packs marketplace with JSON-based content delivery';
COMMENT ON TABLE public.coach_pack_purchases IS 'Purchase tracking for creator packs';
COMMENT ON TABLE public.pack_reviews IS 'User reviews and ratings for creator packs';
COMMENT ON TABLE public.pack_uploads IS 'Creator pack upload management and approval workflow';
