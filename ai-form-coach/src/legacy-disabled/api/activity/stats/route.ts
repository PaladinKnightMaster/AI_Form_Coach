import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ActivityStats } from '@/types/activity';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's session statistics
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('started_at, total_reps, total_time_seconds, quality_score')
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch session data' },
        { status: 500 }
      );
    }

    // Get user's achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id);

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
    }

    // Get user's challenge participations
    let challenges, challengesError;
    
    try {
      const result = await supabase
        .from('challenge_participations')
        .select('challenge_id, is_completed')
        .eq('user_id', user.id);
      
      challenges = result.data;
      challengesError = result.error;
    } catch {
      // Fallback: try with 'completed' column if 'is_completed' doesn't exist
      try {
        const result = await supabase
          .from('challenge_participations')
          .select('challenge_id, completed')
          .eq('user_id', user.id);
        
        challenges = result.data;
        challengesError = result.error;
      } catch (fallbackError) {
        console.error('Error fetching challenges:', fallbackError);
        challenges = [];
        challengesError = fallbackError;
      }
    }

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
    }

    // Calculate statistics
    const totalWorkouts = sessions?.length || 0;
    const totalDuration = sessions?.reduce((sum, session) => 
      sum + (session.total_time_seconds || 0), 0) || 0;
    const totalReps = sessions?.reduce((sum, session) => 
      sum + (session.total_reps || 0), 0) || 0;
    const totalCalories = Math.round(totalReps * 0.5); // Rough estimate

    // Calculate streak
    const sortedSessions = (sessions || [])
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].started_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate weekly progress (assuming 3 workouts per week goal)
    const weeklyGoal = 3;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklySessions = (sessions || []).filter(session => 
      new Date(session.started_at) >= weekStart
    );
    const weeklyProgress = weeklySessions.length;

    const stats: ActivityStats = {
      totalWorkouts,
      totalDuration: Math.floor(totalDuration / 60), // Convert to minutes
      totalReps,
      totalCalories,
      streak,
      weeklyGoal,
      weeklyProgress,
      achievements: achievements?.length || 0,
              challengesCompleted: challenges?.filter((c: { is_completed?: boolean; completed?: boolean }) => {
        // Handle both possible column names for backward compatibility
        return c.is_completed === true || c.completed === true;
      }).length || 0
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity stats' },
      { status: 500 }
    );
  }
}
