"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { NutritionDay, MacroGoals } from '@/types/nutrition';

export default function NutritionPage() {
	const router = useRouter();
	const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [loading, setLoading] = useState(true);
	const [authChecked, setAuthChecked] = useState(false);
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
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
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
			const response = await fetch(`/api/nutrition/meals?date=${selectedDate}`);
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
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Container>
				<div className="py-8 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold">Nutrition</h1>
							<p className="text-sm opacity-70 mt-1">Track your daily nutrition and macros</p>
						</div>
						<Link href="/nutrition/add">
							<Button variant="primary">
								<Icon name="plus" />
								Add Food
							</Button>
						</Link>
					</div>

					{/* Date Selector */}
					<div className="card p-4">
						<DateSelector 
							selectedDate={selectedDate}
							onDateChange={setSelectedDate}
						/>
					</div>

					{/* Macro Rings */}
					<div className="card p-6">
						<h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
						<div className="grid md:grid-cols-4 gap-6">
							<MacroRing
								label="Calories"
								value={totals.total_calories}
								goal={goals.calories}
								unit="cal"
								color="bg-blue-500"
							/>
							<MacroRing
								label="Protein"
								value={totals.total_protein}
								goal={goals.protein}
								unit="g"
								color="bg-red-500"
							/>
							<MacroRing
								label="Carbs"
								value={totals.total_carbs}
								goal={goals.carbs}
								unit="g"
								color="bg-green-500"
							/>
							<MacroRing
								label="Fat"
								value={totals.total_fat}
								goal={goals.fat}
								unit="g"
								color="bg-yellow-500"
							/>
						</div>
					</div>

					{/* Meals */}
					<div className="space-y-4">
						{(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
							const meal = nutritionDay?.meals[mealType];
							const mealItems = meal?.meal_items || [];
							const mealCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);

							return (
								<div key={mealType} className="card p-4">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<h3 className="text-lg font-semibold capitalize">{mealType}</h3>
											<span className="text-sm opacity-70">{Math.round(mealCalories)} cal</span>
										</div>
										<Link href={`/nutrition/add?meal_type=${mealType}&date=${selectedDate}`}>
											<Button variant="ghost" className="text-sm">
												<Icon name="plus" />
												Add
											</Button>
										</Link>
									</div>
									
									{mealItems.length > 0 ? (
										<div className="space-y-2">
											{mealItems.map(item => (
												<div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
													<div>
														<div className="font-medium">{item.food?.name}</div>
														{item.food?.brand && (
															<div className="text-sm opacity-70">{item.food.brand}</div>
														)}
														<div className="text-sm opacity-70">{item.grams}g</div>
													</div>
													<div className="text-right text-sm">
														<div className="font-medium">{Math.round(item.calories)} cal</div>
														<div className="opacity-70">
															P: {Math.round(item.protein)}g • C: {Math.round(item.carbs)}g • F: {Math.round(item.fat)}g
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-8 opacity-70">
											<Icon name="plus" className="mx-auto mb-2" />
											<p className="text-sm">No foods added yet</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</Container>
		</div>
	);
}

function MacroRing({ 
	label, 
	value, 
	goal, 
	unit, 
	color 
}: { 
	label: string;
	value: number;
	goal: number;
	unit: string;
	color: string;
}) {
	const percentage = Math.min((value / goal) * 100, 100);
	const circumference = 2 * Math.PI * 45;
	const strokeDasharray = circumference;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div className="text-center">
			<div className="relative w-24 h-24 mx-auto mb-2">
				<svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
					{/* Background circle */}
					<circle
						cx="50"
						cy="50"
						r="45"
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						className="opacity-20"
					/>
					{/* Progress circle */}
					<circle
						cx="50"
						cy="50"
						r="45"
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						strokeDasharray={strokeDasharray}
						strokeDashoffset={strokeDashoffset}
						className={`transition-all duration-300 ${color.replace('bg-', 'text-')}`}
						strokeLinecap="round"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center">
						<div className="text-lg font-bold">{Math.round(value)}</div>
						<div className="text-xs opacity-70">/{goal}</div>
					</div>
				</div>
			</div>
			<div className="text-sm font-medium">{label}</div>
			<div className="text-xs opacity-70">{unit}</div>
		</div>
	);
}

function DateSelector({ 
	selectedDate, 
	onDateChange 
}: { 
	selectedDate: string;
	onDateChange: (date: string) => void;
}) {
	const goToPreviousDay = () => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() - 1);
		onDateChange(date.toISOString().split('T')[0]);
	};

	const goToNextDay = () => {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() + 1);
		onDateChange(date.toISOString().split('T')[0]);
	};

	const isToday = selectedDate === new Date().toISOString().split('T')[0];
	const isYesterday = selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
	const isFutureDate = selectedDate >= new Date().toISOString().split('T')[0];

	return (
		<div className="flex items-center justify-between">
			<button 
				onClick={goToPreviousDay}
				className="btn btn-secondary"
			>
				<Icon name="chevron-left" />
			</button>
			<div className="text-center">
				<input
					type="date"
					value={selectedDate}
					onChange={(e) => onDateChange(e.target.value)}
					className="text-lg font-semibold bg-transparent border-none text-center"
				/>
				<div className="text-sm opacity-70">
					{isToday ? 'Today' : isYesterday ? 'Yesterday' : new Date(selectedDate).toLocaleDateString()}
				</div>
			</div>
			<button 
				onClick={goToNextDay}
				className="btn btn-secondary"
				disabled={isFutureDate}
			>
				<Icon name="chevron-right" />
			</button>
		</div>
	);
}
