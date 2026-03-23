/**
 * API Endpoint: Find Similar Sessions
 * 
 * GET /api/embeddings/similar?session_id=xxx&user_id=xxx&limit=5
 * Finds sessions similar to a given session using vector similarity
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
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id') || user.id;
    const limit = parseInt(searchParams.get('limit') || '5');
    const minSimilarity = parseFloat(searchParams.get('min_similarity') || '0.7');
    const exercise = searchParams.get('exercise') as 'squat' | 'pushup' | 'plank' | null;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

    // Verify user can access this session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, exercise')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' },
        { status: 403 }
      );
    }

    // Find similar sessions using the database function
    const { data: similarSessions, error: similarError } = await supabase.rpc(
      'find_similar_sessions',
      {
        p_session_id: sessionId,
        p_user_id: userId,
        p_limit: limit,
        p_min_similarity: minSimilarity,
        p_exercise: exercise
      }
    );

    if (similarError) {
      console.error('Failed to find similar sessions:', similarError);
      return NextResponse.json(
        { error: 'Failed to find similar sessions' },
        { status: 500 }
      );
    }

    // Format response
    const formattedSessions = (similarSessions || []).map((session: {
      similar_session_id: string;
      similarity: number;
      exercise: string;
      created_at: string;
      total_reps: number;
      avg_quality: number;
      avg_rom: number;
    }) => ({
      sessionId: session.similar_session_id,
      similarity: session.similarity,
      exercise: session.exercise,
      createdAt: session.created_at,
      totalReps: session.total_reps,
      avgQuality: session.avg_quality,
      avgRom: session.avg_rom
    }));

    return NextResponse.json({
      similarSessions: formattedSessions,
      total: formattedSessions.length
    });

  } catch (error) {
    console.error('Error in similar sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
