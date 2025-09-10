import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CreateFoodRequest, FoodSearchResult } from '@/types/nutrition';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const query = searchParams.get('q');
		const barcode = searchParams.get('barcode');
		const limit = parseInt(searchParams.get('limit') || '20');
		const offset = parseInt(searchParams.get('offset') || '0');

		const supabase = getSupabaseClient();

		if (barcode) {
			// Search by barcode
			const { data, error } = await supabase
				.from('foods')
				.select('*')
				.eq('barcode', barcode)
				.single();

			if (error && error.code !== 'PGRST116') {
				throw error;
			}

			return NextResponse.json({ foods: data ? [data] : [], total: data ? 1 : 0 });
		}

		if (query) {
			// Text search
			const { data, error, count } = await supabase
				.from('foods')
				.select('*', { count: 'exact' })
				.textSearch('name', query, { type: 'websearch' })
				.order('verified', { ascending: false })
				.order('name')
				.range(offset, offset + limit - 1);

			if (error) throw error;

			const result: FoodSearchResult = {
				foods: data || [],
				total: count || 0
			};

			return NextResponse.json(result);
		}

		// Get recent/popular foods
		const { data, error, count } = await supabase
			.from('foods')
			.select('*', { count: 'exact' })
			.order('verified', { ascending: false })
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const result: FoodSearchResult = {
			foods: data || [],
			total: count || 0
		};

		return NextResponse.json(result);

	} catch (err) {
		console.error('Foods API error:', err);
		return NextResponse.json(
			{ error: 'Failed to fetch foods', details: process.env.NODE_ENV === 'development' ? String(err) : undefined },
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

		const body = await req.json() as CreateFoodRequest;

		// Validate required fields
		if (!body.name || typeof body.calories_per_100g !== 'number') {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const foodData = {
			...body,
			created_by: user.id
		};

		const { data, error } = await supabase
			.from('foods')
			.insert(foodData)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json(data);

	} catch (err) {
		console.error('Create food error:', err);
		return NextResponse.json(
			{ error: 'Failed to create food', details: process.env.NODE_ENV === 'development' ? String(err) : undefined },
			{ status: 500 }
		);
	}
}
