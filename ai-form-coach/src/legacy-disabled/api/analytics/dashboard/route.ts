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

    // Check if user has admin access (for now, allow all authenticated users)
    // In production, you might want to restrict this to admin users only
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: AnalyticsFilters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      timeRange: (searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y') || '30d',
      cohortDate: searchParams.get('cohortDate') || undefined,
      deviceType: searchParams.get('deviceType') || undefined,
      exercise: searchParams.get('exercise') || undefined,
      conversionSource: searchParams.get('conversionSource') || undefined
    };

    const analyticsService = new AnalyticsService(supabase);
    const dashboard = await analyticsService.getDashboardSummary(filters);
    
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    );
  }
}
