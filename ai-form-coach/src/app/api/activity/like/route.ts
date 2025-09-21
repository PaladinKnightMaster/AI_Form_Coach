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

    const body = await req.json();
    const { activityId, activityType } = body;

    if (!activityId || !activityType) {
      return NextResponse.json(
        { error: 'Missing activityId or activityType' },
        { status: 400 }
      );
    }

    // Check if user already liked this activity
    const { data: existingLike } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .single();

    if (existingLike) {
      // Unlike the activity
      const { error: deleteError } = await supabase
        .from('activity_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', activityId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove like' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        liked: false,
        message: 'Like removed' 
      });
    } else {
      // Like the activity
      const { error: insertError } = await supabase
        .from('activity_likes')
        .insert({
          user_id: user.id,
          activity_id: activityId,
          activity_type: activityType
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json(
          { error: 'Failed to add like' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        liked: true,
        message: 'Like added' 
      });
    }

  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get('activityId');

    if (!activityId) {
      return NextResponse.json(
        { error: 'Missing activityId' },
        { status: 400 }
      );
    }

    // Get like count and user's like status
    const { data: likeCount } = await supabase
      .rpc('get_activity_like_count', { activity_id_param: activityId });

    const { data: userLiked } = await supabase
      .rpc('user_liked_activity', { 
        user_id_param: user.id, 
        activity_id_param: activityId 
      });

    return NextResponse.json({
      likeCount: likeCount || 0,
      userLiked: userLiked || false
    });

  } catch (error) {
    console.error('Like status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
