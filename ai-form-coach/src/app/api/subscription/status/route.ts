import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/subscription/subscriptionService';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await subscriptionService.getUserSubscription(user.id);
    const features = await subscriptionService.getUserFeatures(user.id);

    return NextResponse.json({
      subscription,
      features,
      tier: subscription?.tier || 'free'
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
