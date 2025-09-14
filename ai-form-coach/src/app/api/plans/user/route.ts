import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
    
    // Get user's plans with template information
    const { data: userPlans, error } = await supabase
      .from('user_plans')
      .select(`
        *,
        plan_templates (
          name,
          description,
          category,
          goal_type,
          equipment_required,
          duration_weeks,
          difficulty_level,
          sessions_per_week,
          avg_session_duration,
          tags
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user plans' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ userPlans });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { template_id, name } = body;
    
    if (!template_id || !name) {
      return NextResponse.json(
        { error: 'Template ID and name are required' },
        { status: 400 }
      );
    }
    
    // Create new user plan
    const { data: newPlan, error } = await supabase
      .from('user_plans')
      .insert({
        user_id: user.id,
        template_id,
        name,
        current_week: 1,
        current_day: 1,
        is_active: true
      })
      .select(`
        *,
        plan_templates (
          name,
          description,
          category,
          goal_type,
          equipment_required,
          duration_weeks,
          difficulty_level,
          sessions_per_week,
          avg_session_duration,
          tags
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating user plan:', error);
      return NextResponse.json(
        { error: 'Failed to create user plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ userPlan: newPlan }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
