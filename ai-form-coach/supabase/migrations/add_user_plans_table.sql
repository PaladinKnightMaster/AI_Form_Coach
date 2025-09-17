-- Create user_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.plan_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    current_week INTEGER DEFAULT 1,
    current_day INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    plan_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_template_id ON public.user_plans(template_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_is_active ON public.user_plans(is_active);

-- Add RLS (Row Level Security) policy
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own plans
CREATE POLICY "Users can manage their own plans" ON public.user_plans
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_plans_updated_at 
    BEFORE UPDATE ON public.user_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
