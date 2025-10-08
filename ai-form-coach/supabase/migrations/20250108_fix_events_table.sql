-- Fix Events Table Mismatch
-- The code references 'events' table but database only has 'analytics_events'
-- This migration creates the missing 'events' table to match the code expectations

-- Create the main events table that the code expects
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON public.events(name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Add RLS policy for events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own events
CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.events IS 'Main events table for user activity tracking and analytics';
COMMENT ON COLUMN public.events.name IS 'Event name (e.g., session_started, pose_quality_low, cue_emitted)';
COMMENT ON COLUMN public.events.payload IS 'Event-specific data as JSON object';
