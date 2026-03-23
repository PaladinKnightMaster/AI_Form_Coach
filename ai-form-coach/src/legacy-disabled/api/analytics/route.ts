import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, sessionId, timestamp } = body;

    // Validate required fields
    if (!type || !data || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store analytics data in database
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        event_type: type,
        event_data: data,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Analytics insert error:', insertError);
      return NextResponse.json({ error: 'Failed to store analytics data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type !== 'all') {
      query = query.eq('event_type', type);
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      console.error('Analytics fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
