"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Icon } from '@/ui/DS';
import PrivacyBadge from '@/components/PrivacyBadge';
import type { Food, FoodSearchResult } from '@/types/nutrition';

interface FoodSearchProps {
  onSelectFood: (food: Food) => void;
  onClose: () => void;
}

const categories = [
  { id: 'all', name: 'All Foods', emoji: '🍽️' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎' },
  { id: 'vegetables', name: 'Vegetables', emoji: '🥕' },
  { id: 'protein', name: 'Protein', emoji: '🥩' },
  { id: 'grains', name: 'Grains', emoji: '🌾' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛' },
  { id: 'snacks', name: 'Snacks', emoji: '🍿' },
  { id: 'beverages', name: 'Beverages', emoji: '🥤' }
];

const quickAddItems = [
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, emoji: '🍎' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, emoji: '🍌' },
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, emoji: '🍗' },
  { name: 'Rice (1 cup)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4, emoji: '🍚' },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0, emoji: '🥛' },
  { name: 'Almonds (1 oz)', calories: 164, protein: 6, carbs: 6, fat: 14, emoji: '🥜' }
];

export default function FoodSearch({ onSelectFood, onClose }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showQuickAdd, setShowQuickAdd] = useState(true);

  const searchFoods = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowQuickAdd(true);
      return;
    }

    try {
      setLoading(true);
      setShowQuickAdd(false);
      
      const response = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}&limit=20`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: FoodSearchResult = await response.json();
      setSearchResults(data.foods);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFoods();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchFoods]);

  const handleQuickAdd = (item: { id: string; name: string; calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number }) => {
    const food: Food = {
      id: `quick_${Date.now()}`,
      name: item.name,
      calories_per_100g: (item.calories / 100) * 100,
      protein_per_100g: (item.protein / 100) * 100,
      carbs_per_100g: (item.carbs / 100) * 100,
      fat_per_100g: (item.fat / 100) * 100,
      fiber_per_100g: 0,
      sugar_per_100g: 0,
      sodium_per_100g: 0,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onSelectFood(food);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Food
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative mb-3">
            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <PrivacyBadge type="anonymous" size="sm" showLink={true} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Open Food Facts
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{category.emoji}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {showQuickAdd && !loading && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Add
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickAddItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAdd(item)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.calories} cal • {item.protein}g protein
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Search Results
              </h3>
              <div className="space-y-2">
                {searchResults.map((food) => (
                  <FoodSearchResult 
                    key={food.id} 
                    food={food} 
                    onSelect={() => onSelectFood(food)} 
                  />
                ))}
              </div>
            </div>
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Icon name="search" className="mx-auto mb-2 w-12 h-12" />
              <p className="text-sm">No foods found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodSearchResult({ food, onSelect }: { food: Food; onSelect: () => void }) {
  // Ingredient emoji mapping
  const ingredientEmojis: Record<string, string> = {
    vegetables: '🥬',
    fruits: '🍎',
    proteins: '🍗',
    grains: '🌾',
    dairy: '🧀',
    other: '🧂'
  };

  // Get top 2 ingredient categories
  const topIngredients = food.ingredients 
    ? Object.entries(food.ingredients)
        .filter(([_, items]) => items && items.length > 0)
        .slice(0, 2)
        .map(([category]) => category)
    : [];

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {food.name}
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
        {food.brand && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {food.brand}
          </div>
        )}
        {food.category && (
          <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
            {food.category}
          </div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {Math.round(food.calories_per_100g)} cal per 100g
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {Math.round(food.protein_per_100g)}g
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">protein</div>
        </div>
        {food.verified && (
          <Icon name="check" className="text-green-500" />
        )}
        <Icon name="chevron-right" className="text-gray-400" />
      </div>
    </button>
  );
}
