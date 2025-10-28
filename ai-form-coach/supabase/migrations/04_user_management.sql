-- =====================================================
-- MIGRATION 04: USER MANAGEMENT & PROGRESSION
-- User plans, goals, health data, and exercise progression
-- =====================================================

-- =====================================================
-- USER PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    plan_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER GOALS (Nutrition Goals)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calorie_target REAL DEFAULT 2000,
    protein_target REAL DEFAULT 150,
    carbs_target REAL DEFAULT 250,
    fat_target REAL DEFAULT 65,
    fiber_target REAL DEFAULT 25,
    sugar_target REAL DEFAULT 50,
    sodium_target REAL DEFAULT 2300,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =====================================================
-- USER GOALS (Exercise Goals)
-- =====================================================

CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('reps', 'sessions', 'duration', 'weight', 'custom')),
    target_value REAL NOT NULL,
    current_value REAL DEFAULT 0,
    unit TEXT NOT NULL,
    exercise TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HEALTH DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS health_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL CHECK (data_type IN ('weight', 'body_fat', 'muscle_mass', 'heart_rate', 'sleep', 'custom')),
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    source TEXT DEFAULT 'manual',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXERCISE PROGRESSION
-- =====================================================

CREATE TABLE IF NOT EXISTS progression (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    progression_type TEXT NOT NULL CHECK (progression_type IN ('weight', 'reps', 'sets', 'duration', 'intensity')),
    current_value REAL NOT NULL,
    target_value REAL,
    previous_value REAL,
    progression_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_is_active ON user_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_exercise ON goals(exercise);
CREATE INDEX IF NOT EXISTS idx_goals_is_achieved ON goals(is_achieved);

CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_data_type ON health_data(data_type);
CREATE INDEX IF NOT EXISTS idx_health_data_recorded_at ON health_data(recorded_at);

CREATE INDEX IF NOT EXISTS idx_progression_user_id ON progression(user_id);
CREATE INDEX IF NOT EXISTS idx_progression_exercise ON progression(exercise);
CREATE INDEX IF NOT EXISTS idx_progression_progression_type ON progression(progression_type);
CREATE INDEX IF NOT EXISTS idx_progression_progression_date ON progression(progression_date);

-- =====================================================
-- DOCUMENTATION & COMMENTS
-- =====================================================

COMMENT ON TABLE user_plans IS 'User workout plans and program management';
COMMENT ON TABLE goals IS 'User fitness goals and target tracking';
COMMENT ON TABLE health_data IS 'User health metrics and body measurements';
COMMENT ON TABLE progression IS 'Exercise progression tracking and overload management';
