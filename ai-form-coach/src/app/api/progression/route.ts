import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionMetrics, ReadinessAssessment, WorkoutTarget } from '@/lib/progression/engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exercise = searchParams.get('exercise') as 'squat' | 'pushup' | 'plank';
    
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise parameter is required' }, { status: 400 });
    }

    // Get session history for progression analysis
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        exercise,
        started_at,
        ended_at,
        total_reps,
        total_time_seconds,
        avg_rom_score,
        avg_tempo_ms,
        quality_score
      `)
      .eq('user_id', user.id)
      .eq('exercise', exercise)
      .order('started_at', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 });
    }

    // Get latest readiness assessment
    const { data: readiness, error: readinessError } = await supabase
      .from('readiness_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();

    if (readinessError && readinessError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching readiness assessment:', readinessError);
      return NextResponse.json({ error: 'Failed to fetch readiness data' }, { status: 500 });
    }

    // Get current workout target
    const { data: target, error: targetError } = await supabase
      .from('workout_targets')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise', exercise)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (targetError && targetError.code !== 'PGRST116') {
      console.error('Error fetching workout target:', targetError);
      return NextResponse.json({ error: 'Failed to fetch workout target' }, { status: 500 });
    }

    // Transform session data to SessionMetrics format
    const sessionHistory: SessionMetrics[] = sessions.map(session => ({
      exercise: session.exercise as 'squat' | 'pushup' | 'plank',
      totalReps: session.total_reps || undefined,
      totalTimeSeconds: session.total_time_seconds || undefined,
      avgRomScore: session.avg_rom_score || 0,
      avgTempoMs: session.avg_tempo_ms || 0,
      qualityScore: session.quality_score || 0,
      sessionDate: new Date(session.started_at)
    }));

    // Transform readiness data
    const readinessAssessment: ReadinessAssessment | null = readiness ? {
      sorenessLevel: readiness.soreness_level,
      fatigueLevel: readiness.fatigue_level,
      sleepQuality: readiness.sleep_quality,
      stressLevel: readiness.stress_level,
      motivationLevel: readiness.motivation_level,
      assessmentDate: new Date(readiness.assessment_date)
    } : null;

    // Transform target data
    const currentTarget: WorkoutTarget | null = target ? {
      exercise: target.exercise as 'squat' | 'pushup' | 'plank',
      targetReps: target.target_reps || undefined,
      targetTimeSeconds: target.target_time_seconds || undefined,
      intensity: target.intensity as 'low' | 'moderate' | 'high',
      volume: target.volume as 'low' | 'moderate' | 'high',
      notes: target.notes || undefined
    } : null;

    return NextResponse.json({
      sessionHistory,
      readinessAssessment,
      currentTarget
    });

  } catch (error) {
    console.error('Unexpected error in progression API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'readiness_assessment') {
      const assessment: ReadinessAssessment = data;
      
      const { error } = await supabase
        .from('readiness_assessments')
        .insert({
          user_id: user.id,
          soreness_level: assessment.sorenessLevel,
          fatigue_level: assessment.fatigueLevel,
          sleep_quality: assessment.sleepQuality,
          stress_level: assessment.stressLevel,
          motivation_level: assessment.motivationLevel,
          assessment_date: assessment.assessmentDate.toISOString()
        });

      if (error) {
        console.error('Error saving readiness assessment:', error);
        return NextResponse.json({ error: 'Failed to save readiness assessment' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'workout_target') {
      const target: WorkoutTarget = data;
      
      const { error } = await supabase
        .from('workout_targets')
        .insert({
          user_id: user.id,
          exercise: target.exercise,
          target_reps: target.targetReps || null,
          target_time_seconds: target.targetTimeSeconds || null,
          intensity: target.intensity,
          volume: target.volume,
          notes: target.notes || null
        });

      if (error) {
        console.error('Error saving workout target:', error);
        return NextResponse.json({ error: 'Failed to save workout target' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });

  } catch (error) {
    console.error('Unexpected error in progression API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
