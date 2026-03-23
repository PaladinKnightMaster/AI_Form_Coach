import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { AnalyticsService } from '@/lib/analytics/service';
import type { AnalyticsEventData } from '@/lib/analytics/types';

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventData, sessionId } = body;

    if (!eventData || !eventData.eventType || !eventData.eventName) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    const analyticsService = new AnalyticsService(supabase);
    await analyticsService.trackEvent(eventData as AnalyticsEventData, user.id, sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
