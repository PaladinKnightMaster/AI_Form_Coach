import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { DailyProgress, EffectiveDailyTargets } from '@/types/nutrition';
import type { SupabaseClient } from '@supabase/supabase-js';

// Define types for meal data
interface MealItem {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface Meal {
  meal_items: MealItem[];
}

// Helper function to calculate daily totals from meals
async function calculateDailyTotals(supabase: SupabaseClient, userId: string, date: string) {
  try {
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          calories,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          sodium
        )
      `)
      .eq('user_id', userId)
      .eq('date', date);

    if (mealsError) {
      console.error('Error fetching meals for daily totals:', mealsError);
      return null;
    }

    // Calculate totals from meal items
    const totals = {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      total_sugar: 0,
      total_sodium: 0
    };

    (meals as Meal[])?.forEach((meal: Meal) => {
      meal.meal_items?.forEach((item: MealItem) => {
        totals.total_calories += item.calories || 0;
        totals.total_protein += item.protein || 0;
        totals.total_carbs += item.carbs || 0;
        totals.total_fat += item.fat || 0;
        totals.total_fiber += item.fiber || 0;
        totals.total_sugar += item.sugar || 0;
        totals.total_sodium += item.sodium || 0;
      });
    });

    return totals;
  } catch (error) {
    console.error('Error calculating daily totals:', error);
    return null;
  }
}

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

    // Get daily totals - try materialized view first, fallback to calculation
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
        // If daily_totals materialized view doesn't exist, calculate from meals
        totals = await calculateDailyTotals(supabase, user.id, date);
      } else {
        totals = totalsData;
      }
    } catch (error) {
      console.error('Error accessing daily_totals table:', error);
      // If materialized view doesn't exist, calculate from meals
      totals = await calculateDailyTotals(supabase, user.id, date);
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
