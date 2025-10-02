"use client";

import React from 'react';
import { Container, Button, Icon } from '@/ui/DS';
import type { MealWithItems } from '@/types/nutrition';

interface MealCardProps {
  meal: MealWithItems | null;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onAddFood: () => void;
}

const mealConfig = {
  breakfast: {
    emoji: '🌅',
    name: 'Breakfast',
    color: 'from-orange-400 to-yellow-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  lunch: {
    emoji: '☀️',
    name: 'Lunch',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  dinner: {
    emoji: '🌙',
    name: 'Dinner',
    color: 'from-purple-400 to-pink-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  snack: {
    emoji: '🍎',
    name: 'Snack',
    color: 'from-green-400 to-emerald-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  }
};

export default function MealCard({ meal, mealType, onAddFood }: MealCardProps) {
  const config = mealConfig[mealType];
  const items = meal?.meal_items || [];
  
  // Calculate meal totals
  const totals = items.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className={`card p-6 border-2 ${config.borderColor} ${config.bgColor} hover:shadow-xl transition-all duration-300 animate-bounce-in hover:scale-[1.02] group backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {config.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {config.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onAddFood}
          className="hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-full p-3 transition-all duration-200 hover:scale-110"
        >
          <Icon name="plus" className="w-5 h-5" />
        </Button>
      </div>

      {/* Nutrition Summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {Math.round(totals.calories)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">cal</div>
          </div>
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {Math.round(totals.protein)}g
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">protein</div>
          </div>
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.round(totals.carbs)}g
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">carbs</div>
          </div>
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {Math.round(totals.fat)}g
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">fat</div>
          </div>
        </div>
      )}

      {/* Food Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">{config.emoji}</div>
            <p className="text-sm">No {config.name.toLowerCase()} logged yet</p>
            <Button 
              variant="ghost" 
              onClick={onAddFood}
              className="mt-2 text-sm"
            >
              Add your first item
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function FoodItemCard({ item }: { item: any }) {
  const food = item.food;
  
  // Ingredient emoji mapping
  const ingredientEmojis: Record<string, string> = {
    vegetables: '🥬',
    fruits: '🍎',
    proteins: '🍗',
    grains: '🌾',
    dairy: '🧀',
    other: '🧂'
  };

  // Get top 2 ingredient categories for display
  const getTopIngredients = () => {
    if (!food?.ingredients) return [];
    return Object.entries(food.ingredients)
      .filter(([_, items]) => items && (items as any[]).length > 0)
      .slice(0, 2)
      .map(([category]) => category);
  };

  const topIngredients = getTopIngredients();
  
  return (
    <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {food?.name || 'Unknown Food'}
          </div>
          {topIngredients.length > 0 && (
            <div className="flex gap-1">
              {topIngredients.map((category) => (
                <span key={category} className="text-sm" title={category}>
                  {ingredientEmojis[category]}
                </span>
              ))}
            </div>
          )}
        </div>
        {food?.brand && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {food.brand}
          </div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {item.grams}g • {Math.round(item.calories)} cal
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {Math.round(item.protein)}g
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">protein</div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
