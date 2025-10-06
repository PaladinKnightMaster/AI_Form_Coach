import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get coach packs
    const { data: coachPacks, error } = await supabase
      .from('coach_packs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coach packs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coach packs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ coachPacks: coachPacks || [] });

  } catch (error) {
    console.error('Coach packs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach packs' },
      { status: 500 }
    );
  }
}
