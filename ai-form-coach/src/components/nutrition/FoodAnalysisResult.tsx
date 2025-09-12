"use client";

import React from 'react';
import { Icon } from '@/ui/DS';
import type { FoodAnalysisResult } from '@/lib/ai/gemini';

interface FoodAnalysisResultProps {
  result: FoodAnalysisResult;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
  foodImage?: {
    imageUrl: string;
    source: string;
    alt: string;
  } | null;
  imageLoading?: boolean;
}

export default function FoodAnalysisResult({ 
  result, 
  onConfirm, 
  onRetry, 
  onCancel,
  foodImage,
  imageLoading = false
}: FoodAnalysisResultProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🤖 AI Food Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gemini AI has analyzed your food image
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Food Info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Food Image or Placeholder */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                {imageLoading ? (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                    <Icon name="camera" className="w-6 h-6 text-gray-400" />
                  </div>
                ) : foodImage ? (
                  <img 
                    src={foodImage.imageUrl} 
                    alt={foodImage.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-2xl ${foodImage ? 'hidden' : ''}`}>
                  {result.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {result.name}
                </h3>
                {result.brand && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Brand: {result.brand}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  Category: {result.category}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                  {getConfidenceLabel(result.confidence)}
                </div>
                <div className="text-xs text-gray-500">
                  {result.confidence}% confidence
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {result.description}
            </p>
          </div>

          {/* Large Food Image */}
          {foodImage && (
            <div className="mb-6">
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                {imageLoading ? (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="camera" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading food image...</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={foodImage.imageUrl} 
                    alt={foodImage.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                {foodImage.source !== 'placeholder' && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {foodImage.source === 'unsplash' ? '📸 Unsplash' : 
                     foodImage.source === 'pixabay' ? '🖼️ Pixabay' : 
                     foodImage.source === 'gemini' ? '🤖 AI Generated' : '📷 Stock'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estimated Weight */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="scale" className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Estimated Weight
              </h4>
            </div>
            <p className="text-blue-800 dark:text-blue-200">
              {result.estimatedWeight}g (estimated serving size)
            </p>
          </div>

          {/* Nutritional Information */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              📊 Nutritional Information (per 100g)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {Math.round(result.nutritionalInfo.calories)}
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">Calories</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(result.nutritionalInfo.protein * 10) / 10}g
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Protein</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(result.nutritionalInfo.carbs * 10) / 10}g
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Carbs</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {Math.round(result.nutritionalInfo.fat * 10) / 10}g
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">Fat</div>
              </div>
            </div>

            {/* Additional nutrients */}
            {(result.nutritionalInfo.fiber || result.nutritionalInfo.sugar || result.nutritionalInfo.sodium) && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {result.nutritionalInfo.fiber && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(result.nutritionalInfo.fiber * 10) / 10}g
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">Fiber</div>
                  </div>
                )}
                {result.nutritionalInfo.sugar && (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {Math.round(result.nutritionalInfo.sugar * 10) / 10}g
                    </div>
                    <div className="text-xs text-pink-700 dark:text-pink-300">Sugar</div>
                  </div>
                )}
                {result.nutritionalInfo.sodium && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(result.nutritionalInfo.sodium)}mg
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">Sodium</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confidence Warning */}
          {result.confidence < 70 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="alert-triangle" className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Low Confidence Analysis
                </h4>
              </div>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                The AI analysis has low confidence. Please verify the nutritional information 
                before adding to your meal. You can retry with a clearer photo or use manual search instead.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="btn btn-secondary flex-1"
          >
            <Icon name="refresh" className="w-4 h-4 mr-2" />
            Retry Photo
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Icon name="check" className="w-4 h-4 mr-2" />
            Add to Meal
          </button>
        </div>
      </div>
    </div>
  );
}
