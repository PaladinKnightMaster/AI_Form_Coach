import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { GeneratedPlan } from '@/lib/ai/planGenerator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, name }: { plan: GeneratedPlan; name: string } = body;

    if (!plan || !name) {
      return NextResponse.json(
        { error: 'Plan data and name are required' },
        { status: 400 }
      );
    }

    // Save AI-generated plan directly as a user plan (no template needed)
    const { data: userPlan, error: userPlanError } = await supabase
      .from('user_plans')
      .insert({
        user_id: user.id,
        template_id: null, // AI-generated plans don't have templates
        name: name,
        current_week: 1,
        current_day: 1,
        is_active: true,
        plan_data: {
          // Store the entire AI-generated plan data
          name: plan.name,
          description: plan.description,
          category: plan.category,
          goal_type: plan.goal_type,
          equipment_required: plan.equipment_required,
          duration_weeks: plan.duration_weeks,
          difficulty_level: plan.difficulty_level,
          sessions_per_week: plan.sessions_per_week,
          avg_session_duration: plan.avg_session_duration,
          tags: plan.tags,
          sessions: plan.sessions
        }
      })
      .select()
      .single();

    if (userPlanError) {
      console.error('Error creating user plan:', userPlanError);
      return NextResponse.json(
        { error: 'Failed to save AI-generated plan', details: userPlanError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      userPlan 
    });

  } catch (error) {
    console.error('Unexpected error in save AI plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
