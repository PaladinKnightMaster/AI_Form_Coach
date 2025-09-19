-- Monetization System Schema
-- This migration adds tables for subscription management, coach packs, and monthly challenges

-- 1. User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'founder')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'founder')),
    price_monthly INTEGER NOT NULL DEFAULT 0, -- in cents
    price_yearly INTEGER NOT NULL DEFAULT 0, -- in cents
    features JSONB NOT NULL DEFAULT '{}',
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coach Packs Table
CREATE TABLE IF NOT EXISTS public.coach_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    program_data JSONB NOT NULL,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER NOT NULL,
    equipment_required TEXT[] DEFAULT '{}',
    target_goals TEXT[] DEFAULT '{}',
    preview_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coach Pack Purchases Table
CREATE TABLE IF NOT EXISTS public.coach_pack_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    coach_pack_id UUID NOT NULL,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Monthly Challenges Table
CREATE TABLE IF NOT EXISTS public.monthly_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('reps', 'time', 'consistency', 'improvement')),
    target_value INTEGER NOT NULL,
    target_unit TEXT NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN ('squat', 'pushup', 'plank', 'all')),
    reward_description TEXT,
    is_active BOOLEAN DEFAULT true,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Challenge Participations Table
CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL,
    progress_value INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 7. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    stripe_payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
    card_brand TEXT,
    card_last4 TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Billing History Table
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
    stripe_invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.user_subscriptions 
    ADD CONSTRAINT fk_user_subscriptions_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.coach_pack_purchases 
    ADD CONSTRAINT fk_coach_pack_purchases_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.coach_pack_purchases 
    ADD CONSTRAINT fk_coach_pack_purchases_coach_pack_id 
    FOREIGN KEY (coach_pack_id) REFERENCES public.coach_packs(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_participations 
    ADD CONSTRAINT fk_challenge_participations_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_participations 
    ADD CONSTRAINT fk_challenge_participations_challenge_id 
    FOREIGN KEY (challenge_id) REFERENCES public.monthly_challenges(id) ON DELETE CASCADE;

ALTER TABLE public.payment_methods 
    ADD CONSTRAINT fk_payment_methods_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.billing_history 
    ADD CONSTRAINT fk_billing_history_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_user_id ON public.coach_pack_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_coach_pack_id ON public.coach_pack_purchases(coach_pack_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_status ON public.coach_pack_purchases(status);

CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_id ON public.challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge_id ON public.challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_completion ON public.challenge_participations(completion_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_challenges_active ON public.monthly_challenges(is_active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON public.billing_history(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for subscription_plans
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- RLS Policies for coach_packs
DROP POLICY IF EXISTS "Anyone can read coach packs" ON public.coach_packs;
CREATE POLICY "Anyone can read coach packs" ON public.coach_packs
    FOR SELECT USING (is_active = true);

-- RLS Policies for coach_pack_purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.coach_pack_purchases;
CREATE POLICY "Users can view their own purchases" ON public.coach_pack_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own purchases" ON public.coach_pack_purchases;
CREATE POLICY "Users can create their own purchases" ON public.coach_pack_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for monthly_challenges
DROP POLICY IF EXISTS "Anyone can read active challenges" ON public.monthly_challenges;
CREATE POLICY "Anyone can read active challenges" ON public.monthly_challenges
    FOR SELECT USING (is_active = true);

-- RLS Policies for challenge_participations
DROP POLICY IF EXISTS "Users can view their own participations" ON public.challenge_participations;
CREATE POLICY "Users can view their own participations" ON public.challenge_participations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own participations" ON public.challenge_participations;
CREATE POLICY "Users can create their own participations" ON public.challenge_participations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participations" ON public.challenge_participations;
CREATE POLICY "Users can update their own participations" ON public.challenge_participations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_methods
DROP POLICY IF EXISTS "Users can manage their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for billing_history
DROP POLICY IF EXISTS "Users can view their own billing history" ON public.billing_history;
CREATE POLICY "Users can view their own billing history" ON public.billing_history
    FOR SELECT USING (auth.uid() = user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coach_packs_updated_at ON public.coach_packs;
CREATE TRIGGER update_coach_packs_updated_at 
    BEFORE UPDATE ON public.coach_packs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_challenge_participations_updated_at ON public.challenge_participations;
CREATE TRIGGER update_challenge_participations_updated_at 
    BEFORE UPDATE ON public.challenge_participations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint on tier column
ALTER TABLE public.subscription_plans ADD CONSTRAINT unique_subscription_tier UNIQUE (tier);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, price_monthly, price_yearly, features) VALUES
('Free', 'free', 0, 0, '{
  "ai_plan_generation": false,
  "custom_plan_creation": false,
  "plan_optimization": false,
  "detailed_trends": false,
  "advanced_analytics": false,
  "export_data": false,
  "historical_insights": false,
  "health_data_sync": false,
  "readiness_assessment": true,
  "health_insights": false,
  "coach_packs_access": false,
  "premium_programs": false,
  "monthly_challenges": false,
  "challenge_analytics": false,
  "leaderboards": false,
  "unlimited_sessions": true,
  "priority_support": false,
  "early_access": false
}'),
('Pro', 'pro', 800, 7900, '{
  "ai_plan_generation": true,
  "custom_plan_creation": true,
  "plan_optimization": true,
  "detailed_trends": true,
  "advanced_analytics": true,
  "export_data": true,
  "historical_insights": true,
  "health_data_sync": true,
  "readiness_assessment": true,
  "health_insights": true,
  "coach_packs_access": true,
  "premium_programs": true,
  "monthly_challenges": true,
  "challenge_analytics": true,
  "leaderboards": true,
  "unlimited_sessions": true,
  "priority_support": true,
  "early_access": true
}'),
('Founder', 'founder', 19900, 19900, '{
  "ai_plan_generation": true,
  "custom_plan_creation": true,
  "plan_optimization": true,
  "detailed_trends": true,
  "advanced_analytics": true,
  "export_data": true,
  "historical_insights": true,
  "health_data_sync": true,
  "readiness_assessment": true,
  "health_insights": true,
  "coach_packs_access": true,
  "premium_programs": true,
  "monthly_challenges": true,
  "challenge_analytics": true,
  "leaderboards": true,
  "unlimited_sessions": true,
  "priority_support": true,
  "early_access": true
}')
ON CONFLICT (tier) DO NOTHING;

-- Insert sample coach packs (only if they don't exist)
INSERT INTO public.coach_packs (name, description, price, currency, program_data, difficulty_level, duration_weeks, equipment_required, target_goals) 
SELECT * FROM (VALUES
('Beginner Bodyweight Program', 'A comprehensive 4-week program for fitness beginners using only bodyweight exercises.', 1999, 'USD', '{"weeks": 4, "exercises": ["squat", "pushup", "plank"]}'::jsonb, 'beginner', 4, '{}'::text[], '{"strength", "endurance", "form"}'::text[]),
('Intermediate Strength Builder', 'An 8-week program focused on building strength and muscle mass.', 2999, 'USD', '{"weeks": 8, "exercises": ["squat", "pushup", "plank", "custom"]}'::jsonb, 'intermediate', 8, '{"dumbbells", "resistance_bands"}'::text[], '{"strength", "muscle_growth", "power"}'::text[]),
('Advanced Athlete Program', 'A challenging 12-week program for advanced athletes looking to push their limits.', 4999, 'USD', '{"weeks": 12, "exercises": ["squat", "pushup", "plank", "custom"]}'::jsonb, 'advanced', 12, '{"dumbbells", "kettlebells", "resistance_bands"}'::text[], '{"strength", "power", "endurance", "athleticism"}'::text[])
) AS v(name, description, price, currency, program_data, difficulty_level, duration_weeks, equipment_required, target_goals)
WHERE NOT EXISTS (SELECT 1 FROM public.coach_packs WHERE name = v.name);

-- Insert sample monthly challenge (only if none exist)
INSERT INTO public.monthly_challenges (name, description, start_date, end_date, challenge_type, target_value, target_unit, exercise_type, reward_description)
SELECT 'Squat Master Challenge', 'Complete 1000 squats this month to improve your lower body strength and endurance.', NOW(), NOW() + INTERVAL '30 days', 'reps', 1000, 'squats', 'squat', 'Exclusive Squat Master badge and 20% off next coach pack purchase'
WHERE NOT EXISTS (SELECT 1 FROM public.monthly_challenges WHERE name = 'Squat Master Challenge');
