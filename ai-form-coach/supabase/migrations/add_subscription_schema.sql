-- Add Subscription Schema
-- This migration adds the complete subscription system to support Free, Pro, and Founder tiers

-- 1. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'founder')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One subscription per user
);

-- 2. Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'founder')),
    price_monthly INTEGER, -- in cents
    price_yearly INTEGER, -- in cents
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure price columns are nullable (in case table already exists with constraints)
ALTER TABLE public.subscription_plans ALTER COLUMN price_monthly DROP NOT NULL;
ALTER TABLE public.subscription_plans ALTER COLUMN price_yearly DROP NOT NULL;

-- 3. Create coach_packs table
CREATE TABLE IF NOT EXISTS public.coach_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'usd',
    program_data JSONB NOT NULL,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER NOT NULL,
    equipment_required TEXT[],
    target_goals TEXT[],
    preview_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create monthly_challenges table
CREATE TABLE IF NOT EXISTS public.monthly_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('reps', 'time', 'consistency', 'improvement')),
    target_value INTEGER NOT NULL,
    target_unit TEXT NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN ('squat', 'pushup', 'plank', 'all')),
    reward_description TEXT,
    is_active BOOLEAN DEFAULT false,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create challenge_participations table
CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.monthly_challenges(id) ON DELETE CASCADE,
    progress_value INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 6. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add stripe_customer_id to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_subscription_id_idx ON public.user_subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_tier_idx ON public.user_subscriptions (tier);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON public.user_subscriptions (status);

CREATE INDEX IF NOT EXISTS subscription_plans_tier_idx ON public.subscription_plans (tier);
CREATE INDEX IF NOT EXISTS subscription_plans_is_active_idx ON public.subscription_plans (is_active);

CREATE INDEX IF NOT EXISTS coach_packs_is_active_idx ON public.coach_packs (is_active);
CREATE INDEX IF NOT EXISTS coach_packs_difficulty_level_idx ON public.coach_packs (difficulty_level);

CREATE INDEX IF NOT EXISTS monthly_challenges_is_active_idx ON public.monthly_challenges (is_active);
CREATE INDEX IF NOT EXISTS monthly_challenges_start_date_idx ON public.monthly_challenges (start_date);
CREATE INDEX IF NOT EXISTS monthly_challenges_end_date_idx ON public.monthly_challenges (end_date);

CREATE INDEX IF NOT EXISTS challenge_participations_user_id_idx ON public.challenge_participations (user_id);
CREATE INDEX IF NOT EXISTS challenge_participations_challenge_id_idx ON public.challenge_participations (challenge_id);
CREATE INDEX IF NOT EXISTS challenge_participations_is_completed_idx ON public.challenge_participations (is_completed);

CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON public.achievements (user_id);
CREATE INDEX IF NOT EXISTS achievements_type_idx ON public.achievements (type);
CREATE INDEX IF NOT EXISTS achievements_is_public_idx ON public.achievements (is_public);

-- 9. Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
-- User subscriptions - users can only see their own
DROP POLICY IF EXISTS user_subscriptions_select_own ON public.user_subscriptions;
CREATE POLICY user_subscriptions_select_own ON public.user_subscriptions 
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_subscriptions_insert_own ON public.user_subscriptions;
CREATE POLICY user_subscriptions_insert_own ON public.user_subscriptions 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_subscriptions_update_own ON public.user_subscriptions;
CREATE POLICY user_subscriptions_update_own ON public.user_subscriptions 
    FOR UPDATE USING (user_id = auth.uid());

-- Subscription plans - everyone can read
DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_select_all ON public.subscription_plans 
    FOR SELECT USING (true);

-- Coach packs - everyone can read
DROP POLICY IF EXISTS coach_packs_select_all ON public.coach_packs;
CREATE POLICY coach_packs_select_all ON public.coach_packs 
    FOR SELECT USING (true);

-- Monthly challenges - everyone can read
DROP POLICY IF EXISTS monthly_challenges_select_all ON public.monthly_challenges;
CREATE POLICY monthly_challenges_select_all ON public.monthly_challenges 
    FOR SELECT USING (true);

-- Challenge participations - users can only see their own
DROP POLICY IF EXISTS challenge_participations_select_own ON public.challenge_participations;
CREATE POLICY challenge_participations_select_own ON public.challenge_participations 
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS challenge_participations_insert_own ON public.challenge_participations;
CREATE POLICY challenge_participations_insert_own ON public.challenge_participations 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS challenge_participations_update_own ON public.challenge_participations;
CREATE POLICY challenge_participations_update_own ON public.challenge_participations 
    FOR UPDATE USING (user_id = auth.uid());

-- Achievements - users can see their own and public ones
DROP POLICY IF EXISTS achievements_select_own_and_public ON public.achievements;
CREATE POLICY achievements_select_own_and_public ON public.achievements 
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS achievements_insert_own ON public.achievements;
CREATE POLICY achievements_insert_own ON public.achievements 
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS achievements_update_own ON public.achievements;
CREATE POLICY achievements_update_own ON public.achievements 
    FOR UPDATE USING (user_id = auth.uid());

-- 11. Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, price_monthly, price_yearly, is_active) VALUES
('Free Plan', 'free', 0, 0, true),
('Pro Monthly', 'pro', 799, null, true), -- $7.99 (matches your Stripe)
('Pro Yearly', 'pro', null, 7999, true), -- $79.99 (matches your Stripe)
('Founder', 'founder', null, null, true) -- One-time payment $199
ON CONFLICT DO NOTHING;

-- 12. Create function to get user subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_id_param UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT tier 
        FROM public.user_subscriptions 
        WHERE user_id = user_id_param 
        AND status = 'active'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to check if user has feature access
CREATE OR REPLACE FUNCTION user_has_feature_access(user_id_param UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
BEGIN
    user_tier := get_user_subscription_tier(user_id_param);
    
    -- Free tier features
    IF feature_name IN ('readiness_assessment', 'unlimited_sessions', 'basic_nutrition_tracking') THEN
        RETURN true;
    END IF;
    
    -- Pro and Founder tier features
    IF user_tier IN ('pro', 'founder') THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.user_subscriptions IS 'User subscription information and Stripe integration';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE public.coach_packs IS 'Premium workout programs and coaching packs';
COMMENT ON TABLE public.monthly_challenges IS 'Monthly fitness challenges for community engagement';
COMMENT ON TABLE public.challenge_participations IS 'User participation in monthly challenges';
COMMENT ON TABLE public.achievements IS 'User achievements and milestones';
COMMENT ON FUNCTION get_user_subscription_tier(UUID) IS 'Get the active subscription tier for a user';
COMMENT ON FUNCTION user_has_feature_access(UUID, TEXT) IS 'Check if a user has access to a specific feature based on their subscription tier';

-- 14. Create function to get subscription plan by tier
CREATE OR REPLACE FUNCTION get_subscription_plan_by_tier(tier_param TEXT)
RETURNS TABLE(
    id UUID,
    name TEXT,
    tier TEXT,
    price_monthly INTEGER,
    price_yearly INTEGER,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.tier,
        sp.price_monthly,
        sp.price_yearly,
        sp.stripe_price_id_monthly,
        sp.stripe_price_id_yearly,
        sp.is_active
    FROM public.subscription_plans sp
    WHERE sp.tier = tier_param 
    AND sp.is_active = true
    ORDER BY sp.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_subscription_plan_by_tier(TEXT) IS 'Get subscription plan details by tier';
