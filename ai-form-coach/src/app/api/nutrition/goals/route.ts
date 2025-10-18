import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateUserGoalsRequest, UserGoals } from '@/types/nutrition';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's goals
    const { data: goals, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user goals:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // Type validation
    const validatedGoals: UserGoals | null = goals ? {
      id: goals.id,
      user_id: goals.user_id,
      calorie_target: goals.calorie_target,
      protein_target: goals.protein_target,
      carbs_target: goals.carbs_target,
      fat_target: goals.fat_target,
      fiber_target: goals.fiber_target,
      sugar_target: goals.sugar_target,
      sodium_target: goals.sodium_target,
      goal_type: goals.goal_type,
      activity_level: goals.activity_level,
      created_at: goals.created_at,
      updated_at: goals.updated_at
    } : null;

    return NextResponse.json({ goals: validatedGoals });
  } catch (error) {
    console.error('Goals API error:', error);
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

    const body: CreateUserGoalsRequest = await request.json();

    // Validate required fields
    if (!body.calorie_target || !body.protein_target || !body.carbs_target || !body.fat_target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create or update user goals
    const { data: goals, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: user.id,
        calorie_target: body.calorie_target,
        protein_target: body.protein_target,
        carbs_target: body.carbs_target,
        fat_target: body.fat_target,
        fiber_target: body.fiber_target || 25.0,
        sugar_target: body.sugar_target || 50.0,
        sodium_target: body.sodium_target || 2300.0,
        goal_type: body.goal_type || 'maintenance',
        activity_level: body.activity_level || 'moderate',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating user goals:', error);
      return NextResponse.json({ error: 'Failed to save goals' }, { status: 500 });
    }

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<CreateUserGoalsRequest> = await request.json();

    // Update user goals
    const { data: goals, error } = await supabase
      .from('user_goals')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user goals:', error);
      return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
    }

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
