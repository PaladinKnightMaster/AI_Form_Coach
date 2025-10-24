import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { metrics } = body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: metrics must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate batch size (max 1000 per batch)
    if (metrics.length > 1000) {
      return NextResponse.json(
        { error: 'Batch too large: maximum 1000 metrics per request' },
        { status: 400 }
      );
    }

    // Validate metrics
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];

      if (!metric.timestamp || typeof metric.fps !== 'number') {
        return NextResponse.json(
          { error: `Invalid metric at index ${i}: missing timestamp or fps` },
          { status: 400 }
        );
      }

      // Validate ranges
      if (metric.fps < 0 || metric.fps > 120) {
        return NextResponse.json(
          { error: `Invalid metric at index ${i}: fps out of range [0-120]` },
          { status: 400 }
        );
      }

      if (metric.visibility && (metric.visibility < 0 || metric.visibility > 1)) {
        return NextResponse.json(
          { error: `Invalid metric at index ${i}: visibility out of range [0-1]` },
          { status: 400 }
        );
      }
    }

    // Transform metrics for database insertion
    const metricsToInsert = metrics.map((metric: Record<string, unknown>) => ({
      user_id: user.id,
      session_id: metric.sessionId || 'unknown',
      timestamp: new Date(metric.timestamp as number).toISOString(),
      visibility_score: Math.max(0, Math.min(1, (metric.visibility as number) || 0)),
      stability_score: 0.85, // Placeholder
      tracking_confidence: Math.max(0, Math.min(1, (metric.visibility as number) || 0)),
      fps: Math.round(Math.max(0, Math.min(120, (metric.fps as number) || 0))),
      dropped_frames: Math.round(Math.max(0, ((metric.frameDropRate as number) || 0) * 10)),
      low_visibility_frames: ((metric.visibility as number) || 0) < 0.55 ? 1 : 0,
      average_landmark_visibility: Math.max(0, Math.min(1, (metric.visibility as number) || 0)),
      best_side: 'right',
      median_filter_applied: true,
      outlier_rejections: 0,
      kalman_filter_applied: false,
      exercise: metric.exercise || 'unknown',
      model: 'lite',
        device_info: {
          deviceType: (metric.deviceType as string) || 'unknown',
          cacheHitRate: Math.max(0, Math.min(1, (metric.cacheHitRate as number) || 0)),
          sortTime: Math.max(0, (metric.sortTime as number) || 0),
          latency: Math.max(0, (metric.latency as number) || 0)
        }
    }));

    // Batch insert with retry logic
    let insertError: unknown = null;
    let data: unknown = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const result = await supabase
          .from('pose_quality_metrics')
          .insert(metricsToInsert);
        
        data = result.data;
        insertError = result.error;
        
        if (!insertError) break;
        
        retries++;
        if (retries < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 50));
        }
      } catch (err) {
        console.error(`Batch insert attempt ${retries + 1} failed:`, err);
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 50));
        }
      }
    }

    if (insertError && retries >= maxRetries) {
      console.error('Batch pose metrics insert failed after retries:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert batch metrics', details: (insertError as Error)?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: (data as unknown[])?.length || metricsToInsert.length,
      total: metrics.length
    });
  } catch (error) {
    console.error('Batch pose metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
