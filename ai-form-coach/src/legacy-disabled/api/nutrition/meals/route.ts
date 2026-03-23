import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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

    // Get meals for the date
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          *,
          foods (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('date', date)
      .order('meal_type');

    if (mealsError) {
      console.error('Error fetching meals:', mealsError);
      return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
    }

    // Get daily totals - try materialized view first, fallback to calculation
    let dailyTotals = null;
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
        dailyTotals = await calculateDailyTotals(supabase, user.id, date);
      } else {
        dailyTotals = totalsData;
      }
    } catch (error) {
      console.error('Error accessing daily_totals table:', error);
      // If materialized view doesn't exist, calculate from meals
      dailyTotals = await calculateDailyTotals(supabase, user.id, date);
    }

    return NextResponse.json({
      meals: meals || [],
      dailyTotals: dailyTotals || null,
      date
    });

  } catch (error) {
    console.error('Meals API error:', error);
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
      meal_type,
      food_id,
      grams,
      meal_name
    } = body;

    // Validate required fields
    if (!date || !meal_type || !food_id || !grams) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create meal
    const { data: initialMeal, error: mealError } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .eq('meal_type', meal_type)
      .eq('name', meal_name || null)
      .single();

    let meal = initialMeal;
    
    if (mealError && mealError.code === 'PGRST116') {
      // Create new meal
      const { data: newMeal, error: createError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          date,
          meal_type,
          name: meal_name || null
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating meal:', createError);
        return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
      }
      meal = newMeal;
    } else if (mealError) {
      console.error('Error fetching meal:', mealError);
      return NextResponse.json({ error: 'Failed to fetch meal' }, { status: 500 });
    }

    // Add food item to meal
    const { data: mealItem, error: itemError } = await supabase
      .from('meal_items')
      .insert({
        meal_id: meal!.id,
        food_id,
        grams
      })
      .select(`
        *,
        foods (*)
      `)
      .single();

    if (itemError) {
      console.error('Error adding meal item:', itemError);
      return NextResponse.json({ error: 'Failed to add food to meal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mealItem
    });

  } catch (error) {
    console.error('Meals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}