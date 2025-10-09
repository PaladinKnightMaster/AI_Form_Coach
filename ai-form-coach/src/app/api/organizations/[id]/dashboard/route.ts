import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { OrganizationDashboardFilters } from '@/lib/organizations/types';
import { logEvent } from '@/lib/observability/events';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: OrganizationDashboardFilters = {
      timeRange: (searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y' | 'custom') || '30d',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      includePHI: searchParams.get('includePHI') === 'true',
      exerciseFilter: searchParams.get('exerciseFilter')?.split(','),
      userFilter: searchParams.get('userFilter')?.split(',')
    };

    const orgService = new (await import('@/lib/organizations/service')).OrganizationService(supabase);
    const dashboard = await orgService.getOrganizationDashboard(
      resolvedParams.id,
      user.id,
      filters
    );

    // Log dashboard view event
    logEvent('organization_dashboard_viewed', {
      organizationId: resolvedParams.id,
      userId: user.id,
      timeRange: filters.timeRange,
      includePHI: filters.includePHI
    });
    
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Organization dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization dashboard' },
      { status: 500 }
    );
  }
}
