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

    // Save the generated plan as a template
    const { data: template, error: templateError } = await supabase
      .from('plan_templates')
      .insert({
        name: plan.name,
        description: plan.description,
        category: plan.category,
        goal_type: plan.goal_type,
        equipment_required: plan.equipment_required,
        duration_weeks: plan.duration_weeks,
        difficulty_level: plan.difficulty_level,
        sessions_per_week: plan.sessions_per_week,
        avg_session_duration: plan.avg_session_duration,
        is_featured: false, // AI-generated plans are not featured
        tags: plan.tags
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error saving AI-generated template:', templateError);
      return NextResponse.json(
        { error: 'Failed to save generated plan' },
        { status: 500 }
      );
    }

    // Save the sessions
    const sessionsToInsert = plan.sessions.map(session => ({
      template_id: template.id,
      week_number: session.week_number,
      day_number: session.day_number,
      session_name: session.session_name,
      session_description: session.session_description,
      exercises: session.exercises,
      estimated_duration: session.estimated_duration,
      difficulty_notes: session.difficulty_notes
    }));

    const { error: sessionsError } = await supabase
      .from('plan_sessions')
      .insert(sessionsToInsert);

    if (sessionsError) {
      console.error('Error saving AI-generated sessions:', sessionsError);
      // Clean up the template if sessions failed
      await supabase.from('plan_templates').delete().eq('id', template.id);
      return NextResponse.json(
        { error: 'Failed to save plan sessions' },
        { status: 500 }
      );
    }

    // Create user plan
    const { data: userPlan, error: userPlanError } = await supabase
      .from('user_plans')
      .insert({
        user_id: user.id,
        template_id: template.id,
        name: name,
        current_week: 1,
        current_day: 1,
        is_active: true
      })
      .select()
      .single();

    if (userPlanError) {
      console.error('Error creating user plan:', userPlanError);
      return NextResponse.json(
        { error: 'Failed to create user plan' },
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
