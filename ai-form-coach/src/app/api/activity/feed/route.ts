import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ActivityFeedItem } from '@/types/activity';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent activities from sessions and achievements
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        exercise,
        started_at,
        ended_at,
        total_reps,
        total_time_seconds,
        quality_score,
        user_id,
        profiles!inner(
          id,
          username,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch activity feed' },
        { status: 500 }
      );
    }

    // Get user's liked activities
    const { data: likedActivities } = await supabase
      .from('activity_likes')
      .select('activity_id')
      .eq('user_id', user.id);

    const likedActivityIds = new Set(likedActivities?.map(like => like.activity_id) || []);

    // Transform sessions into activity feed items
    const activities: ActivityFeedItem[] = await Promise.all((sessions || []).map(async session => {
      const duration = session.total_time_seconds ? 
        Math.floor(session.total_time_seconds / 60) : 0;
      
      const activityId = `session-${session.id}`;
      
      // Get like and comment counts
      const [likeCount, commentCount] = await Promise.all([
        supabase.rpc('get_activity_like_count', { activity_id_param: activityId }),
        supabase.rpc('get_activity_comment_count', { activity_id_param: activityId })
      ]);
      
      return {
        id: activityId,
        userId: session.user_id,
        userName: (session.profiles as { username: string }[])?.[0]?.username || 'Anonymous',
        type: 'workout',
        description: `Completed ${session.total_reps || 0} ${session.exercise} reps in ${duration} minutes`,
        timestamp: session.started_at,
        metrics: {
          duration: `${duration}m`,
          reps: session.total_reps || 0,
          calories: Math.round((session.total_reps || 0) * 0.5), // Rough estimate
        },
        likes: likeCount.data || 0,
        liked: likedActivityIds.has(activityId),
        comments: commentCount.data || 0,
        privacy: 'public'
      };
    }));

    // Get achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select(`
        id,
        type,
        title,
        description,
        earned_at,
        user_id,
        profiles!inner(
          id,
          username,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .order('earned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
    } else {
      // Add achievements to activities
      const achievementActivities: ActivityFeedItem[] = await Promise.all((achievements || []).map(async achievement => {
        const activityId = `achievement-${achievement.id}`;
        
        // Get like and comment counts
        const [likeCount, commentCount] = await Promise.all([
          supabase.rpc('get_activity_like_count', { activity_id_param: activityId }),
          supabase.rpc('get_activity_comment_count', { activity_id_param: activityId })
        ]);
        
        return {
          id: activityId,
          userId: achievement.user_id,
          userName: (achievement.profiles as { username: string }[])?.[0]?.username || 'Anonymous',
          type: 'achievement',
          description: `Earned "${achievement.title}" - ${achievement.description}`,
          timestamp: achievement.earned_at,
          likes: likeCount.data || 0,
          liked: likedActivityIds.has(activityId),
          comments: commentCount.data || 0,
          privacy: 'public'
        };
      }));

      activities.push(...achievementActivities);
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      activities: limitedActivities,
      hasMore: activities.length > limit
    });

  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
