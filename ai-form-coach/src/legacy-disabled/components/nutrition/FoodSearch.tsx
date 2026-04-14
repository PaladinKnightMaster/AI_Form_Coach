"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/ui/DS';
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
  { id: 'quick-apple', name: 'Apple', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, emoji: '🍎' },
  { id: 'quick-banana', name: 'Banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, emoji: '🍌' },
  { id: 'quick-chicken', name: 'Chicken Breast', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, emoji: '🍗' },
  { id: 'quick-rice', name: 'Rice', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, emoji: '🍚' },
  { id: 'quick-yogurt', name: 'Greek Yogurt', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.4, emoji: '🥛' },
  { id: 'quick-almonds', name: 'Almonds', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50, emoji: '🥜' }
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
      calories_per_100g: item.calories_per_100g,
      protein_per_100g: item.protein_per_100g,
      carbs_per_100g: item.carbs_per_100g,
      fat_per_100g: item.fat_per_100g,
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
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Food
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-3">
            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <PrivacyBadge type="anonymous" size="sm" showLink={true} />
            <span className="text-xs text-gray-500">
              Powered by Open Food Facts
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {showQuickAdd && !loading && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Add
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickAddItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAdd(item)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.calories_per_100g} cal • {item.protein_per_100g}g protein
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            <div className="text-center py-8 text-gray-500">
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
        .filter(([, items]) => items && items.length > 0)
        .slice(0, 2)
        .map(([category]) => category)
    : [];

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-gray-900">
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
          <div className="text-sm text-gray-500">
            {food.brand}
          </div>
        )}
        {food.category && (
          <div className="text-xs text-gray-500 capitalize">
            {food.category}
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">
          {Math.round(food.calories_per_100g)} cal per 100g
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {Math.round(food.protein_per_100g)}g
          </div>
          <div className="text-xs text-gray-500">protein</div>
        </div>
        {food.verified && (
          <Icon name="check" className="text-green-500" />
        )}
        <Icon name="chevron-right" className="text-gray-400" />
      </div>
    </button>
  );
}
