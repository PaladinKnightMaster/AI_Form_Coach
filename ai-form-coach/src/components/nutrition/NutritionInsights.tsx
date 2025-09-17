"use client";

import React from 'react';
import { Icon } from '@/ui/DS';

interface NutritionInsightsProps {
  totals: {
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function NutritionInsights({ totals, goals }: NutritionInsightsProps) {
  const insights = generateInsights(totals, goals);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="chart" className="text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Today's Insights
        </h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              insight.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : insight.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              insight.type === 'success'
                ? 'bg-green-500'
                : insight.type === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}>
              <Icon 
                name={insight.type === 'success' ? 'check' : insight.type === 'warning' ? 'alert' : 'chart'} 
                className="text-white w-4 h-4" 
              />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                insight.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : insight.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {insight.title}
              </p>
              <p className={`text-sm ${
                insight.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : insight.type === 'warning'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {insight.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateInsights(totals: any, goals: any) {
  const insights = [];
  
  // Calorie insights
  const caloriePercentage = (totals.total_calories / goals.calories) * 100;
  if (caloriePercentage >= 90 && caloriePercentage <= 110) {
    insights.push({
      type: 'success',
      title: 'Great calorie balance!',
      message: `You're right on track with ${Math.round(caloriePercentage)}% of your daily calorie goal.`
    });
  } else if (caloriePercentage < 70) {
    insights.push({
      type: 'warning',
      title: 'Low calorie intake',
      message: `You've only consumed ${Math.round(caloriePercentage)}% of your daily calories. Consider adding a healthy snack.`
    });
  } else if (caloriePercentage > 130) {
    insights.push({
      type: 'warning',
      title: 'High calorie intake',
      message: `You've consumed ${Math.round(caloriePercentage)}% of your daily calories. Consider lighter options for remaining meals.`
    });
  }

  // Protein insights
  const proteinPercentage = (totals.total_protein / goals.protein) * 100;
  if (proteinPercentage >= 80) {
    insights.push({
      type: 'success',
      title: 'Excellent protein intake!',
      message: `You've met ${Math.round(proteinPercentage)}% of your protein goal. Great for muscle recovery and satiety.`
    });
  } else if (proteinPercentage < 50) {
    insights.push({
      type: 'warning',
      title: 'Low protein intake',
      message: `You've only consumed ${Math.round(proteinPercentage)}% of your protein goal. Consider adding lean protein sources.`
    });
  }

  // Macro balance insights
  const proteinCalories = totals.total_protein * 4;
  const carbCalories = totals.total_carbs * 4;
  const fatCalories = totals.total_fat * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;
  
  if (totalMacroCalories > 0) {
    const proteinRatio = (proteinCalories / totalMacroCalories) * 100;
    const carbRatio = (carbCalories / totalMacroCalories) * 100;
    const fatRatio = (fatCalories / totalMacroCalories) * 100;
    
    if (proteinRatio >= 20 && proteinRatio <= 35 && carbRatio >= 45 && carbRatio <= 65 && fatRatio >= 20 && fatRatio <= 35) {
      insights.push({
        type: 'success',
        title: 'Balanced macronutrients!',
        message: `Your macro distribution looks great: ${Math.round(proteinRatio)}% protein, ${Math.round(carbRatio)}% carbs, ${Math.round(fatRatio)}% fat.`
      });
    }
  }

  // Meal timing insights
  if (totals.total_calories === 0) {
    insights.push({
      type: 'warning',
      title: 'Start your day!',
      message: "You haven't logged any food yet today. Remember to fuel your body with nutritious meals."
    });
  }

  return insights;
}
