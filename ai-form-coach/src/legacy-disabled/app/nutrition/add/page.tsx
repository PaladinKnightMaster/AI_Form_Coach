"use client";
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Food, MealType, FoodSearchResult } from '@/types/nutrition';
import BarcodeScanner from '@/components/BarcodeScanner';
import { lookupProductByBarcode } from '@/lib/nutrition/openFoodFacts';
import { foodCacheManager } from '@/lib/nutrition/foodCache';

function AddFoodPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Food[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedFood, setSelectedFood] = useState<Food | null>(null);
	const [grams, setGrams] = useState(100);
	const [adding, setAdding] = useState(false);
	const [authChecked, setAuthChecked] = useState(false);
	const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
	const [barcodeLoading, setBarcodeLoading] = useState(false);
	const [barcodeError, setBarcodeError] = useState<string | null>(null);
	
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

	// Initialize food cache
	useEffect(() => {
		if (authChecked) {
			foodCacheManager.init().catch(console.error);
		}
	}, [authChecked]);

	const handleBarcodeDetected = useCallback(async (barcode: string, format?: string) => {
		try {
			setBarcodeLoading(true);
			setBarcodeError(null);
			setShowBarcodeScanner(false);

			console.log('Code detected:', { barcode, format });

			// Handle QR codes differently
			if (format === 'QR_CODE') {
				// Check if QR code contains a URL
				if (barcode.startsWith('http://') || barcode.startsWith('https://')) {
					setBarcodeError('QR code contains a URL. Please use manual search for food items.');
					return;
				}
				// Check if QR code contains a barcode number
				if (/^\d{8,14}$/.test(barcode)) {
					console.log('QR code contains barcode number:', barcode);
					// Treat as barcode and continue with normal flow
				} else {
					setBarcodeError('QR code format not supported for food lookup. Please use manual search.');
					return;
				}
			}

			// Check cache first
			const cachedFood = await foodCacheManager.getCachedFood(barcode);
			if (cachedFood) {
				console.log('Using cached food data');
				convertBarcodeFoodToAppFood(cachedFood);
				return;
			}

			// Look up product from Open Food Facts
			const foodData = await lookupProductByBarcode(barcode);
			if (!foodData) {
				setBarcodeError('Product not found in database. Please try manual search.');
				return;
			}

			// Cache the food data
			await foodCacheManager.cacheFood(barcode, foodData);
			
			// Convert to app format and select
			convertBarcodeFoodToAppFood(foodData);

		} catch (error) {
			console.error('Barcode lookup error:', error);
			setBarcodeError('Failed to lookup product. Please try manual search.');
		} finally {
			setBarcodeLoading(false);
		}
	}, []);

	const convertBarcodeFoodToAppFood = (barcodeFood: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
		// Convert barcode food data to app Food format
		const appFood: Food = {
			id: `barcode_${Date.now()}`, // Temporary ID for barcode foods
			name: barcodeFood.name,
			brand: barcodeFood.brand || null,
			category: barcodeFood.category || null,
			calories_per_100g: (barcodeFood.calories / barcodeFood.serving_size) * 100,
			protein_per_100g: (barcodeFood.protein / barcodeFood.serving_size) * 100,
			carbs_per_100g: (barcodeFood.carbs / barcodeFood.serving_size) * 100,
			fat_per_100g: (barcodeFood.fat / barcodeFood.serving_size) * 100,
		fiber_per_100g: barcodeFood.fiber ? (barcodeFood.fiber / barcodeFood.serving_size) * 100 : undefined,
		sugar_per_100g: barcodeFood.sugar ? (barcodeFood.sugar / barcodeFood.serving_size) * 100 : undefined,
		sodium_per_100g: barcodeFood.sodium ? (barcodeFood.sodium / barcodeFood.serving_size) * 100 : undefined,
			verified: false, // Barcode foods are not verified in our database
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};

		setSelectedFood(appFood);
		setGrams(barcodeFood.serving_size); // Set default serving size
	};

	const searchFoods = useCallback(async () => {
		try {
			setLoading(true);
			
			// Get user ID for authorization
			const supabase = getSupabaseClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				throw new Error('User not authenticated');
			}
			
			const response = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}&limit=20`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.id}`,
				},
			});
			if (!response.ok) throw new Error('Search failed');
			
			const data: FoodSearchResult = await response.json();
			setSearchResults(data.foods);
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setLoading(false);
		}
	}, [searchQuery]);

	// Real-time search suggestions as user types
	useEffect(() => {
		if (authChecked && searchQuery.trim().length >= 2) {
			const timeoutId = setTimeout(() => {
				searchFoods();
			}, 300); // 300ms debounce for real-time search
			return () => clearTimeout(timeoutId);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, searchFoods, authChecked]);

	async function addFoodToMeal() {
		if (!selectedFood) return;

		try {
			setAdding(true);
			
			// Get user ID for authorization
			const supabase = getSupabaseClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				throw new Error('User not authenticated');
			}
			
			// For barcode foods, we need to create a temporary food entry first
			let foodId = selectedFood.id;
			
			if (selectedFood.id.startsWith('barcode_')) {
				// Create a temporary food entry for barcode foods
				const response = await fetch('/api/nutrition/foods', {
					method: 'POST',
					credentials: 'include',
					headers: { 
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${user.id}`,
					},
					body: JSON.stringify({
						name: selectedFood.name,
						brand: selectedFood.brand,
						category: selectedFood.category,
						calories_per_100g: selectedFood.calories_per_100g,
						protein_per_100g: selectedFood.protein_per_100g,
						carbs_per_100g: selectedFood.carbs_per_100g,
						fat_per_100g: selectedFood.fat_per_100g,
						fiber_per_100g: selectedFood.fiber_per_100g,
						sugar_per_100g: selectedFood.sugar_per_100g,
						sodium_per_100g: selectedFood.sodium_per_100g,
						verified: false
					})
				});

				if (!response.ok) throw new Error('Failed to create food entry');
				const foodData = await response.json();
				foodId = foodData.id;
			}

			// Add food to meal
			const response = await fetch('/api/nutrition/meals', {
				method: 'POST',
				credentials: 'include',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.id}`,
				},
				body: JSON.stringify({
					meal_type: mealType,
					food_id: foodId,
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
		<div className="min-h-screen bg-gray-50">
			<Container>
				<div className="py-8 max-w-2xl mx-auto">
					{/* Header */}
					<div className="flex items-center gap-4 mb-6">
						<BackButton onBack={() => router.back()} />
						<div className="flex-1">
							<h1 className="text-2xl font-bold">Add Food</h1>
							<p className="text-sm opacity-70 capitalize">
								{mealType} • {new Date(date).toLocaleDateString()}
							</p>
						</div>
						{/* Quick Scan Button */}
						<button
							onClick={() => setShowBarcodeScanner(true)}
							className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors shadow-lg"
							disabled={barcodeLoading}
							title="Scan Barcode or QR Code"
						>
							<Icon name="camera" className="w-6 h-6" />
						</button>
					</div>

					{!selectedFood ? (
						<>
							{/* Search */}
							<div className="card p-4 mb-6">
								<div className="relative mb-4">
									<Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
									<input
										type="text"
										placeholder="Search for foods..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												searchFoods();
											}
										}}
										className="w-full pl-10 pr-20 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<button
										onClick={searchFoods}
										disabled={!searchQuery.trim() || loading}
										className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
									>
										{loading ? 'Searching...' : 'Search'}
									</button>
								</div>
								
								{/* Search Help Text */}
								{searchQuery.trim() && searchQuery.trim().length < 2 && (
									<p className="text-sm text-gray-600 mb-4">
										💡 Type at least 2 characters to see food suggestions
									</p>
								)}
								{searchQuery.trim() && searchQuery.trim().length >= 2 && (
									<p className="text-sm text-gray-600 mb-4">
										🔍 Showing suggestions for &quot;{searchQuery}&quot; • Click &quot;Search&quot; for more results
									</p>
								)}
								
								{/* Divider */}
								<div className="flex items-center my-4">
									<div className="flex-1 border-t border-gray-200"></div>
									<span className="px-3 text-sm text-gray-500">or</span>
									<div className="flex-1 border-t border-gray-200"></div>
								</div>

								{/* Barcode Scanner Button */}
								<div className="text-center">
									<button
										onClick={() => setShowBarcodeScanner(true)}
										className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
										disabled={barcodeLoading}
									>
										<Icon name="camera" className="w-6 h-6" />
										{barcodeLoading ? 'Scanning...' : '📱 Scan Barcode or QR Code'}
									</button>
									<p className="text-sm text-gray-600 mt-3">
										Point your camera at a product barcode or QR code for instant food lookup
									</p>
								</div>

								{/* Barcode Error */}
								{barcodeError && (
									<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
										<div className="flex items-center gap-2">
											<Icon name="alert-circle" className="text-red-500" />
											<p className="text-sm text-red-700">{barcodeError}</p>
										</div>
									</div>
								)}
							</div>

							{/* Search Results */}
							{loading && (
								<div className="text-center py-4">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
									<p className="text-sm opacity-70">Finding suggestions...</p>
								</div>
							)}

							{searchResults.length > 0 && (
								<div>
									<h3 className="text-sm font-medium text-gray-700 mb-3">
										🍽️ Food Suggestions
									</h3>
									<FoodSearchResults 
										foods={searchResults}
										onSelectFood={setSelectedFood}
									/>
								</div>
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
										<div className="text-center p-3 bg-blue-50 rounded-lg">
											<div className="text-2xl font-bold text-blue-600">{Math.round(calculatedMacros.calories)}</div>
											<div className="text-sm">Calories</div>
										</div>
										<div className="text-center p-3 bg-red-50 rounded-lg">
											<div className="text-2xl font-bold text-red-600">{Math.round(calculatedMacros.protein)}g</div>
											<div className="text-sm">Protein</div>
										</div>
										<div className="text-center p-3 bg-green-50 rounded-lg">
											<div className="text-2xl font-bold text-green-600">{Math.round(calculatedMacros.carbs)}g</div>
											<div className="text-sm">Carbs</div>
										</div>
										<div className="text-center p-3 bg-yellow-50 rounded-lg">
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

			{/* Barcode Scanner Modal */}
			{showBarcodeScanner && (
				<BarcodeScanner
					onBarcodeDetected={handleBarcodeDetected}
					onClose={() => setShowBarcodeScanner(false)}
					title="Scan Barcode or QR Code"
				/>
			)}
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
					className="w-full card p-4 text-left hover:bg-gray-50 transition-colors"
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

export default function AddFoodPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="text-sm opacity-70">Loading...</p>
				</div>
			</div>
		}>
			<AddFoodPageContent />
		</Suspense>
	);
}
