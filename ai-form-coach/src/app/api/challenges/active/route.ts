import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get active monthly challenge
    const now = new Date().toISOString();
    const { data: challenge, error } = await supabase
      .from('monthly_challenges')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', now)
      .lte('start_date', now)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active challenge:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge });

  } catch (error) {
    console.error('Active challenge API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active challenge' },
      { status: 500 }
    );
  }
}
