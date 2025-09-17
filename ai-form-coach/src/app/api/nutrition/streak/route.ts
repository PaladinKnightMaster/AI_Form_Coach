import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current streak
    const { data: streakData, error: streakError } = await supabase
      .rpc('get_current_streak', {
        p_user_id: user.id
      });

    if (streakError) {
      console.error('Error fetching streak:', streakError);
      return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
    }

    const currentStreak = streakData || 0;

    // Get recent achievements for streak visualization
    const { data: recentAchievements, error: achievementsError } = await supabase
      .from('goal_achievements')
      .select('date, all_goals_met')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30); // Last 30 days

    if (achievementsError) {
      console.error('Error fetching recent achievements:', achievementsError);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    return NextResponse.json({ 
      currentStreak,
      recentAchievements: recentAchievements || []
    });
  } catch (error) {
    console.error('Streak API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
