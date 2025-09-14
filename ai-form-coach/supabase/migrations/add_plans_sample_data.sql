-- Sample data for plans system
-- Run this after the basic schema is created

-- Insert sample plan templates
INSERT INTO public.plan_templates (name, description, category, goal_type, equipment_required, duration_weeks, difficulty_level, sessions_per_week, avg_session_duration, is_featured, tags) VALUES
('Beginner Bodyweight', 'Perfect for complete beginners. Build strength and confidence with no equipment needed.', 'beginner', 'general_fitness', '{}', 4, 2, 3, 30, true, '{"bodyweight", "beginner", "no-equipment"}'),
('Strength Builder', 'Build real strength with this progressive program. Uses basic equipment to develop functional strength.', 'intermediate', 'strength', '{"dumbbells", "pull-up-bar"}', 6, 5, 4, 45, true, '{"strength", "dumbbells", "intermediate"}'),
('Fat Loss HIIT', 'High-intensity workouts designed to maximize calorie burn and improve cardiovascular fitness.', 'beginner', 'fat_loss', '{}', 4, 6, 4, 25, true, '{"hiit", "fat-loss", "cardio", "bodyweight"}'),
('Advanced Calisthenics', 'Master bodyweight movements with this challenging program for experienced athletes.', 'advanced', 'strength', '{"pull-up-bar", "dip-bars"}', 8, 8, 5, 60, false, '{"calisthenics", "advanced", "bodyweight"}'),
('Home Gym Essentials', 'Complete workout program using minimal home gym equipment.', 'intermediate', 'general_fitness', '{"dumbbells", "resistance-bands", "yoga-mat"}', 6, 4, 3, 40, false, '{"home-gym", "dumbbells", "resistance-bands"}');

-- Insert sample plan sessions for the Beginner Bodyweight plan
DO $$
DECLARE
    beginner_template_id UUID;
BEGIN
    -- Get the Beginner Bodyweight template ID
    SELECT id INTO beginner_template_id FROM public.plan_templates WHERE name = 'Beginner Bodyweight' LIMIT 1;
    
    -- Insert sessions only if template exists
    IF beginner_template_id IS NOT NULL THEN
        INSERT INTO public.plan_sessions (template_id, week_number, day_number, session_name, session_description, exercises, estimated_duration) VALUES
        (beginner_template_id, 1, 1, 'Upper Body Foundation', 'Focus on building upper body strength with basic movements', 
         '[
             {"name": "Push-ups", "sets": 3, "reps": "5-10", "rest": "60s"},
             {"name": "Plank", "sets": 3, "duration": "20-30s", "rest": "60s"},
             {"name": "Wall Push-ups", "sets": 2, "reps": "10-15", "rest": "45s"}
         ]'::jsonb, 25),
        (beginner_template_id, 1, 2, 'Lower Body Basics', 'Build leg strength and stability',
         '[
             {"name": "Bodyweight Squats", "sets": 3, "reps": "10-15", "rest": "60s"},
             {"name": "Lunges", "sets": 2, "reps": "8-12 each leg", "rest": "60s"},
             {"name": "Calf Raises", "sets": 2, "reps": "15-20", "rest": "45s"}
         ]'::jsonb, 25),
        (beginner_template_id, 1, 3, 'Full Body Flow', 'Complete body workout combining upper and lower body movements',
         '[
             {"name": "Burpees", "sets": 3, "reps": "5-8", "rest": "90s"},
             {"name": "Mountain Climbers", "sets": 2, "duration": "30s", "rest": "60s"},
             {"name": "Jumping Jacks", "sets": 2, "duration": "45s", "rest": "60s"}
         ]'::jsonb, 30);
    END IF;
END $$;
