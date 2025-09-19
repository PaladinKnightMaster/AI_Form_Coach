import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message || 'No user found' },
        { status: 401 }
      );
    }
    
    // Check if requesting a specific plan by ID
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');
    
    let query = supabase
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
      .eq('user_id', user.id);
    
    // If specific plan ID requested, filter by that ID
    if (planId) {
      query = query.eq('id', planId);
    }
    
    const { data: userPlans, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user plans' },
        { status: 500 }
      );
    }
    
    // If requesting specific plan, return single plan object
    if (planId) {
      const plan = userPlans?.[0];
      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(plan);
    }
    
    // Otherwise return array of plans
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
    
    // Create new user plan (simplified insert for better performance)
    const { data: newPlan, error } = await supabase
      .from('user_plans')
      .insert({
        user_id: user.id,
        template_id,
        name,
        current_week: 1,
        current_day: 1,
        is_active: true,
        plan_data: {}
      })
      .select('id, name, template_id, current_week, current_day, is_active, created_at')
      .single();
    
    if (error) {
      console.error('Error creating user plan:', error);
      return NextResponse.json(
        { error: 'Failed to create user plan', details: error.message },
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

// PATCH - Update user plan (toggle active status, update progress)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message || 'No user found' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { plan_id, is_active, current_week, current_day } = body;
    
    if (!plan_id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Update user plan
    const updateData: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (current_week) updateData.current_week = current_week;
    if (current_day) updateData.current_day = current_day;
    
    const { data: updatedPlan, error } = await supabase
      .from('user_plans')
      .update(updateData)
      .eq('id', plan_id)
      .eq('user_id', user.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating user plan:', error);
      return NextResponse.json(
        { error: 'Failed to update plan', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error in PATCH /api/plans/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove user plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message || 'No user found' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { plan_id } = body;
    
    if (!plan_id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Delete user plan
    const { error } = await supabase
      .from('user_plans')
      .delete()
      .eq('id', plan_id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting user plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete plan', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/plans/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
