-- Auto-create user_subscriptions record when new user signs up
-- This ensures every user has a subscription record by default

-- 1. Create function to handle new user subscription creation
CREATE OR REPLACE FUNCTION create_default_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default free subscription for new user
  INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_create_user_subscription ON public.profiles;
CREATE TRIGGER trigger_create_user_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_subscription();

-- 3. Create subscription records for existing users who don't have them
INSERT INTO public.user_subscriptions (user_id, tier, status, created_at, updated_at)
SELECT 
  p.id,
  'free',
  'active',
  p.created_at,
  NOW()
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
