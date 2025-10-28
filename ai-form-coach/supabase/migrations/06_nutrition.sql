-- =====================================================
-- MIGRATION 06: NUTRITION SYSTEM
-- Food tracking, meals, meal items, and nutrition goals
-- =====================================================

-- =====================================================
-- FOODS (Nutrition Database)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barcode TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    calories_per_100g REAL DEFAULT 0,
    protein_per_100g REAL DEFAULT 0,
    carbs_per_100g REAL DEFAULT 0,
    fat_per_100g REAL DEFAULT 0,
    fiber_per_100g REAL DEFAULT 0,
    sugar_per_100g REAL DEFAULT 0,
    sodium_per_100g REAL DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category TEXT,
    source TEXT DEFAULT 'manual',
    ingredients JSONB,
    detailed_description TEXT
);

-- =====================================================
-- MEALS (Nutrition System)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEAL ITEMS (Nutrition System)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    grams REAL DEFAULT 0,
    calories REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    fiber REAL DEFAULT 0,
    sugar REAL DEFAULT 0,
    sodium REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GOAL ACHIEVEMENTS (Nutrition Goals)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.goal_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calorie_goal_met BOOLEAN DEFAULT false,
    protein_goal_met BOOLEAN DEFAULT false,
    carbs_goal_met BOOLEAN DEFAULT false,
    fat_goal_met BOOLEAN DEFAULT false,
    fiber_goal_met BOOLEAN DEFAULT false,
    sugar_goal_met BOOLEAN DEFAULT false,
    sodium_goal_met BOOLEAN DEFAULT false,
    all_goals_met BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NUTRITION GOALS
-- =====================================================

CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('calories', 'protein', 'carbs', 'fat', 'fiber', 'water')),
    target_value REAL NOT NULL,
    current_value REAL DEFAULT 0,
    unit TEXT NOT NULL,
    goal_date DATE NOT NULL,
    is_achieved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON public.foods(barcode);
CREATE INDEX IF NOT EXISTS idx_foods_verified ON public.foods(verified);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON public.meals(meal_type);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_food_id ON public.meal_items(food_id);

CREATE INDEX IF NOT EXISTS idx_goal_achievements_user_date ON public.goal_achievements(user_id, date);

CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_goal_type ON nutrition_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_goal_date ON nutrition_goals(goal_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Foods policies
CREATE POLICY "Users can view all foods" ON public.foods
    FOR SELECT USING (true);

CREATE POLICY "Users can insert foods" ON public.foods
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update own foods" ON public.foods
    FOR UPDATE USING (auth.uid() = created_by);

-- Meals policies
CREATE POLICY "Users can manage own meals" ON public.meals
    FOR ALL USING (auth.uid() = user_id);

-- Meal items policies
CREATE POLICY "Users can manage meal items for own meals" ON public.meal_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.meals 
            WHERE meals.id = meal_items.meal_id 
            AND meals.user_id = auth.uid()
        )
    );

-- Goal achievements policies
CREATE POLICY "Users can manage own goal achievements" ON public.goal_achievements
    FOR ALL USING (auth.uid() = user_id);

-- Nutrition goals policies
CREATE POLICY "Users can manage own nutrition goals" ON nutrition_goals
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Daily totals materialized view for nutrition tracking
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_totals AS
SELECT 
    m.user_id,
    m.date,
    COALESCE(SUM(mi.calories), 0) as total_calories,
    COALESCE(SUM(mi.protein), 0) as total_protein,
    COALESCE(SUM(mi.carbs), 0) as total_carbs,
    COALESCE(SUM(mi.fat), 0) as total_fat,
    COALESCE(SUM(mi.fiber), 0) as total_fiber,
    COALESCE(SUM(mi.sugar), 0) as total_sugar,
    COALESCE(SUM(mi.sodium), 0) as total_sodium,
    COUNT(DISTINCT m.id) as meal_count,
    NOW() as last_updated
FROM public.meals m
LEFT JOIN public.meal_items mi ON m.id = mi.meal_id
GROUP BY m.user_id, m.date;

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_totals_user_date ON public.daily_totals(user_id, date);

-- Grant permissions
GRANT SELECT ON public.daily_totals TO authenticated;
GRANT SELECT ON public.daily_totals TO anon;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get effective daily targets
CREATE OR REPLACE FUNCTION get_effective_daily_targets(p_user_id UUID, p_date DATE)
RETURNS TABLE(
    calorie_target REAL,
    protein_target REAL,
    carbs_target REAL,
    fat_target REAL,
    fiber_target REAL,
    sugar_target REAL,
    sodium_target REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ug.calorie_target, 2000)::REAL,
        COALESCE(ug.protein_target, 150)::REAL,
        COALESCE(ug.carbs_target, 250)::REAL,
        COALESCE(ug.fat_target, 65)::REAL,
        COALESCE(ug.fiber_target, 25)::REAL,
        COALESCE(ug.sugar_target, 50)::REAL,
        COALESCE(ug.sodium_target, 2300)::REAL
    FROM public.user_goals ug
    WHERE ug.user_id = p_user_id
    ORDER BY ug.created_at DESC
    LIMIT 1;
    
    -- If no goals found, return default values
    IF NOT FOUND THEN
        RETURN QUERY SELECT 2000::REAL, 150::REAL, 250::REAL, 65::REAL, 25::REAL, 50::REAL, 2300::REAL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_effective_daily_targets(UUID, DATE) TO authenticated;

-- =====================================================
-- REFRESH MATERIALIZED VIEW
-- =====================================================

REFRESH MATERIALIZED VIEW public.daily_totals;

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE public.foods IS 'Food database with nutritional information and categories';
COMMENT ON TABLE public.meals IS 'User meal tracking and daily nutrition intake';
COMMENT ON TABLE public.meal_items IS 'Individual food items within user meals';
COMMENT ON TABLE public.goal_achievements IS 'Daily nutrition goal achievement tracking';
COMMENT ON TABLE nutrition_goals IS 'User nutrition goals and target tracking';
