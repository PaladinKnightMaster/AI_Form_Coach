import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { 
  getLeaderboardByExercisePaginated,
  getOverallLeaderboardPaginated,
  getUserRankWithContext,
  getUserDepthSparkline,
  checkTop10EntryEnhanced
} from '@/lib/leaderboards/query';
import type { Exercise, TimeRange } from '@/lib/leaderboards/query';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'overall', 'exercise', 'user_rank', 'sparkline', 'top10_check'
    const exercise = searchParams.get('exercise') as Exercise;
    const timeRange = searchParams.get('timeRange') as TimeRange || 'all';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'reps';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    switch (type) {
      case 'overall':
        const overallData = await getOverallLeaderboardPaginated({
          timeRange,
          verifiedOnly,
          limit,
          offset,
          sortBy: sortBy as 'reps' | 'correct_rate' | 'volume' | 'integrity'
        });
        return NextResponse.json(overallData);

      case 'exercise':
        if (!exercise) {
          return NextResponse.json({ error: 'Exercise parameter required' }, { status: 400 });
        }
        const exerciseData = await getLeaderboardByExercisePaginated(exercise, {
          timeRange,
          verifiedOnly,
          limit,
          offset,
          sortBy: sortBy as 'reps' | 'correct_rate' | 'volume' | 'integrity'
        });
        return NextResponse.json(exerciseData);

      case 'user_rank':
        if (!exercise) {
          return NextResponse.json({ error: 'Exercise parameter required' }, { status: 400 });
        }
        const userRank = await getUserRankWithContext(user.id, exercise, {
          timeRange,
          verifiedOnly,
          sortBy: sortBy as 'reps' | 'correct_rate' | 'volume' | 'integrity'
        });
        return NextResponse.json(userRank);

      case 'sparkline':
        if (!exercise) {
          return NextResponse.json({ error: 'Exercise parameter required' }, { status: 400 });
        }
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
        }
        const sparklineData = await getUserDepthSparkline(userId, exercise, {
          timeRange,
          verifiedOnly
        });
        return NextResponse.json(sparklineData);

      case 'top10_check':
        if (!exercise) {
          return NextResponse.json({ error: 'Exercise parameter required' }, { status: 400 });
        }
        const top10Result = await checkTop10EntryEnhanced(user.id, exercise, timeRange);
        return NextResponse.json(top10Result);

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
