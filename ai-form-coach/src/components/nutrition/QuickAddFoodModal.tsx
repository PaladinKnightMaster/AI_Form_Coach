"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Food, MealType, MealWithItems, MealItem } from '@/types/nutrition';
import BarcodeScanner from '@/components/BarcodeScanner';
import FoodCamera from './FoodCamera';
import FoodAnalysisResult from './FoodAnalysisResult';
import { lookupProductByBarcode } from '@/lib/nutrition/openFoodFacts';
import { foodCacheManager } from '@/lib/nutrition/foodCache';
import { getCachedFoodImage } from '@/lib/nutrition/foodImages';
import type { FoodAnalysisResult as AnalysisResult } from '@/lib/ai/gemini';

interface QuickAddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  date: string;
  onFoodAdded: () => void;
}

interface FoodCategory {
  id: string;
  name: string;
  icon: string;
  foods: Food[];
}

export default function QuickAddFoodModal({ 
  isOpen, 
  onClose, 
  mealType, 
  date, 
  onFoodAdded 
}: QuickAddFoodModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'search' | 'scan' | 'camera'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showBarcodeResult, setShowBarcodeResult] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<{
    name: string;
    brand?: string | null;
    category?: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    serving_size: number;
    image_url?: string | null;
    barcode: string;
  } | null>(null);
  const [barcodeImage, setBarcodeImage] = useState<{imageUrl: string; source: string; alt: string} | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);

  const loadRecentFoods = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/nutrition/meals?date=${date}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
      });

      if (response.ok) {
        const nutritionDay = await response.json();
        const allFoods: Food[] = [];
        
        // Extract all foods from all meals
        (Object.values(nutritionDay.meals || {}) as (MealWithItems | null)[]).forEach((meal: MealWithItems | null) => {
          if (meal?.meal_items) {
            meal.meal_items.forEach((item: MealItem) => {
              if (item.food && !allFoods.find(f => f.id === item.food!.id)) {
                allFoods.push(item.food);
              }
            });
          }
        });

        setRecentFoods(allFoods.slice(0, 8)); // Show last 8 unique foods
      }
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    }
  }, [date]);

  const loadCategories = useCallback(async () => {
    // Mock categories for now - in real app, this would come from API
    setCategories([
      {
        id: 'fruits',
        name: 'Fruits',
        icon: '🍎',
        foods: [
          { id: '1', name: 'Apple', brand: undefined, category: 'fruits', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, verified: false, created_at: '', updated_at: '' },
          { id: '2', name: 'Banana', brand: undefined, category: 'fruits', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, verified: false, created_at: '', updated_at: '' },
        ]
      },
      {
        id: 'vegetables',
        name: 'Vegetables',
        icon: '🥕',
        foods: [
          { id: '3', name: 'Carrot', brand: undefined, category: 'vegetables', calories_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2, verified: false, created_at: '', updated_at: '' },
          { id: '4', name: 'Broccoli', brand: undefined, category: 'vegetables', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, verified: false, created_at: '', updated_at: '' },
        ]
      },
      {
        id: 'protein',
        name: 'Protein',
        icon: '🥩',
        foods: [
          { id: '5', name: 'Chicken Breast', brand: undefined, category: 'protein', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, verified: false, created_at: '', updated_at: '' },
          { id: '6', name: 'Salmon', brand: undefined, category: 'protein', calories_per_100g: 208, protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 12, verified: false, created_at: '', updated_at: '' },
        ]
      }
    ]);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      loadRecentFoods();
      loadCategories();
    }
  }, [isOpen, loadRecentFoods, loadCategories]);

  const searchFoods = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/nutrition/foods?search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.foods || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Real-time search suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchFoods();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchFoods]);

  const convertBarcodeFoodToAppFood = (barcodeFood: {
    name: string;
    brand?: string | null;
    category?: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    serving_size: number;
  }, barcode: string): Omit<Food, 'id'> => {
    return {
      name: barcodeFood.name,
      brand: barcodeFood.brand || undefined,
      category: barcodeFood.category || undefined,
      barcode: barcode,
      calories_per_100g: (barcodeFood.calories / barcodeFood.serving_size) * 100,
      protein_per_100g: (barcodeFood.protein / barcodeFood.serving_size) * 100,
      carbs_per_100g: (barcodeFood.carbs / barcodeFood.serving_size) * 100,
      fat_per_100g: (barcodeFood.fat / barcodeFood.serving_size) * 100,
      fiber_per_100g: barcodeFood.fiber ? (barcodeFood.fiber / barcodeFood.serving_size) * 100 : undefined,
      sugar_per_100g: barcodeFood.sugar ? (barcodeFood.sugar / barcodeFood.serving_size) * 100 : undefined,
      sodium_per_100g: barcodeFood.sodium ? (barcodeFood.sodium / barcodeFood.serving_size) * 100 : undefined,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const fetchFoodImage = useCallback(async (foodName: string, brand?: string) => {
    try {
      setImageLoading(true);
      const imageResult = await getCachedFoodImage(foodName, brand || undefined);
      setBarcodeImage(imageResult);
      console.log('🖼️ Food image fetched:', imageResult);
    } catch (error) {
      console.error('Failed to fetch food image:', error);
      setBarcodeImage(null);
    } finally {
      setImageLoading(false);
    }
  }, []);

  const addFoodToMeal = useCallback(async (food: {
    name: string;
    brand?: string | null;
    category?: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    serving_size: number;
  }, barcode?: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let foodToUse;

      // If we have a barcode, check if food already exists
      if (barcode) {
        const existingFoodResponse = await fetch(`/api/nutrition/foods?barcode=${barcode}`, {
          headers: {
            'Authorization': `Bearer ${user.id}`,
          },
        });

        if (existingFoodResponse.ok) {
          const existingData = await existingFoodResponse.json();
          if (existingData.foods && existingData.foods.length > 0) {
            console.log('Using existing food from database');
            foodToUse = existingData.foods[0];
          }
        }
      }

      // If no existing food found, create new one
      if (!foodToUse) {
        const appFood = convertBarcodeFoodToAppFood(food, barcode || '');

        const foodResponse = await fetch('/api/nutrition/foods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`,
          },
          body: JSON.stringify(appFood),
        });

        if (!foodResponse.ok) {
          const errorData = await foodResponse.text();
          console.error('Food creation error:', errorData);
          throw new Error(`Failed to create food: ${foodResponse.status} ${foodResponse.statusText}`);
        }

        foodToUse = await foodResponse.json();
      }

      // Add to meal
      const mealResponse = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          food_id: foodToUse.id,
          meal_type: mealType,
          date: date,
          quantity: 100, // Default 100g
        }),
      });

      if (mealResponse.ok) {
        onFoodAdded();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add food to meal:', error);
    }
  }, [date, mealType, onClose, onFoodAdded]);

  const handleBarcodeDetected = useCallback(async (barcode: string, format?: string) => {
    try {
      setBarcodeLoading(true);
      setBarcodeError(null);
      setShowBarcodeScanner(false);

      console.log('🔍 Barcode detected in QuickAddFoodModal:', { barcode, format });

      // Get user ID first
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBarcodeError('Please sign in to scan barcodes.');
        return;
      }

      // Handle QR codes
      if (format === 'QR_CODE') {
        if (barcode.startsWith('http://') || barcode.startsWith('https://')) {
          setBarcodeError('QR code contains a URL. Please use manual search for food items.');
          return;
        }
        if (/^\d{8,14}$/.test(barcode)) {
          console.log('QR code contains barcode number:', barcode);
        } else {
          setBarcodeError('QR code format not supported for food lookup. Please use manual search.');
          return;
        }
      }

      // Check cache first
      const cachedFood = await foodCacheManager.getCachedFood(barcode);
      if (cachedFood) {
        console.log('Using cached food data');
        // Show confirmation dialog like AI Camera
        setBarcodeError(null);
        setBarcodeLoading(false);
        setBarcodeResult({ ...cachedFood, barcode });
        setShowBarcodeResult(true);
        console.log('✅ Showing confirmation dialog for cached food:', cachedFood);
        
        // Use cached image if available, otherwise fetch from external APIs
        if (cachedFood.image_url) {
          console.log('🖼️ Using cached Open Food Facts image:', cachedFood.image_url);
          setBarcodeImage({
            imageUrl: cachedFood.image_url,
            source: 'openfoodfacts',
            alt: `${cachedFood.brand ? cachedFood.brand + ' ' : ''}${cachedFood.name}`
          });
          setImageLoading(false); // No loading needed for Open Food Facts image
        } else {
          // Fallback to external image APIs
          await fetchFoodImage(cachedFood.name, cachedFood.brand);
        }
        return;
      }

      // Check if food already exists in database
      const existingFoodResponse = await fetch(`/api/nutrition/foods?barcode=${barcode}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      });

      if (existingFoodResponse.ok) {
        const existingData = await existingFoodResponse.json();
        if (existingData.foods && existingData.foods.length > 0) {
          console.log('Food already exists in database');
          const existingFood = existingData.foods[0];
          // Show confirmation dialog like AI Camera
          setBarcodeError(null);
          setShowBarcodeScanner(false);
          setBarcodeLoading(false);
          
          // Convert to the format expected by the result dialog
          const foodForResult = {
            name: existingFood.name,
            brand: existingFood.brand,
            category: existingFood.category,
            calories: (existingFood.calories_per_100g / 100) * 100, // Convert back to per-serving
            protein: (existingFood.protein_per_100g / 100) * 100,
            carbs: (existingFood.carbs_per_100g / 100) * 100,
            fat: (existingFood.fat_per_100g / 100) * 100,
            fiber: existingFood.fiber_per_100g ? (existingFood.fiber_per_100g / 100) * 100 : undefined,
            sugar: existingFood.sugar_per_100g ? (existingFood.sugar_per_100g / 100) * 100 : undefined,
            sodium: existingFood.sodium_per_100g ? (existingFood.sodium_per_100g / 100) * 100 : undefined,
            serving_size: 100,
            image_url: null, // Existing foods don't have image URLs
          };
          
          setBarcodeResult({ ...foodForResult, barcode });
          setShowBarcodeResult(true);
          console.log('✅ Showing confirmation dialog for existing food:', foodForResult);
          
          // Fetch food image
          await fetchFoodImage(existingFood.name, existingFood.brand);
          return;
        }
      }

      // Lookup from Open Food Facts
      const foodData = await lookupProductByBarcode(barcode);
      if (!foodData) {
        setBarcodeError('Product not found in Open Food Facts database. Please try manual search or use a different barcode.');
        return;
      }

      // Cache the food data
      await foodCacheManager.cacheFood(barcode, foodData);
      
      // Show confirmation dialog like AI Camera
      setBarcodeError(null);
      setBarcodeLoading(false);
      setBarcodeResult({ ...foodData, barcode });
      setShowBarcodeResult(true);
      console.log('✅ Showing confirmation dialog for new food from Open Food Facts:', foodData);
      
      // Use Open Food Facts image if available, otherwise fetch from external APIs
      if (foodData.image_url) {
        console.log('🖼️ Using Open Food Facts image:', foodData.image_url);
        setBarcodeImage({
          imageUrl: foodData.image_url,
          source: 'openfoodfacts',
          alt: `${foodData.brand ? foodData.brand + ' ' : ''}${foodData.name}`
        });
        setImageLoading(false); // No loading needed for Open Food Facts image
      } else {
        // Fallback to external image APIs
        await fetchFoodImage(foodData.name, foodData.brand);
      }

    } catch (error) {
      console.error('Barcode lookup error:', error);
      setBarcodeError('Failed to lookup product. Please try manual search.');
    } finally {
      setBarcodeLoading(false);
    }
  }, [addFoodToMeal, fetchFoodImage]);

  const handleFoodSelect = async (food: Food) => {
    // Convert Food to the format expected by addFoodToMeal
    const foodForMeal = {
      name: food.name,
      brand: food.brand,
      category: food.category,
      calories: food.calories_per_100g, // Convert per 100g to per serving
      protein: food.protein_per_100g,
      carbs: food.carbs_per_100g,
      fat: food.fat_per_100g,
      fiber: food.fiber_per_100g,
      sugar: food.sugar_per_100g,
      sodium: food.sodium_per_100g,
      serving_size: 100, // Default serving size
    };
    await addFoodToMeal(foodForMeal);
  };

  const handlePhotoTaken = async (file: File) => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      setShowFoodCamera(false);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('action', 'analyze');

      const response = await fetch('/api/ai/analyze-food', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze food image');
      }

      const data = await response.json();
      setAnalysisResult(data.result);
      setShowAnalysisResult(true);
    } catch (error) {
      console.error('AI analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze food image');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAnalysisConfirm = async () => {
    if (!analysisResult) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create food from analysis result
      const foodData = {
        name: analysisResult.name,
        brand: analysisResult.brand || null,
        category: analysisResult.category,
        calories_per_100g: analysisResult.nutritionalInfo.calories,
        protein_per_100g: analysisResult.nutritionalInfo.protein,
        carbs_per_100g: analysisResult.nutritionalInfo.carbs,
        fat_per_100g: analysisResult.nutritionalInfo.fat,
        fiber_per_100g: analysisResult.nutritionalInfo.fiber,
        sugar_per_100g: analysisResult.nutritionalInfo.sugar,
        sodium_per_100g: analysisResult.nutritionalInfo.sodium,
        ingredients: analysisResult.ingredients || undefined,
        detailed_description: analysisResult.detailedDescription || undefined,
      };

      // Create food in database
      const foodResponse = await fetch('/api/nutrition/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify(foodData),
      });

      if (!foodResponse.ok) {
        throw new Error('Failed to create food');
      }

      const createdFood = await foodResponse.json();

      // Add to meal with estimated weight
      const mealResponse = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          food_id: createdFood.id,
          meal_type: mealType,
          date: date,
          grams: analysisResult.estimatedWeight, // Use AI estimated weight
        }),
      });

      if (mealResponse.ok) {
        onFoodAdded();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add analyzed food to meal:', error);
      setAnalysisError('Failed to add food to meal. Please try again.');
    }
  };

  const handleAnalysisRetry = () => {
    setShowAnalysisResult(false);
    setAnalysisResult(null);
    setShowFoodCamera(true);
  };

  const handleBarcodeConfirm = async () => {
    if (barcodeResult) {
      const barcode = barcodeResult.barcode;
      await addFoodToMeal(barcodeResult, barcode);
      setShowBarcodeResult(false);
      setBarcodeResult(null);
    }
  };

  const handleBarcodeRetry = () => {
    setShowBarcodeResult(false);
    setBarcodeResult(null);
    setShowBarcodeScanner(true);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Food to {mealType}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'quick', label: 'Quick Add', icon: '⚡' },
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'scan', label: 'Scan Code', icon: '📱' },
            { id: 'camera', label: 'AI Camera', icon: '🤖' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'quick' | 'search' | 'scan' | 'camera')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Recent Foods */}
              {recentFoods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    🕒 Recently Added
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {recentFoods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => handleFoodSelect(food)}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-green-400 rounded-lg mb-2 flex items-center justify-center text-white font-bold text-lg">
                          {food.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {food.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(food.calories_per_100g)} cal/100g
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  🍽️ Browse Categories
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{category.icon}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {category.foods.slice(0, 3).map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleFoodSelect(food)}
                            className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {food.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(food.calories_per_100g)} cal/100g
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Search Input */}
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

              {/* Search Results */}
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm opacity-70">Finding suggestions...</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🔍 Search Results
                  </h3>
                  <div className="space-y-2">
                    {searchResults.map((food) => {
                      const ingredientEmojis: Record<string, string> = {
                        vegetables: '🥬',
                        fruits: '🍎',
                        proteins: '🍗',
                        grains: '🌾',
                        dairy: '🧀',
                        other: '🧂'
                      };
                      const topIngredients = food.ingredients 
                        ? Object.entries(food.ingredients)
                            .filter(([_, items]) => items && items.length > 0)
                            .slice(0, 2)
                            .map(([category]) => category)
                        : [];
                      
                      return (
                        <button
                          key={food.id}
                          onClick={() => handleFoodSelect(food)}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
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
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {food.brand}
                                </div>
                              )}
                              {food.category && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                                  {food.category}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              {Math.round(food.calories_per_100g)} cal/100g
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="camera" className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Scan Barcode or QR Code
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Point your camera at a product barcode or QR code for instant food lookup
              </p>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📱 Start Scanning
              </button>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                AI Food Recognition
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Take a photo of your food and let Gemini AI identify it with nutritional information
              </p>
              

              {analysisError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="alert-circle" className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Analysis Error
                    </h4>
                  </div>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    {analysisError}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowFoodCamera(true)}
                disabled={analysisLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🤖 Take Photo & Analyze
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setShowBarcodeScanner(false)}
          title="Scan Barcode or QR Code"
        />
      )}

      {/* Food Camera Modal */}
      {showFoodCamera && (
        <FoodCamera
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setShowFoodCamera(false)}
        />
      )}

      {/* Analysis Result Modal */}
      {showAnalysisResult && analysisResult && (
        <FoodAnalysisResult
          result={analysisResult}
          onConfirm={handleAnalysisConfirm}
          onRetry={handleAnalysisRetry}
          onCancel={() => {
            setShowAnalysisResult(false);
            setAnalysisResult(null);
          }}
        />
      )}

      {/* Barcode Loading Overlay */}
      {(barcodeLoading || imageLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 font-medium">
              {barcodeLoading ? 'Processing barcode...' : 'Loading product image...'}
            </p>
            <p className="text-sm text-gray-500">
              {barcodeLoading ? 'Looking up product information' : 'Fetching product image'}
            </p>
          </div>
        </div>
      )}

      {/* AI Analysis Loading Overlay */}
      {analysisLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-700 font-medium">AI is analyzing your food...</p>
            <p className="text-sm text-gray-500">Identifying food items and nutritional information</p>
          </div>
        </div>
      )}

      {/* Barcode Result Modal */}
      {showBarcodeResult && barcodeResult && (
        <div>
          <FoodAnalysisResult
          result={{
            name: barcodeResult.name,
            brand: barcodeResult.brand || undefined,
            category: barcodeResult.category || '',
            estimatedWeight: barcodeResult.serving_size,
            nutritionalInfo: {
              calories: barcodeResult.calories,
              protein: barcodeResult.protein,
              carbs: barcodeResult.carbs,
              fat: barcodeResult.fat,
              fiber: barcodeResult.fiber,
              sugar: barcodeResult.sugar,
              sodium: barcodeResult.sodium,
            },
            confidence: 100, // Barcode data is 100% accurate
            description: `${barcodeResult.name}${barcodeResult.brand ? ` by ${barcodeResult.brand}` : ''}`
          }}
          foodImage={barcodeImage}
          imageLoading={imageLoading}
          onConfirm={handleBarcodeConfirm}
          onRetry={handleBarcodeRetry}
          onCancel={() => {
            setShowBarcodeResult(false);
            setBarcodeResult(null);
            setBarcodeImage(null);
          }}
        />
        </div>
      )}
    </div>,
    document.body
  );
}
