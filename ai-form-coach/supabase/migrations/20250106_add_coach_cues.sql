-- Create coach_cues table for mentor cue system
-- This migration adds the A5 mentor cue system with priority and cooldown management

-- Create coach_cues table
CREATE TABLE IF NOT EXISTS public.coach_cues (
    key TEXT PRIMARY KEY,
    severity SMALLINT NOT NULL CHECK (severity >= 1 AND severity <= 5),
    short TEXT NOT NULL,
    long TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_cues_severity ON public.coach_cues(severity);
CREATE INDEX IF NOT EXISTS idx_coach_cues_key ON public.coach_cues(key);

-- Add comments for documentation
COMMENT ON TABLE public.coach_cues IS 'Coach cues for mentor system with priority and cooldown management';
COMMENT ON COLUMN public.coach_cues.key IS 'Unique cue identifier (e.g., knees_out, go_deeper)';
COMMENT ON COLUMN public.coach_cues.severity IS 'Cue priority/severity (1=low, 5=critical)';
COMMENT ON COLUMN public.coach_cues.short IS 'Short cue text for HUD display';
COMMENT ON COLUMN public.coach_cues.long IS 'Longer explanation text for detailed feedback';

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_coach_cues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_coach_cues_updated_at ON public.coach_cues;
CREATE TRIGGER trigger_update_coach_cues_updated_at
    BEFORE UPDATE ON public.coach_cues
    FOR EACH ROW
    EXECUTE FUNCTION update_coach_cues_updated_at();

-- Seed comprehensive coach cues data (Mentor Cues 2.0)
INSERT INTO public.coach_cues (key, severity, short, long) VALUES
    -- Critical cues (severity 5) - Safety issues
    ('knee_valgus', 5, 'Knees collapsing', 'Your knees are collapsing inward - push them out to prevent injury'),
    ('back_rounding', 5, 'Back rounding', 'Keep your back straight - rounding can cause injury'),
    ('excessive_forward_lean', 5, 'Too far forward', 'Bring your chest up - you are leaning too far forward'),
    
    -- High priority cues (severity 4) - Form corrections
    ('knees_out', 4, 'Knees out', 'Push your knees out to maintain proper alignment'),
    ('depth_low', 4, 'Need more depth', 'Go deeper to complete the full range of motion'),
    ('chest_drop', 4, 'Chest dropping', 'Keep your chest up and maintain proper posture'),
    ('body_straight', 4, 'Body straight', 'Maintain a straight body line from head to heels'),
    ('core_engaged', 4, 'Engage core', 'Tighten your core muscles for better stability'),
    ('weight_heels', 4, 'Weight on heels', 'Keep your weight on your heels, not your toes'),
    
    -- Medium priority cues (severity 3) - Technique improvements
    ('go_deeper', 3, 'Go deeper', 'Lower your body more to achieve full range of motion'),
    ('chest_up', 3, 'Chest up', 'Keep your chest up and maintain a proud posture'),
    ('hip_sag', 3, 'Hips sagging', 'Keep your hips up and maintain body alignment'),
    ('bodyline_poor', 3, 'Poor alignment', 'Maintain a straight body line throughout the movement'),
    ('shoulders_back', 3, 'Shoulders back', 'Pull your shoulders back and down'),
    ('head_neutral', 3, 'Head neutral', 'Keep your head in a neutral position'),
    ('breathing_control', 3, 'Control breathing', 'Breathe in on the way down, out on the way up'),
    
    -- Low priority cues (severity 2) - Tempo and rhythm
    ('tempo_fast', 2, 'Too fast', 'Slow down for better control and form'),
    ('tempo_slow', 2, 'Too slow', 'Pick up the pace slightly for better rhythm'),
    ('pace_up', 2, 'Faster pace', 'Increase your tempo slightly for better rhythm'),
    ('pace_down', 2, 'Slower pace', 'Slow down your tempo for better control'),
    ('smooth_movement', 2, 'Smooth movement', 'Make your movement more fluid and controlled'),
    ('consistent_tempo', 2, 'Consistent tempo', 'Keep the same pace throughout your reps'),
    
    -- Positive reinforcement cues (severity 1) - Encouragement
    ('nice_tempo', 1, 'Nice tempo!', 'Great rhythm and control - keep it up!'),
    ('perfect_form', 1, 'Perfect form!', 'Excellent technique - you are doing great!'),
    ('great_depth', 1, 'Great depth!', 'Perfect range of motion - well done!'),
    ('solid_control', 1, 'Solid control!', 'Your movement control is excellent!'),
    ('keep_going', 1, 'Keep going!', 'You are doing great - maintain this form!'),
    ('excellent_alignment', 1, 'Excellent alignment!', 'Your body alignment is perfect!'),
    ('strong_core', 1, 'Strong core!', 'Great core engagement - keep it tight!'),
    ('smooth_rhythm', 1, 'Smooth rhythm!', 'Your tempo and rhythm are perfect!')
ON CONFLICT (key) DO UPDATE SET
    severity = EXCLUDED.severity,
    short = EXCLUDED.short,
    long = EXCLUDED.long,
    updated_at = NOW();

-- Add RLS policies
ALTER TABLE public.coach_cues ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to coach cues" ON public.coach_cues
    FOR SELECT USING (true);

-- Allow admin users to modify cues (optional - for future admin panel)
CREATE POLICY "Allow admin to modify coach cues" ON public.coach_cues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
