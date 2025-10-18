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
    const {
      timestamp,
      fps,
      latency,
      jitter,
      visibility,
      cacheHitRate,
      sortTime,
      frameDropRate,
      deviceType,
      sessionId,
      exercise
    } = body;

    // Validate required fields
    if (!timestamp || fps === undefined || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, fps, sessionId' },
        { status: 400 }
      );
    }

    // Validate field types and ranges
    if (typeof timestamp !== 'number' || timestamp < 0) {
      return NextResponse.json(
        { error: 'Invalid timestamp: must be positive number' },
        { status: 400 }
      );
    }

    if (typeof fps !== 'number' || fps < 0 || fps > 120) {
      return NextResponse.json(
        { error: 'Invalid fps: must be between 0 and 120' },
        { status: 400 }
      );
    }

    if (typeof visibility !== 'number' || visibility < 0 || visibility > 1) {
      return NextResponse.json(
        { error: 'Invalid visibility: must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Insert pose quality metric
    const { data, error: insertError } = await supabase
      .from('pose_quality_metrics')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        timestamp: new Date(timestamp).toISOString(),
        visibility_score: Math.max(0, Math.min(1, visibility)),
        stability_score: 0.85, // Placeholder
        tracking_confidence: Math.max(0, Math.min(1, visibility)),
        fps: Math.round(Math.max(0, Math.min(120, fps))),
        dropped_frames: Math.round(Math.max(0, (frameDropRate || 0) * 10)),
        low_visibility_frames: visibility < 0.55 ? 1 : 0,
        average_landmark_visibility: Math.max(0, Math.min(1, visibility)),
        best_side: 'right',
        median_filter_applied: true,
        outlier_rejections: 0,
        kalman_filter_applied: false,
        exercise: exercise || 'unknown',
        model: 'lite',
        device_info: {
          deviceType: deviceType || 'unknown',
          cacheHitRate: Math.max(0, Math.min(1, cacheHitRate || 0)),
          sortTime: Math.max(0, sortTime || 0),
          latency: Math.max(0, latency || 0)
        }
      });

    if (insertError) {
      console.error('Pose metrics insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert pose metrics', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.[0]?.id || null
    });
  } catch (error) {
    console.error('Pose metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('pose_quality_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Pose metrics fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pose metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      metrics: data || []
    });
  } catch (error) {
    console.error('Pose metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
