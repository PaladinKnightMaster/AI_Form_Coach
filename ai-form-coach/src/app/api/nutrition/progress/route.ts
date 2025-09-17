import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { DailyProgress, EffectiveDailyTargets } from '@/types/nutrition';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get effective daily targets
    let targets: EffectiveDailyTargets;
    try {
      const { data: targetsData, error: targetsError } = await supabase
        .rpc('get_effective_daily_targets', {
          p_user_id: user.id,
          p_date: date
        });

      if (targetsError) {
        console.error('Error fetching daily targets:', targetsError);
        // Fallback to default targets if function doesn't exist or user has no goals
        targets = {
          calorie_target: 2000,
          protein_target: 150,
          carbs_target: 250,
          fat_target: 65,
          fiber_target: 25,
          sugar_target: 50,
          sodium_target: 2300
        };
      } else {
        targets = targetsData?.[0] || {
          calorie_target: 2000,
          protein_target: 150,
          carbs_target: 250,
          fat_target: 65,
          fiber_target: 25,
          sugar_target: 50,
          sodium_target: 2300
        };
      }
    } catch (error) {
      console.error('Error calling get_effective_daily_targets:', error);
      // Fallback to default targets
      targets = {
        calorie_target: 2000,
        protein_target: 150,
        carbs_target: 250,
        fat_target: 65,
        fiber_target: 25,
        sugar_target: 50,
        sodium_target: 2300
      };
    }

    // Get daily totals
    let totals = null;
    try {
      const { data: totalsData, error: totalsError } = await supabase
        .from('daily_totals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (totalsError && totalsError.code !== 'PGRST116') {
        console.error('Error fetching daily totals:', totalsError);
        // If daily_totals table doesn't exist, we'll use zeros
        totals = null;
      } else {
        totals = totalsData;
      }
    } catch (error) {
      console.error('Error accessing daily_totals table:', error);
      // If table doesn't exist, use zeros
      totals = null;
    }

    // Get goal achievements
    let achievements = null;
    try {
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('goal_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (achievementsError && achievementsError.code !== 'PGRST116') {
        console.error('Error fetching achievements:', achievementsError);
        achievements = null;
      } else {
        achievements = achievementsData;
      }
    } catch (error) {
      console.error('Error accessing goal_achievements table:', error);
      achievements = null;
    }

    // Calculate progress
    const current = totals || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      total_sugar: 0,
      total_sodium: 0
    };

    const progress: DailyProgress = {
      date,
      totals,
      targets,
      achievements,
      progress: {
        calories: {
          current: current.total_calories,
          target: targets.calorie_target,
          percentage: Math.min(100, (current.total_calories / targets.calorie_target) * 100),
          met: current.total_calories >= targets.calorie_target
        },
        protein: {
          current: current.total_protein,
          target: targets.protein_target,
          percentage: Math.min(100, (current.total_protein / targets.protein_target) * 100),
          met: current.total_protein >= targets.protein_target
        },
        carbs: {
          current: current.total_carbs,
          target: targets.carbs_target,
          percentage: Math.min(100, (current.total_carbs / targets.carbs_target) * 100),
          met: current.total_carbs >= targets.carbs_target
        },
        fat: {
          current: current.total_fat,
          target: targets.fat_target,
          percentage: Math.min(100, (current.total_fat / targets.fat_target) * 100),
          met: current.total_fat >= targets.fat_target
        },
        fiber: {
          current: current.total_fiber,
          target: targets.fiber_target,
          percentage: Math.min(100, (current.total_fiber / targets.fiber_target) * 100),
          met: current.total_fiber >= targets.fiber_target
        },
        sugar: {
          current: current.total_sugar,
          target: targets.sugar_target,
          percentage: Math.min(100, (current.total_sugar / targets.sugar_target) * 100),
          met: current.total_sugar <= targets.sugar_target
        },
        sodium: {
          current: current.total_sodium,
          target: targets.sodium_target,
          percentage: Math.min(100, (current.total_sodium / targets.sodium_target) * 100),
          met: current.total_sodium <= targets.sodium_target
        }
      }
    };

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
