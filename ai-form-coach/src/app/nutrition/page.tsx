"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { NutritionDay, MacroGoals } from '@/types/nutrition';
import MacroRing from '@/components/nutrition/MacroRing';
import MealCard from '@/components/nutrition/MealCard';
import NutritionInsights from '@/components/nutrition/NutritionInsights';
import DatePicker from '@/components/nutrition/DatePicker';
import QuickAddFoodModal from '@/components/nutrition/QuickAddFoodModal';
import GoalsPanel from '@/components/nutrition/GoalsPanel';
import ProgressPanel from '@/components/nutrition/ProgressPanel';
import ProteinAdvisory from '@/components/nutrition/ProteinAdvisory';
import FeatureGate from '@/components/FeatureGate';
import { subscriptionService } from '@/lib/subscription/subscriptionService';

export default function NutritionPage() {
	const router = useRouter();
	const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [loading, setLoading] = useState(true);
	const [authChecked, setAuthChecked] = useState(false);
	const [, setUserTier] = useState<string>('free');
	const [showQuickAddModal, setShowQuickAddModal] = useState(false);
	const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
	const [showGoalsPanel, setShowGoalsPanel] = useState(false);
	const [showProgressPanel, setShowProgressPanel] = useState(false);
	const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
	const [goals] = useState<MacroGoals>({
		calories: 2000,
		protein: 150,
		carbs: 250,
		fat: 67
	});

	// Check authentication and subscription
	useEffect(() => {
		const checkAuthAndSubscription = async () => {
			const supabase = getSupabaseClient();
			const { data: { user }, error } = await supabase.auth.getUser();
			
			console.log('Client-side auth check:', { user: user?.id, error });
			
			if (!user) {
				console.log('No user found, redirecting to signin');
				router.push('/signin?redirect=/nutrition');
				return;
			}
			
			// Check subscription tier
			try {
				const tier = await subscriptionService.getUserTier(user.id);
				setUserTier(tier);
				
				// Check if user has access to basic nutrition features
				const hasAccess = await subscriptionService.hasFeatureAccess(user.id, 'basic_nutrition_tracking');
				if (!hasAccess) {
					console.log('User does not have access to nutrition features, redirecting to pricing');
					router.push('/pricing?feature=nutrition');
					return;
				}
			} catch (error) {
				console.error('Error checking subscription:', error);
				// Default to free tier if check fails
				setUserTier('free');
			}
			
			setAuthChecked(true);
		};
		
		checkAuthAndSubscription();
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
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-900 dark:via-emerald-900/30 dark:to-teal-900/30">
			<Container>
				<div className="py-8 space-y-8">
					{/* Header */}
					<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
						<div className="flex-1">
							<div className="space-y-4">
								<Badge tone="success" size="lg" className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
									🥗 Smart Nutrition
								</Badge>
								<h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
									Nutrition Tracker
								</h1>
								<p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
									Track your daily nutrition and achieve your health goals with AI-powered insights
								</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<Button 
								variant="secondary" 
								onClick={() => setShowGoalsPanel(true)}
							>
								<Icon name="target" className="w-4 h-4" />
								Goals
							</Button>
							<Button 
								variant="secondary" 
								onClick={() => setShowProgressPanel(true)}
							>
								<Icon name="trending-up" className="w-4 h-4" />
								Progress
							</Button>
            <FeatureGate feature="advanced_nutrition_features">
								<Button 
									variant="primary" 
									onClick={() => {
										setSelectedMealType('breakfast');
										setShowQuickAddModal(true);
									}}
									className="transform hover:scale-105"
								>
									<Icon name="plus" className="w-4 h-4" />
									Quick Add Food
								</Button>
							</FeatureGate>
						</div>
					</div>

					{/* Date Picker */}
					<div className="card p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
						<DatePicker 
							selectedDate={selectedDate}
							onDateChange={setSelectedDate}
						/>
					</div>

					{/* Tab Navigation */}
					<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg">
						<div className="flex border-b border-gray-200 dark:border-gray-700">
							<button
								onClick={() => setActiveTab('overview')}
								className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
									activeTab === 'overview'
										? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
										: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
								}`}
							>
								<div className="flex items-center justify-center gap-2">
									<Icon name="chart" className="w-4 h-4" />
									Overview
								</div>
							</button>
							<button
								onClick={() => setActiveTab('insights')}
								className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
									activeTab === 'insights'
										? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
										: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
								}`}
							>
								<div className="flex items-center justify-center gap-2">
									<Icon name="lightbulb" className="w-4 h-4" />
									Insights
								</div>
							</button>
						</div>
					</div>

					{/* Tab Content */}
					{activeTab === 'overview' && (
						<>
							{/* Macro Rings */}
							<div className="card p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
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
						</>
					)}

					{/* Insights Tab */}
					{activeTab === 'insights' && (
						<div className="space-y-6">
							<NutritionInsights />
						</div>
					)}
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

			{/* Goals Panel */}
			{showGoalsPanel && (
				<GoalsPanel
					onClose={() => setShowGoalsPanel(false)}
					onGoalsUpdated={() => {
						fetchNutritionDay();
					}}
				/>
			)}

			{/* Progress Panel */}
			{showProgressPanel && (
				<ProgressPanel
					date={selectedDate}
					onClose={() => setShowProgressPanel(false)}
				/>
			)}

			{/* Protein Advisory */}
			<ProteinAdvisory date={selectedDate} />
		</div>
	);
}
