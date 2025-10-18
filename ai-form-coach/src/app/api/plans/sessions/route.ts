import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const template_id = searchParams.get('template_id');
    const week = searchParams.get('week');
    const day = searchParams.get('day');
    
    if (!template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    let query = supabase
      .from('plan_sessions')
      .select('*')
      .eq('template_id', template_id)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true });
    
    // Apply filters
    if (week) {
      query = query.eq('week_number', parseInt(week));
    }
    
    if (day) {
      query = query.eq('day_number', parseInt(day));
    }
    
    const { data: sessions, error } = await query;
    
    if (error) {
      console.error('Error fetching plan sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plan sessions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
