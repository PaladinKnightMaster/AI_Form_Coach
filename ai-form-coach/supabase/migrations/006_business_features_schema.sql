-- =====================================================
-- MIGRATION 006: SUBSCRIPTIONS & MARKETPLACE
-- Coach packs, purchases, monetization features
-- =====================================================

-- User Subscriptions
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

-- Coach Packs (Creator Packs Marketplace)
CREATE TABLE IF NOT EXISTS public.coach_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    price INTEGER NOT NULL CHECK (price >= 0), -- in cents
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

-- Coach Pack Purchases
CREATE TABLE IF NOT EXISTS public.coach_pack_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_pack_id UUID NOT NULL REFERENCES public.coach_packs(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 0), -- in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack Reviews
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

-- Pack Uploads (for creators)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);

CREATE INDEX IF NOT EXISTS idx_coach_packs_performance ON public.coach_packs 
  (is_active, is_featured, created_at DESC) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_performance ON public.coach_pack_purchases 
  (user_id, status, purchased_at DESC) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_user_id ON public.coach_pack_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_pack_id ON public.coach_pack_purchases(coach_pack_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_purchased_at ON public.coach_pack_purchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_status ON public.coach_pack_purchases(status);

CREATE INDEX IF NOT EXISTS idx_pack_reviews_pack_id ON public.pack_reviews(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_user_id ON public.pack_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_rating ON public.pack_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_pack_uploads_creator_id ON public.pack_uploads(creator_id);
CREATE INDEX IF NOT EXISTS idx_pack_uploads_status ON public.pack_uploads(status);

-- Add comments for documentation
COMMENT ON TABLE user_subscriptions IS 'User subscription management with Stripe integration';
COMMENT ON TABLE public.coach_packs IS 'Creator packs marketplace with JSON-based content delivery';
COMMENT ON TABLE public.coach_pack_purchases IS 'Purchase tracking for creator packs';
COMMENT ON TABLE public.pack_reviews IS 'User reviews and ratings for creator packs';
COMMENT ON TABLE public.pack_uploads IS 'Creator pack upload management and approval workflow';
