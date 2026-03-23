import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import type { LeaderboardEntry } from '@/types/activity';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exercise = searchParams.get('exercise') as 'squat' | 'pushup' | 'plank';
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!exercise || !period) {
      return NextResponse.json(
        { error: 'Exercise and period parameters are required' },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get leaderboard data based on exercise type
    let leaderboardQuery;
    
    switch (exercise) {
      case 'squat':
      case 'pushup':
        // For rep-based exercises, sum total reps
        leaderboardQuery = supabase
          .from('sessions')
          .select(`
            user_id,
            total_reps,
            profiles!inner(
              id,
              username,
              avatar_url
            )
          `)
          .eq('exercise', exercise)
          .gte('started_at', startDate.toISOString())
          .order('total_reps', { ascending: false });
        break;
        
      case 'plank':
        // For time-based exercises, sum total time
        leaderboardQuery = supabase
          .from('sessions')
          .select(`
            user_id,
            total_time_seconds,
            profiles!inner(
              id,
              username,
              avatar_url
            )
          `)
          .eq('exercise', exercise)
          .gte('started_at', startDate.toISOString())
          .order('total_time_seconds', { ascending: false });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid exercise type' },
          { status: 400 }
        );
    }

    const { data: sessions, error: sessionsError } = await leaderboardQuery;

    if (sessionsError) {
      console.error('Error fetching leaderboard data:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    // Group by user and calculate totals
    const userStats = new Map<string, {
      userId: string;
      userName: string;
      avatarUrl?: string;
      totalScore: number;
      sessionCount: number;
    }>();

    (sessions || []).forEach(session => {
      const userId = session.user_id;
      const score = exercise === 'plank' ? 
        ((session as {total_time_seconds?: number}).total_time_seconds || 0) : 
        ((session as {total_reps?: number}).total_reps || 0);
      
      // Type assertion for profiles (Supabase returns array for !inner joins but we know it's a single object)
      const profiles = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
      
      if (userStats.has(userId)) {
        const existing = userStats.get(userId)!;
        existing.totalScore += score;
        existing.sessionCount += 1;
      } else {
        userStats.set(userId, {
          userId,
          userName: profiles?.username || 'Anonymous',
          avatarUrl: profiles?.avatar_url,
          totalScore: score,
          sessionCount: 1
        });
      }
    });

    // Convert to array and sort by total score
    const sortedUsers = Array.from(userStats.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    // Create leaderboard entries
    const leaderboard: LeaderboardEntry[] = sortedUsers.map((userEntry, index) => ({
      rank: index + 1,
      userId: userEntry.userId,
      userName: userEntry.userName,
      avatar: userEntry.avatarUrl,
      score: userEntry.totalScore,
      metric: exercise === 'plank' ? 'duration' : 'reps',
      period,
      isCurrentUser: userEntry.userId === user.id
    }));

    return NextResponse.json({
      entries: leaderboard,
      exercise,
      period,
      totalParticipants: leaderboard.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
