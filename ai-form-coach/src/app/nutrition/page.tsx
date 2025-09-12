"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { NutritionDay, MacroGoals, Food } from '@/types/nutrition';
import MacroRing from '@/components/nutrition/MacroRing';
import MealCard from '@/components/nutrition/MealCard';
import NutritionInsights from '@/components/nutrition/NutritionInsights';
import DatePicker from '@/components/nutrition/DatePicker';
import QuickAddFoodModal from '@/components/nutrition/QuickAddFoodModal';

export default function NutritionPage() {
	const router = useRouter();
	const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [loading, setLoading] = useState(true);
	const [authChecked, setAuthChecked] = useState(false);
	const [showQuickAddModal, setShowQuickAddModal] = useState(false);
	const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
	const [goals] = useState<MacroGoals>({
		calories: 2000,
		protein: 150,
		carbs: 250,
		fat: 67
	});

	// Check authentication
	useEffect(() => {
		const checkAuth = async () => {
			const supabase = getSupabaseClient();
			const { data: { user }, error } = await supabase.auth.getUser();
			
			console.log('Client-side auth check:', { user: user?.id, error });
			
			if (!user) {
				console.log('No user found, redirecting to signin');
				router.push('/signin?redirect=/nutrition');
				return;
			}
			
			setAuthChecked(true);
		};
		
		checkAuth();
	}, [router]);

	const fetchNutritionDay = useCallback(async () => {
		try {
			setLoading(true);
			
			// Get user ID for authorization
			const supabase = getSupabaseClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				throw new Error('User not authenticated');
			}
			
			const response = await fetch(`/api/nutrition/meals?date=${selectedDate}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.id}`,
				},
			});
			if (!response.ok) {
				const errorData = await response.text();
				console.error('API Error:', response.status, response.statusText, errorData);
				throw new Error(`Failed to fetch nutrition data: ${response.status} ${response.statusText}`);
			}
			const data = await response.json();
			setNutritionDay(data);
		} catch (err) {
			console.error('Failed to fetch nutrition day:', err);
		} finally {
			setLoading(false);
		}
	}, [selectedDate]);

	useEffect(() => {
		if (authChecked) {
			fetchNutritionDay();
		}
	}, [fetchNutritionDay, authChecked]);

	const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
		setSelectedMealType(mealType);
		setShowQuickAddModal(true);
	};

	const handleFoodSelect = (food: Food) => {
		// Navigate to add food page with pre-selected food
		const params = new URLSearchParams({
			meal_type: selectedMealType,
			date: selectedDate,
			food_id: food.id
		});
		router.push(`/nutrition/add?${params.toString()}`);
		setShowQuickAddModal(false);
	};

	const totals = nutritionDay?.totals || {
		total_calories: 0,
		total_protein: 0,
		total_carbs: 0,
		total_fat: 0
	};

	if (!authChecked || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="text-sm opacity-70">
						{!authChecked ? 'Checking authentication...' : 'Loading nutrition data...'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<Container>
				<div className="py-8 space-y-8">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
								Nutrition
							</h1>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Track your daily nutrition and achieve your health goals
							</p>
						</div>
						<Button 
							variant="primary" 
							onClick={() => {
								setSelectedMealType('breakfast');
								setShowQuickAddModal(true);
							}}
							className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg"
						>
							<Icon name="plus" />
							Quick Add Food
						</Button>
					</div>

					{/* Date Picker */}
					<div className="card p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
						<DatePicker 
							selectedDate={selectedDate}
							onDateChange={setSelectedDate}
						/>
					</div>

					{/* Macro Rings */}
					<div className="card p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
							Daily Summary
						</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
							<MacroRing
								label="Calories"
								value={totals.total_calories}
								goal={goals.calories}
								unit="cal"
								color="text-blue-500"
								size="lg"
							/>
							<MacroRing
								label="Protein"
								value={totals.total_protein}
								goal={goals.protein}
								unit="g"
								color="text-red-500"
								size="lg"
							/>
							<MacroRing
								label="Carbs"
								value={totals.total_carbs}
								goal={goals.carbs}
								unit="g"
								color="text-green-500"
								size="lg"
							/>
							<MacroRing
								label="Fat"
								value={totals.total_fat}
								goal={goals.fat}
								unit="g"
								color="text-yellow-500"
								size="lg"
							/>
						</div>
					</div>

					{/* Nutrition Insights */}
					<NutritionInsights totals={totals} goals={goals} />

					{/* Meals */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
							const meal = nutritionDay?.meals[mealType] || null;
							return (
								<MealCard
									key={mealType}
									meal={meal}
									mealType={mealType}
									onAddFood={() => handleAddFood(mealType)}
								/>
							);
						})}
					</div>
				</div>
			</Container>

			{/* Quick Add Food Modal */}
			{showQuickAddModal && (
				<QuickAddFoodModal
					isOpen={showQuickAddModal}
					onClose={() => setShowQuickAddModal(false)}
					mealType={selectedMealType}
					date={selectedDate}
					onFoodAdded={() => {
						fetchNutritionDay();
						setShowQuickAddModal(false);
					}}
				/>
			)}
		</div>
	);
}
