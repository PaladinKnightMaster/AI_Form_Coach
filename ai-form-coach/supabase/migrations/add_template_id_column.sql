-- Simple script to add template_id column to plan_sessions table
-- This is the minimal fix for the "template_id does not exist" error

-- Add template_id column to plan_sessions if it doesn't exist
DO $$
BEGIN
    -- Check if template_id column exists in plan_sessions
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plan_sessions' 
        AND column_name = 'template_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the template_id column
        ALTER TABLE public.plan_sessions 
        ADD COLUMN template_id UUID;
        
        -- Add foreign key constraint if plan_templates table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_templates' AND table_schema = 'public') THEN
            ALTER TABLE public.plan_sessions 
            ADD CONSTRAINT fk_plan_sessions_template_id 
            FOREIGN KEY (template_id) REFERENCES public.plan_templates(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Added template_id column to plan_sessions table';
    ELSE
        RAISE NOTICE 'template_id column already exists in plan_sessions table';
    END IF;
END $$;
