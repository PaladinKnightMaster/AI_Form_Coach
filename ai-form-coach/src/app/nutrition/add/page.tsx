"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Food, MealType, FoodSearchResult } from '@/types/nutrition';

export default function AddFoodPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Food[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedFood, setSelectedFood] = useState<Food | null>(null);
	const [grams, setGrams] = useState(100);
	const [adding, setAdding] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	
	const mealType = (searchParams.get('meal_type') as MealType) || 'breakfast';
	const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

	// Check authentication
	useEffect(() => {
		const checkAuth = async () => {
			const supabase = getSupabaseClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				router.push('/signin?redirect=/nutrition/add');
				return;
			}
			
			setAuthChecked(true);
		};
		
		checkAuth();
	}, [router]);

	const searchFoods = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}&limit=20`);
			if (!response.ok) throw new Error('Search failed');
			
			const data: FoodSearchResult = await response.json();
			setSearchResults(data.foods);
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setLoading(false);
		}
	}, [searchQuery]);

	useEffect(() => {
		if (authChecked && searchQuery.trim()) {
			const timeoutId = setTimeout(() => {
				searchFoods();
			}, 300);
			return () => clearTimeout(timeoutId);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, searchFoods, authChecked]);

	async function addFoodToMeal() {
		if (!selectedFood) return;

		try {
			setAdding(true);
			const response = await fetch('/api/nutrition/meals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					meal_type: mealType,
					food_id: selectedFood.id,
					grams,
					date
				})
			});

			if (!response.ok) throw new Error('Failed to add food');

			// Navigate back to nutrition page
			router.push('/nutrition');
		} catch (err) {
			console.error('Add food error:', err);
		} finally {
			setAdding(false);
		}
	}

	const calculatedMacros = selectedFood ? {
		calories: (selectedFood.calories_per_100g * grams) / 100,
		protein: (selectedFood.protein_per_100g * grams) / 100,
		carbs: (selectedFood.carbs_per_100g * grams) / 100,
		fat: (selectedFood.fat_per_100g * grams) / 100
	} : null;

	if (!authChecked) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="text-sm opacity-70">Checking authentication...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Container>
				<div className="py-8 max-w-2xl mx-auto">
					{/* Header */}
					<div className="flex items-center gap-4 mb-6">
						<BackButton onBack={() => router.back()} />
						<div>
							<h1 className="text-2xl font-bold">Add Food</h1>
							<p className="text-sm opacity-70 capitalize">
								{mealType} • {new Date(date).toLocaleDateString()}
							</p>
						</div>
					</div>

					{!selectedFood ? (
						<>
							{/* Search */}
							<div className="card p-4 mb-6">
								<div className="relative">
									<Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
									<input
										type="text"
										placeholder="Search for foods..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							{/* Search Results */}
							{loading && (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
									<p className="text-sm opacity-70">Searching...</p>
								</div>
							)}

							{searchResults.length > 0 && (
								<FoodSearchResults 
									foods={searchResults}
									onSelectFood={setSelectedFood}
								/>
							)}

							{searchQuery && !loading && searchResults.length === 0 && (
								<div className="text-center py-8 opacity-70">
									<Icon name="search" className="mx-auto mb-2" />
									<p className="text-sm">No foods found</p>
									<p className="text-xs mt-1">Try a different search term</p>
								</div>
							)}

							{!searchQuery && (
								<div className="text-center py-12 opacity-70">
									<Icon name="search" className="mx-auto mb-4 w-12 h-12" />
									<p className="text-lg mb-2">Search for foods</p>
									<p className="text-sm">Start typing to find foods to add to your meal</p>
								</div>
							)}
						</>
					) : (
						<>
							{/* Selected Food */}
							<div className="card p-6 mb-6">
								<div className="flex items-start justify-between mb-4">
									<div>
										<h2 className="text-xl font-semibold">{selectedFood.name}</h2>
										{selectedFood.brand && (
											<p className="text-sm opacity-70">{selectedFood.brand}</p>
										)}
									</div>
									<button 
										onClick={() => setSelectedFood(null)}
										className="btn btn-ghost"
									>
										<Icon name="x" />
									</button>
								</div>

								{/* Quantity Input */}
								<div className="mb-4">
									<label className="block text-sm font-medium mb-2">Quantity (grams)</label>
									<div className="flex items-center gap-2">
										<button
											onClick={() => setGrams(Math.max(1, grams - 10))}
											className="btn btn-secondary"
										>
											-
										</button>
										<input
											type="number"
											value={grams}
											onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 1))}
											className="flex-1 px-3 py-2 border rounded-md text-center"
											min="1"
										/>
										<button
											onClick={() => setGrams(grams + 10)}
											className="btn btn-secondary"
										>
											+
										</button>
									</div>
								</div>

								{/* Calculated Macros */}
								{calculatedMacros && (
									<div className="grid grid-cols-2 gap-4 mb-6">
										<div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
											<div className="text-2xl font-bold text-blue-600">{Math.round(calculatedMacros.calories)}</div>
											<div className="text-sm">Calories</div>
										</div>
										<div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
											<div className="text-2xl font-bold text-red-600">{Math.round(calculatedMacros.protein)}g</div>
											<div className="text-sm">Protein</div>
										</div>
										<div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
											<div className="text-2xl font-bold text-green-600">{Math.round(calculatedMacros.carbs)}g</div>
											<div className="text-sm">Carbs</div>
										</div>
										<div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
											<div className="text-2xl font-bold text-yellow-600">{Math.round(calculatedMacros.fat)}g</div>
											<div className="text-sm">Fat</div>
										</div>
									</div>
								)}

								{/* Add Button */}
								<Button
									variant="primary"
									className="w-full"
									onClick={addFoodToMeal}
									disabled={adding}
								>
									{adding ? 'Adding...' : `Add to ${mealType}`}
								</Button>
							</div>
						</>
					)}
				</div>
			</Container>
		</div>
	);
}

function BackButton({ onBack }: { onBack: () => void }) {
	return (
		<button 
			onClick={onBack}
			className="btn btn-ghost"
		>
			<Icon name="chevron-left" />
		</button>
	);
}

function FoodSearchResults({ 
	foods, 
	onSelectFood 
}: { 
	foods: Food[];
	onSelectFood: (food: Food) => void;
}) {
	return (
		<div className="space-y-2">
			{foods.map(food => (
				<button
					key={food.id}
					onClick={() => onSelectFood(food)}
					className="w-full card p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<div className="font-medium">{food.name}</div>
							{food.brand && (
								<div className="text-sm opacity-70">{food.brand}</div>
							)}
							<div className="text-sm opacity-70 mt-1">
								{Math.round(food.calories_per_100g)} cal per 100g
							</div>
						</div>
						{food.verified && (
							<Icon name="check" className="text-green-500 ml-2" />
						)}
					</div>
				</button>
			))}
		</div>
	);
}
