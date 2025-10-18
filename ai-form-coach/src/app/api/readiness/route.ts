import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get readiness data for the date
    const { data: readinessData, error } = await supabase
      .from('readiness_day')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching readiness data:', error);
      return NextResponse.json({ error: 'Failed to fetch readiness data' }, { status: 500 });
    }

    return NextResponse.json({
      readiness: readinessData || null,
      date
    });

  } catch (error) {
    console.error('Readiness API error:', error);
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

    const body = await request.json();
    const {
      date,
      soreness_level,
      fatigue_level,
      sleep_quality,
      stress_level,
      motivation_level,
      sleep_duration,
      resting_heart_rate,
      hrv_average,
      step_count,
      training_load,
      data_sources = ['manual']
    } = body;

    // Calculate readiness score
    const { data: scoreResult, error: scoreError } = await supabase
      .rpc('calculate_readiness_score', {
        p_soreness: soreness_level,
        p_fatigue: fatigue_level,
        p_sleep_quality: sleep_quality,
        p_stress: stress_level,
        p_motivation: motivation_level,
        p_sleep_duration: sleep_duration,
        p_resting_hr: resting_heart_rate,
        p_hrv: hrv_average,
        p_steps: step_count,
        p_training_load: training_load
      });

    if (scoreError) {
      console.error('Error calculating readiness score:', scoreError);
      return NextResponse.json({ error: 'Failed to calculate readiness score' }, { status: 500 });
    }

    const computed_readiness = scoreResult || 0.5;

    // Get readiness category
    const { data: categoryResult, error: categoryError } = await supabase
      .rpc('get_readiness_category', {
        p_score: computed_readiness
      });

    if (categoryError) {
      console.error('Error getting readiness category:', categoryError);
      return NextResponse.json({ error: 'Failed to get readiness category' }, { status: 500 });
    }

    const readiness_category = categoryResult || 'fair';

    // Upsert readiness data
    const { data, error } = await supabase
      .from('readiness_day')
      .upsert({
        user_id: user.id,
        date,
        soreness_level,
        fatigue_level,
        sleep_quality,
        stress_level,
        motivation_level,
        sleep_duration,
        resting_heart_rate,
        hrv_average,
        step_count,
        training_load,
        computed_readiness,
        readiness_category,
        data_sources
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving readiness data:', error);
      return NextResponse.json({ error: 'Failed to save readiness data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      readiness: data
    });

  } catch (error) {
    console.error('Readiness API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
