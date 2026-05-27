"use client";

import { useState, useEffect, useCallback } from 'react';
import { Icon, Button } from '@/ui/DS';

interface ProteinDistribution {
  mealType: string;
  protein: number;
  percentage: number;
  mealCount: number;
  foods: Array<{
    name: string;
    protein: number;
  }>;
}

interface TopFood {
  name: string;
  count: number;
  totalProtein: number;
  totalCalories: number;
  category: string;
  lastConsumed: string;
  avgProtein: number;
  avgCalories: number;
}

interface MealSwapSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  suggestion: string;
  foods: Array<{
    name: string;
    protein: number;
    reason: string;
  }>;
}

interface NutritionInsightsData {
  proteinDistribution: ProteinDistribution[];
  topFoods: TopFood[];
  mealSwaps: MealSwapSuggestion[];
  goals: { protein_target?: number } | null;
  date: string;
}

export default function NutritionInsights() {
  const [data, setData] = useState<NutritionInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/nutrition/insights?date=${selectedDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      const insightsData = await response.json();
      setData(insightsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);


  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeName = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-red-600">
          <Icon name="alert-triangle" className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load nutrition insights</p>
          <Button onClick={fetchInsights} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Icon name="chart" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nutrition Insights</h2>
            <p className="text-sm text-gray-600">
              Smart analysis of your eating patterns
            </p>
          </div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        />
      </div>

      {/* Protein Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="target" className="w-5 h-5 text-blue-500" />
          Protein Distribution
        </h3>
        
        {data.goals && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Daily Target:</strong> {data.goals.protein_target}g protein
            </p>
          </div>
        )}

        <div className="space-y-3">
          {data.proteinDistribution.map((meal) => (
            <div key={meal.mealType} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">{getMealTypeIcon(meal.mealType)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">
                    {getMealTypeName(meal.mealType)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {meal.protein}g ({meal.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${meal.percentage}%` }}
                  ></div>
                </div>
                {meal.foods.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {meal.foods.map((food, idx) => (
                      <span key={idx}>
                        {food.name} ({food.protein}g)
                        {idx < meal.foods.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Foods */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="star" className="w-5 h-5 text-yellow-500" />
          Top Foods (Last 30 Days)
        </h3>
        
        <div className="grid gap-3">
          {data.topFoods.map((food, index) => (
            <div key={food.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{food.name}</span>
                  <span className="text-sm text-gray-600">
                    {food.count} times
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Avg: {food.avgProtein}g protein, {food.avgCalories} cal
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Swap Suggestions */}
      {data.mealSwaps.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="lightbulb" className="w-5 h-5 text-purple-500" />
            Smart Suggestions
          </h3>
          
          <div className="space-y-4">
            {data.mealSwaps.map((suggestion, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {suggestion.type === 'protein_boost' ? '💪' : 
                     suggestion.type === 'missing_meal' ? '📅' : '🌈'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                    <p className="text-sm mb-2">{suggestion.message}</p>
                    <p className="text-sm font-medium mb-3">{suggestion.suggestion}</p>
                    
                    {suggestion.foods.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suggestion.foods.map((food, foodIdx) => (
                          <div key={foodIdx} className="bg-white/50 rounded-lg p-2 text-xs">
                            <div className="font-medium">{food.name}</div>
                            {food.protein > 0 && (
                              <div className="text-gray-600">
                                {food.protein}g protein
                              </div>
                            )}
                            <div className="text-gray-500">
                              {food.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No suggestions message */}
      {data.mealSwaps.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Great Job!
          </h3>
          <p className="text-gray-600">
            Your nutrition looks balanced today. Keep up the good work!
          </p>
        </div>
      )}
    </div>
  );
}