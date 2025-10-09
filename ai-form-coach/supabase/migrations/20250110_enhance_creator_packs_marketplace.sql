-- Enhanced Creator Packs Marketplace Schema
-- This migration enhances the existing coach_packs table and adds new tables for the Creator Packs marketplace

-- 1. Enhance existing coach_packs table with new Creator Packs fields
ALTER TABLE public.coach_packs 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS preview JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS creator JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Update existing name column to title if title is null
UPDATE public.coach_packs 
SET title = name 
WHERE title IS NULL;

-- Make title not null after update
ALTER TABLE public.coach_packs 
  ALTER COLUMN title SET NOT NULL;

-- 2. Enhance existing coach_pack_purchases table (already exists in monetization schema)
-- Add missing columns if they don't exist (most columns already exist)
-- Note: The table already has: user_id, coach_pack_id, stripe_payment_intent_id, amount, currency, status, purchased_at

-- 3. Create pack_reviews table for user reviews
CREATE TABLE IF NOT EXISTS public.pack_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES public.coach_packs(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    would_recommend BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one review per user per pack
    UNIQUE(user_id, pack_id)
);

-- 4. Create pack_uploads table for creator upload management (dev-only for now)
CREATE TABLE IF NOT EXISTS public.pack_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_data JSONB NOT NULL,
    validation_result JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Link to published pack
    published_pack_id UUID REFERENCES public.coach_packs(id) ON DELETE SET NULL
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_packs_title ON public.coach_packs(title);
CREATE INDEX IF NOT EXISTS idx_coach_packs_difficulty ON public.coach_packs(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_coach_packs_duration ON public.coach_packs(duration_weeks);
CREATE INDEX IF NOT EXISTS idx_coach_packs_price ON public.coach_packs(price);
CREATE INDEX IF NOT EXISTS idx_coach_packs_rating ON public.coach_packs(rating);
CREATE INDEX IF NOT EXISTS idx_coach_packs_purchase_count ON public.coach_packs(purchase_count);
CREATE INDEX IF NOT EXISTS idx_coach_packs_is_featured ON public.coach_packs(is_featured);
CREATE INDEX IF NOT EXISTS idx_coach_packs_created_at ON public.coach_packs(created_at);

CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_user_id ON public.coach_pack_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_pack_id ON public.coach_pack_purchases(coach_pack_id);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_purchased_at ON public.coach_pack_purchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_coach_pack_purchases_status ON public.coach_pack_purchases(status);

CREATE INDEX IF NOT EXISTS idx_pack_reviews_user_id ON public.pack_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_pack_id ON public.pack_reviews(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_rating ON public.pack_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_pack_reviews_created_at ON public.pack_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_pack_uploads_creator_id ON public.pack_uploads(creator_id);
CREATE INDEX IF NOT EXISTS idx_pack_uploads_status ON public.pack_uploads(status);
CREATE INDEX IF NOT EXISTS idx_pack_uploads_created_at ON public.pack_uploads(created_at);

-- 6. Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_coach_packs_preview_gin ON public.coach_packs USING GIN (preview);
CREATE INDEX IF NOT EXISTS idx_coach_packs_creator_gin ON public.coach_packs USING GIN (creator);
CREATE INDEX IF NOT EXISTS idx_coach_packs_program_data_gin ON public.coach_packs USING GIN (program_data);
CREATE INDEX IF NOT EXISTS idx_pack_uploads_pack_data_gin ON public.pack_uploads USING GIN (pack_data);

-- 7. Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_coach_packs_tags_gin ON public.coach_packs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_coach_packs_target_goals_gin ON public.coach_packs USING GIN (target_goals);
CREATE INDEX IF NOT EXISTS idx_coach_packs_equipment_gin ON public.coach_packs USING GIN (equipment_required);

-- 8. Enable Row Level Security (coach_pack_purchases already has RLS from monetization schema)
ALTER TABLE public.pack_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_uploads ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for coach_pack_purchases (if not already exists)
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.coach_pack_purchases;
CREATE POLICY "Users can view their own purchases" ON public.coach_pack_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.coach_pack_purchases;
CREATE POLICY "Users can insert their own purchases" ON public.coach_pack_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Create RLS policies for pack_reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.pack_reviews;
CREATE POLICY "Anyone can view reviews" ON public.pack_reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.pack_reviews;
CREATE POLICY "Users can insert their own reviews" ON public.pack_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.pack_reviews;
CREATE POLICY "Users can update their own reviews" ON public.pack_reviews
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.pack_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.pack_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Create RLS policies for pack_uploads (dev-only for now)
DROP POLICY IF EXISTS "Creators can view their own uploads" ON public.pack_uploads;
CREATE POLICY "Creators can view their own uploads" ON public.pack_uploads
    FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can insert their own uploads" ON public.pack_uploads;
CREATE POLICY "Creators can insert their own uploads" ON public.pack_uploads
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their own uploads" ON public.pack_uploads;
CREATE POLICY "Creators can update their own uploads" ON public.pack_uploads
    FOR UPDATE USING (auth.uid() = creator_id);

-- 12. Create functions for updating pack statistics
CREATE OR REPLACE FUNCTION update_pack_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pack rating and review count
    UPDATE public.coach_packs 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.pack_reviews 
            WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM public.pack_reviews 
            WHERE pack_id = COALESCE(NEW.pack_id, OLD.pack_id)
        )
    WHERE id = COALESCE(NEW.pack_id, OLD.pack_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pack_purchase_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pack purchase count
    UPDATE public.coach_packs 
    SET purchase_count = (
        SELECT COUNT(*) 
        FROM public.coach_pack_purchases 
        WHERE coach_pack_id = COALESCE(NEW.coach_pack_id, OLD.coach_pack_id)
        AND status = 'completed'
    )
    WHERE id = COALESCE(NEW.coach_pack_id, OLD.coach_pack_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for automatic statistics updates
DROP TRIGGER IF EXISTS trigger_update_pack_rating ON public.pack_reviews;
CREATE TRIGGER trigger_update_pack_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.pack_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_pack_rating();

DROP TRIGGER IF EXISTS trigger_update_pack_purchase_count ON public.coach_pack_purchases;
CREATE TRIGGER trigger_update_pack_purchase_count
    AFTER INSERT OR UPDATE OR DELETE ON public.coach_pack_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_pack_purchase_count();

-- 14. Create function to check if user has purchased a pack
CREATE OR REPLACE FUNCTION user_has_purchased_pack(user_uuid UUID, pack_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.coach_pack_purchases 
        WHERE user_id = user_uuid 
        AND coach_pack_id = pack_uuid 
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to get pack details with purchase status
CREATE OR REPLACE FUNCTION get_pack_with_purchase_status(pack_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    pack_data JSONB,
    is_purchased BOOLEAN,
    user_review JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(cp.*) as pack_data,
        CASE 
            WHEN user_uuid IS NULL THEN false
            ELSE user_has_purchased_pack(user_uuid, pack_uuid)
        END as is_purchased,
        CASE 
            WHEN user_uuid IS NULL THEN NULL
            ELSE (
                SELECT to_jsonb(pr.*) 
                FROM public.pack_reviews pr 
                WHERE pr.pack_id = pack_uuid 
                AND pr.user_id = user_uuid
                LIMIT 1
            )
        END as user_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Add comments for documentation
COMMENT ON TABLE public.coach_pack_purchases IS 'User purchases of creator packs with Stripe integration';
COMMENT ON TABLE public.pack_reviews IS 'User reviews and ratings for creator packs';
COMMENT ON TABLE public.pack_uploads IS 'Creator pack uploads and review process (dev-only)';
COMMENT ON FUNCTION user_has_purchased_pack(UUID, UUID) IS 'Check if a user has purchased a specific pack';
COMMENT ON FUNCTION get_pack_with_purchase_status(UUID, UUID) IS 'Get pack details with user purchase status and review';

-- 17. Update existing coach_packs with sample enhanced data
UPDATE public.coach_packs 
SET 
    title = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN 'Beginner Bodyweight Program'
        WHEN name = 'Intermediate Strength Builder' THEN 'Intermediate Strength Builder'
        WHEN name = 'Advanced Athlete Program' THEN 'Advanced Athlete Program'
        ELSE name
    END,
    short_description = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN 'Perfect for fitness beginners. Build strength and confidence with bodyweight exercises.'
        WHEN name = 'Intermediate Strength Builder' THEN 'Take your fitness to the next level with progressive strength training.'
        WHEN name = 'Advanced Athlete Program' THEN 'Elite-level training for serious athletes and fitness enthusiasts.'
        ELSE description
    END,
    preview = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN '{
            "sampleWorkouts": [
                {"id": "1", "title": "Foundation Day", "duration": 20, "exercises": ["squat", "pushup", "plank"], "difficulty": "beginner", "isUnlocked": false},
                {"id": "2", "title": "Strength Builder", "duration": 25, "exercises": ["squat", "pushup"], "difficulty": "beginner", "isUnlocked": false}
            ],
            "highlights": ["No equipment needed", "Perfect for beginners", "Progressive difficulty"],
            "requirements": ["Basic fitness level", "20-30 minutes per day"]
        }'::jsonb
        WHEN name = 'Intermediate Strength Builder' THEN '{
            "sampleWorkouts": [
                {"id": "1", "title": "Upper Body Power", "duration": 35, "exercises": ["pushup", "custom"], "difficulty": "intermediate", "isUnlocked": false},
                {"id": "2", "title": "Lower Body Strength", "duration": 40, "exercises": ["squat", "custom"], "difficulty": "intermediate", "isUnlocked": false}
            ],
            "highlights": ["Equipment-based training", "Progressive overload", "Strength focused"],
            "requirements": ["6+ months experience", "Basic equipment", "45 minutes per day"]
        }'::jsonb
        WHEN name = 'Advanced Athlete Program' THEN '{
            "sampleWorkouts": [
                {"id": "1", "title": "Elite Conditioning", "duration": 50, "exercises": ["squat", "pushup", "plank", "custom"], "difficulty": "advanced", "isUnlocked": false},
                {"id": "2", "title": "Power Development", "duration": 45, "exercises": ["squat", "custom"], "difficulty": "advanced", "isUnlocked": false}
            ],
            "highlights": ["Elite-level training", "Advanced techniques", "Performance focused"],
            "requirements": ["2+ years experience", "Full equipment access", "60+ minutes per day"]
        }'::jsonb
        ELSE '{}'::jsonb
    END,
    creator = '{
        "name": "AI Form Coach Team",
        "bio": "Expert fitness professionals with years of experience in form coaching and program design.",
        "credentials": ["Certified Personal Trainer", "Form Specialist"],
        "experience": "5+ years",
        "verified": true
    }'::jsonb,
    tags = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN '{"beginner", "bodyweight", "strength", "foundation"}'::text[]
        WHEN name = 'Intermediate Strength Builder' THEN '{"intermediate", "strength", "muscle", "progressive"}'::text[]
        WHEN name = 'Advanced Athlete Program' THEN '{"advanced", "athlete", "performance", "elite"}'::text[]
        ELSE '{}'::text[]
    END,
    target_goals = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN '{"strength", "endurance", "form", "confidence"}'::text[]
        WHEN name = 'Intermediate Strength Builder' THEN '{"strength", "muscle_growth", "power", "progression"}'::text[]
        WHEN name = 'Advanced Athlete Program' THEN '{"strength", "power", "endurance", "athleticism", "performance"}'::text[]
        ELSE '{}'::text[]
    END,
    is_featured = true,
    rating = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN 4.8
        WHEN name = 'Intermediate Strength Builder' THEN 4.6
        WHEN name = 'Advanced Athlete Program' THEN 4.9
        ELSE 0
    END,
    review_count = CASE 
        WHEN name = 'Beginner Bodyweight Program' THEN 127
        WHEN name = 'Intermediate Strength Builder' THEN 89
        WHEN name = 'Advanced Athlete Program' THEN 156
        ELSE 0
    END
WHERE name IN ('Beginner Bodyweight Program', 'Intermediate Strength Builder', 'Advanced Athlete Program');

