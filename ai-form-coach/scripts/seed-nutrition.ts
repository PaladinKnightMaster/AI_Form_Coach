import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file explicitly
config({ path: resolve(process.cwd(), '.env.local') });

// This script seeds the nutrition database with common foods
// Run with: npx tsx scripts/seed-nutrition.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing Supabase environment variables');
	console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const commonFoods = [
	// Proteins
	{
		name: 'Chicken Breast',
		brand: 'Generic',
		calories_per_100g: 165,
		protein_per_100g: 31,
		carbs_per_100g: 0,
		fat_per_100g: 3.6,
		fiber_per_100g: 0,
		sugar_per_100g: 0,
		sodium_per_100g: 74,
		verified: true
	},
	{
		name: 'Salmon Fillet',
		brand: 'Generic',
		calories_per_100g: 208,
		protein_per_100g: 22,
		carbs_per_100g: 0,
		fat_per_100g: 12,
		fiber_per_100g: 0,
		sugar_per_100g: 0,
		sodium_per_100g: 48,
		verified: true
	},
	{
		name: 'Greek Yogurt',
		brand: 'Generic',
		calories_per_100g: 97,
		protein_per_100g: 10,
		carbs_per_100g: 3.6,
		fat_per_100g: 5,
		fiber_per_100g: 0,
		sugar_per_100g: 3.6,
		sodium_per_100g: 36,
		verified: true
	},
	{
		name: 'Eggs',
		brand: 'Generic',
		calories_per_100g: 155,
		protein_per_100g: 13,
		carbs_per_100g: 1.1,
		fat_per_100g: 11,
		fiber_per_100g: 0,
		sugar_per_100g: 1.1,
		sodium_per_100g: 124,
		verified: true
	},

	// Carbs
	{
		name: 'Brown Rice',
		brand: 'Generic',
		calories_per_100g: 112,
		protein_per_100g: 2.6,
		carbs_per_100g: 23,
		fat_per_100g: 0.9,
		fiber_per_100g: 1.8,
		sugar_per_100g: 0.4,
		sodium_per_100g: 1,
		verified: true
	},
	{
		name: 'Oats',
		brand: 'Generic',
		calories_per_100g: 389,
		protein_per_100g: 16.9,
		carbs_per_100g: 66.3,
		fat_per_100g: 6.9,
		fiber_per_100g: 10.6,
		sugar_per_100g: 0.99,
		sodium_per_100g: 2,
		verified: true
	},
	{
		name: 'Sweet Potato',
		brand: 'Generic',
		calories_per_100g: 86,
		protein_per_100g: 1.6,
		carbs_per_100g: 20.1,
		fat_per_100g: 0.1,
		fiber_per_100g: 3,
		sugar_per_100g: 4.2,
		sodium_per_100g: 4,
		verified: true
	},
	{
		name: 'Banana',
		brand: 'Generic',
		calories_per_100g: 89,
		protein_per_100g: 1.1,
		carbs_per_100g: 22.8,
		fat_per_100g: 0.3,
		fiber_per_100g: 2.6,
		sugar_per_100g: 12.2,
		sodium_per_100g: 1,
		verified: true
	},

	// Fats
	{
		name: 'Avocado',
		brand: 'Generic',
		calories_per_100g: 160,
		protein_per_100g: 2,
		carbs_per_100g: 8.5,
		fat_per_100g: 14.7,
		fiber_per_100g: 6.7,
		sugar_per_100g: 0.7,
		sodium_per_100g: 7,
		verified: true
	},
	{
		name: 'Almonds',
		brand: 'Generic',
		calories_per_100g: 579,
		protein_per_100g: 21.2,
		carbs_per_100g: 21.6,
		fat_per_100g: 49.9,
		fiber_per_100g: 12.5,
		sugar_per_100g: 4.35,
		sodium_per_100g: 1,
		verified: true
	},
	{
		name: 'Olive Oil',
		brand: 'Generic',
		calories_per_100g: 884,
		protein_per_100g: 0,
		carbs_per_100g: 0,
		fat_per_100g: 100,
		fiber_per_100g: 0,
		sugar_per_100g: 0,
		sodium_per_100g: 2,
		verified: true
	},

	// Vegetables
	{
		name: 'Broccoli',
		brand: 'Generic',
		calories_per_100g: 34,
		protein_per_100g: 2.8,
		carbs_per_100g: 6.6,
		fat_per_100g: 0.4,
		fiber_per_100g: 2.6,
		sugar_per_100g: 1.5,
		sodium_per_100g: 33,
		verified: true
	},
	{
		name: 'Spinach',
		brand: 'Generic',
		calories_per_100g: 23,
		protein_per_100g: 2.9,
		carbs_per_100g: 3.6,
		fat_per_100g: 0.4,
		fiber_per_100g: 2.2,
		sugar_per_100g: 0.4,
		sodium_per_100g: 79,
		verified: true
	},

	// Common packaged foods
	{
		name: 'Protein Powder',
		brand: 'Generic Whey',
		calories_per_100g: 400,
		protein_per_100g: 80,
		carbs_per_100g: 5,
		fat_per_100g: 5,
		fiber_per_100g: 0,
		sugar_per_100g: 3,
		sodium_per_100g: 200,
		verified: true
	},
	{
		name: 'Whole Wheat Bread',
		brand: 'Generic',
		calories_per_100g: 247,
		protein_per_100g: 13,
		carbs_per_100g: 41,
		fat_per_100g: 4.2,
		fiber_per_100g: 7,
		sugar_per_100g: 5.7,
		sodium_per_100g: 491,
		verified: true
	}
];

async function seedNutritionData() {
	console.log('🌱 Seeding nutrition data...');

	try {
		// Check existing foods first
		const { data: existingFoods } = await supabase
			.from('foods')
			.select('name, brand');

		const existingSet = new Set(
			(existingFoods || []).map(f => `${f.name}||${f.brand || ''}`)
		);

		// Filter out foods that already exist
		const newFoods = commonFoods.filter(food => 
			!existingSet.has(`${food.name}||${food.brand || ''}`)
		);

		if (newFoods.length === 0) {
			console.log('✅ All foods already exist in database');
		} else {
			// Insert only new foods
			const { data, error } = await supabase
				.from('foods')
				.insert(newFoods)
				.select();

			if (error) {
				console.error('Error inserting foods:', error);
				return;
			}

			console.log(`✅ Inserted ${data?.length || 0} new foods`);
		}

		// Initialize daily totals materialized view
		const { error: refreshError } = await supabase.rpc('refresh_daily_totals');
		
		if (refreshError) {
			console.warn('Warning: Could not refresh daily totals view:', refreshError);
		} else {
			console.log('✅ Refreshed daily totals view');
		}

		console.log('🎉 Nutrition data seeded successfully!');

	} catch (err) {
		console.error('Failed to seed nutrition data:', err);
		process.exit(1);
	}
}

// Run the seeding
seedNutritionData().then(() => {
	process.exit(0);
});
