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

    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Get user's participation in the challenge
    const { data: participation, error } = await supabase
      .from('challenge_participations')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching participation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch participation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participation });

  } catch (error) {
    console.error('Participation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participation' },
      { status: 500 }
    );
  }
}
