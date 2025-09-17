import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { HealthData, HealthBaseline } from '@/lib/health/healthData';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const period = searchParams.get('period') || '7d';
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    // Get health data for the specified period
    const { data: healthData, error: healthError } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date(targetDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString())
      .lte('date', targetDate.toISOString())
      .order('date', { ascending: true });

    if (healthError) {
      console.error('Error fetching health data:', healthError);
      return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
    }

    // Get user's health baseline
    const { data: baseline, error: baselineError } = await supabase
      .from('health_baselines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (baselineError && baselineError.code !== 'PGRST116') {
      console.error('Error fetching health baseline:', baselineError);
      return NextResponse.json({ error: 'Failed to fetch health baseline' }, { status: 500 });
    }

    return NextResponse.json({
      healthData: healthData || [],
      baseline: baseline || null
    });

  } catch (error) {
    console.error('Unexpected error in health API:', error);
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
    const { type, data } = body;

    if (type === 'health_data') {
      const healthData: HealthData = data;
      
      const { error } = await supabase
        .from('health_data')
        .upsert({
          user_id: user.id,
          date: healthData.date.toISOString().split('T')[0], // Store as date only
          sleep_duration: healthData.sleepDuration,
          resting_heart_rate: healthData.restingHeartRate,
          hrv: healthData.hrv,
          step_count: healthData.stepCount,
          training_load: healthData.trainingLoad
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error saving health data:', error);
        return NextResponse.json({ error: 'Failed to save health data' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'health_baseline') {
      const baseline: HealthBaseline = data;
      
      const { error } = await supabase
        .from('health_baselines')
        .insert({
          user_id: user.id,
          sleep_baseline: baseline.sleepBaseline,
          resting_hr_baseline: baseline.restingHRBaseline,
          hrv_baseline: baseline.hrvBaseline,
          step_baseline: baseline.stepBaseline,
          last_updated: baseline.lastUpdated.toISOString()
        });

      if (error) {
        console.error('Error saving health baseline:', error);
        return NextResponse.json({ error: 'Failed to save health baseline' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });

  } catch (error) {
    console.error('Unexpected error in health API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
