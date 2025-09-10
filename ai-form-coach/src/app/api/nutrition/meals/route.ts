import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { AddFoodRequest, NutritionDay } from '@/types/nutrition';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

		const supabase = getSupabaseClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get daily totals
		const { data: totalsData } = await supabase
			.from('daily_totals')
			.select('*')
			.eq('user_id', user.id)
			.eq('date', date)
			.single();

		// Get meals with items
		const { data: mealsData, error: mealsError } = await supabase
			.from('meals')
			.select(`
				*,
				meal_items (
					*,
					food:foods (*)
				)
			`)
			.eq('user_id', user.id)
			.eq('date', date)
			.order('created_at');

		if (mealsError) throw mealsError;

		// Organize meals by type
		const mealsByType = {
			breakfast: null,
			lunch: null,
			dinner: null,
			snack: null
		};

		if (mealsData) {
			for (const meal of mealsData) {
				mealsByType[meal.meal_type as keyof typeof mealsByType] = meal;
			}
		}

		const nutritionDay: NutritionDay = {
			date,
			totals: totalsData || null,
			meals: mealsByType
		};

		return NextResponse.json(nutritionDay);

	} catch (err) {
		console.error('Get meals error:', err);
		return NextResponse.json(
			{ error: 'Failed to fetch meals', details: process.env.NODE_ENV === 'development' ? String(err) : undefined },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const supabase = getSupabaseClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json() as AddFoodRequest;

		// Validate required fields
		if (!body.meal_type || !body.food_id || typeof body.grams !== 'number') {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const date = body.date || new Date().toISOString().split('T')[0];

		// Get or create meal for this date and meal type
		let { data: meal, error: mealError } = await supabase
			.from('meals')
			.select('*')
			.eq('user_id', user.id)
			.eq('date', date)
			.eq('meal_type', body.meal_type)
			.is('name', null) // Only get default meals, not custom named ones
			.single();

		if (mealError && mealError.code === 'PGRST116') {
			// Meal doesn't exist, create it
			const { data: newMeal, error: createError } = await supabase
				.from('meals')
				.insert({
					user_id: user.id,
					date,
					meal_type: body.meal_type
				})
				.select()
				.single();

			if (createError) throw createError;
			meal = newMeal;
		} else if (mealError) {
			throw mealError;
		}

		if (!meal) {
			throw new Error('Failed to create or find meal');
		}

		// Add meal item
		const { data: mealItem, error: itemError } = await supabase
			.from('meal_items')
			.insert({
				meal_id: meal.id,
				food_id: body.food_id,
				grams: body.grams
			})
			.select(`
				*,
				food:foods (*)
			`)
			.single();

		if (itemError) throw itemError;

		return NextResponse.json(mealItem);

	} catch (err) {
		console.error('Add food to meal error:', err);
		return NextResponse.json(
			{ error: 'Failed to add food to meal', details: process.env.NODE_ENV === 'development' ? String(err) : undefined },
			{ status: 500 }
		);
	}
}
