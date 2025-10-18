import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { MonitoringService } from '@/lib/monitoring/alerting';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'active' | 'history'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const monitoringService = new MonitoringService(supabase);
    
    let alerts;
    if (type === 'active') {
      alerts = await monitoringService.getActiveAlerts();
    } else {
      alerts = await monitoringService.getAlertHistory(limit);
    }
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alertId } = body;

    const monitoringService = new MonitoringService(supabase);

    switch (action) {
      case 'resolve':
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
        }
        await monitoringService.resolveAlert(alertId);
        return NextResponse.json({ success: true, message: 'Alert resolved' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}
