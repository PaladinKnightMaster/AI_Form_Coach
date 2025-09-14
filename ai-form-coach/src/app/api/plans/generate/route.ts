import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { aiPlanGenerator, type UserPreferences } from '@/lib/ai/planGenerator';

export async function POST(request: NextRequest) {
  try {
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

    // Return the generated plan with a temporary ID (will be saved when user accepts)
    return NextResponse.json({
      plan: {
        ...generatedPlan,
        id: `temp_${Date.now()}`, // Temporary ID for client-side handling
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error in plan generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
