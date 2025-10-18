import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { aiPlanGenerator, type UserPreferences } from '@/lib/ai/planGenerator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const preferences: UserPreferences = body.preferences;

    // Validate required preferences
    if (!preferences.fitness_level || !preferences.goal_type || !preferences.time_per_session) {
      return NextResponse.json(
        { error: 'Missing required preferences' },
        { status: 400 }
      );
    }

    // Generate AI plan
    const generatedPlan = await aiPlanGenerator.generatePlan(preferences);

    // Save the plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('user_plans')
      .insert({
        user_id: user.id,
        name: generatedPlan.name,
        description: generatedPlan.description,
        plan_data: generatedPlan,
        is_active: false // User needs to activate it
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving plan:', saveError);
      return NextResponse.json(
        { error: 'Failed to save plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: savedPlan
    });

  } catch (error) {
    console.error('Unexpected error in plan generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
