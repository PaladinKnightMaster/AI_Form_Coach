import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { AnalyticsService } from '@/lib/analytics/service';
import { MonitoringService } from '@/lib/monitoring/alerting';

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timeRange = '30d' } = body;

    const analyticsService = new AnalyticsService(supabase);
    const monitoringService = new MonitoringService(supabase);

    // Get current metrics
    const [retention, sessions, conversion, quality, performance] = await Promise.all([
      analyticsService.getRetentionMetrics({ timeRange }),
      analyticsService.getSessionMetrics({ timeRange }),
      analyticsService.getProConversionMetrics({ timeRange }),
      analyticsService.getQualityMetrics({ timeRange }),
      analyticsService.getPerformanceGuardrails()
    ]);

    // Check metrics against alert rules
    const newAlerts = await monitoringService.checkMetrics(
      retention,
      sessions,
      conversion,
      quality,
      performance
    );

    // Send notifications for new alerts
    if (newAlerts.length > 0) {
      await monitoringService.sendAlertNotifications(newAlerts);
    }

    return NextResponse.json({
      success: true,
      alertsGenerated: newAlerts.length,
      alerts: newAlerts,
      metrics: {
        retention,
        sessions,
        conversion,
        quality,
        performance
      }
    });
  } catch (error) {
    console.error('Monitoring check API error:', error);
    return NextResponse.json(
      { error: 'Failed to check metrics and generate alerts' },
      { status: 500 }
    );
  }
}
