/**
 * API Endpoint: Get User's Best Sessions
 * 
 * GET /api/embeddings/best?exercise=squat&user_id=xxx
 * Gets user's best performing sessions for comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const exercise = searchParams.get('exercise') as 'squat' | 'pushup' | 'plank';
    const userId = searchParams.get('user_id') || user.id;

    if (!exercise) {
      return NextResponse.json(
        { error: 'exercise parameter is required' },
        { status: 400 }
      );
    }

    if (!['squat', 'pushup', 'plank'].includes(exercise)) {
      return NextResponse.json(
        { error: 'Invalid exercise type' },
        { status: 400 }
      );
    }

    // Verify user can access this data
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this data' },
        { status: 403 }
      );
    }

    // Get user's best sessions using the database function
    const { data: bestSessions, error: bestError } = await supabase.rpc(
      'get_user_best_session',
      {
        p_user_id: userId,
        p_exercise: exercise
      }
    );

    if (bestError) {
      console.error('Failed to get best sessions:', bestError);
      return NextResponse.json(
        { error: 'Failed to get best sessions' },
        { status: 500 }
      );
    }

    // Format response
    const formattedSessions = (bestSessions || []).map((session: {
      session_id: string;
      total_reps: number;
      avg_quality: number;
      avg_rom: number;
      created_at: string;
      is_best_reps: boolean;
      is_best_quality: boolean;
      is_best_rom: boolean;
    }) => ({
      sessionId: session.session_id,
      totalReps: session.total_reps,
      avgQuality: session.avg_quality,
      avgRom: session.avg_rom,
      createdAt: session.created_at,
      isBestReps: session.is_best_reps,
      isBestQuality: session.is_best_quality,
      isBestRom: session.is_best_rom
    }));

    return NextResponse.json({
      bestSessions: formattedSessions,
      exercise,
      total: formattedSessions.length
    });

  } catch (error) {
    console.error('Error in best sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
