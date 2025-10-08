-- Add device calibration table for personalized thresholds
-- This allows per-user calibration of exercise-specific angles and targets

-- First, drop the table if it exists (to ensure clean creation)
DROP TABLE IF EXISTS public.device_calibration CASCADE;

-- Create device_calibration table
CREATE TABLE public.device_calibration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Exercise-specific calibration values
    squat_full_depth_angle REAL,
    pushup_elbow_bottom_angle REAL,
    bodyline_target REAL,
    
    -- Metadata
    calibration_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    UNIQUE(user_id, device_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_calibration_user_id ON public.device_calibration(user_id);
CREATE INDEX IF NOT EXISTS idx_device_calibration_device_id ON public.device_calibration(device_id);
CREATE INDEX IF NOT EXISTS idx_device_calibration_active ON public.device_calibration(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.device_calibration ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calibration data" ON public.device_calibration;
DROP POLICY IF EXISTS "Users can insert own calibration data" ON public.device_calibration;
DROP POLICY IF EXISTS "Users can update own calibration data" ON public.device_calibration;
DROP POLICY IF EXISTS "Users can delete own calibration data" ON public.device_calibration;

-- Create RLS policies
CREATE POLICY "Users can view own calibration data" ON public.device_calibration
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calibration data" ON public.device_calibration
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calibration data" ON public.device_calibration
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calibration data" ON public.device_calibration
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_device_calibration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_device_calibration_updated_at ON public.device_calibration;
CREATE TRIGGER trigger_update_device_calibration_updated_at
    BEFORE UPDATE ON public.device_calibration
    FOR EACH ROW
    EXECUTE FUNCTION update_device_calibration_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.device_calibration IS 'Per-user device calibration data for personalized exercise thresholds';
COMMENT ON COLUMN public.device_calibration.squat_full_depth_angle IS 'Median knee angle at bottom of squat (degrees)';
COMMENT ON COLUMN public.device_calibration.pushup_elbow_bottom_angle IS 'Median elbow angle at bottom of pushup (degrees)';
COMMENT ON COLUMN public.device_calibration.bodyline_target IS 'Mean shoulder-hip-ankle line angle for plank (degrees)';
COMMENT ON COLUMN public.device_calibration.device_id IS 'Browser fingerprint or device identifier for multi-device support';
COMMENT ON COLUMN public.device_calibration.calibration_version IS 'Version number for future calibration schema changes';