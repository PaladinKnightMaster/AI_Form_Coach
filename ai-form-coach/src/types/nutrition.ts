export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
	id: string;
	barcode?: string;
	name: string;
	brand?: string;
	calories_per_100g: number;
	protein_per_100g: number;
	carbs_per_100g: number;
	fat_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
	verified: boolean;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface Meal {
	id: string;
	user_id: string;
	date: string;
	meal_type: MealType;
	name?: string;
	created_at: string;
	updated_at: string;
}

export interface MealItem {
	id: string;
	meal_id: string;
	food_id: string;
	grams: number;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
	created_at: string;
	food?: Food;
}

export interface DailyTotals {
	user_id: string;
	date: string;
	total_calories: number;
	total_protein: number;
	total_carbs: number;
	total_fat: number;
	total_fiber: number;
	total_sugar: number;
	total_sodium: number;
	meal_count: number;
	item_count: number;
}

export interface MacroGoals {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface NutritionDay {
	date: string;
	totals: DailyTotals | null;
	meals: {
		breakfast: MealWithItems | null;
		lunch: MealWithItems | null;
		dinner: MealWithItems | null;
		snack: MealWithItems | null;
	};
}

export interface MealWithItems extends Meal {
	meal_items: MealItem[];
}

export interface FoodSearchResult {
	foods: Food[];
	total: number;
}

export interface AddFoodRequest {
	meal_type: MealType;
	food_id: string;
	grams: number;
	date?: string;
}

export interface CreateFoodRequest {
	barcode?: string;
	name: string;
	brand?: string;
	calories_per_100g: number;
	protein_per_100g: number;
	carbs_per_100g: number;
	fat_per_100g: number;
	fiber_per_100g: number;
	sugar_per_100g: number;
	sodium_per_100g: number;
}
