import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { AnalyticsService } from '@/lib/analytics/service';
import type { AnalyticsFilters } from '@/lib/analytics/types';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: AnalyticsFilters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      timeRange: (searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y') || '30d',
      exercise: searchParams.get('exercise') || undefined
    };

    const analyticsService = new AnalyticsService(supabase);
    const sessions = await analyticsService.getSessionMetrics(filters);
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Session metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session metrics' },
      { status: 500 }
    );
  }
}
