import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Check if user already joined
    const { data: existingParticipation } = await supabase
      .from('challenge_participations')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (existingParticipation) {
      return NextResponse.json({ error: 'You are already participating in this challenge' }, { status: 400 });
    }

    // Join the challenge
    const { data: participation, error: joinError } = await supabase
      .from('challenge_participations')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        progress_value: 0,
        completion_percentage: 0,
        is_completed: false,
      })
      .select()
      .single();

    if (joinError) {
      console.error('Error joining challenge:', joinError);
      return NextResponse.json(
        { error: 'Failed to join challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participation });

  } catch (error) {
    console.error('Join challenge API error:', error);
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    );
  }
}
