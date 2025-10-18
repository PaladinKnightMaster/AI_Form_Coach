import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { AnalyticsService } from '@/lib/analytics/service';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyticsService = new AnalyticsService(supabase);
    const guardrails = await analyticsService.getPerformanceGuardrails();
    
    return NextResponse.json(guardrails);
  } catch (error) {
    console.error('Guardrails API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guardrails' },
      { status: 500 }
    );
  }
}
