"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { UserGoals, CreateUserGoalsRequest, GoalType, ActivityLevel } from '@/types/nutrition';

interface GoalsPanelProps {
  onClose: () => void;
  onGoalsUpdated?: () => void;
}

export default function GoalsPanel({ onClose, onGoalsUpdated }: GoalsPanelProps) {
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserGoalsRequest>({
    calorie_target: 2000,
    protein_target: 150,
    carbs_target: 250,
    fat_target: 65,
    fiber_target: 25,
    sugar_target: 50,
    sodium_target: 2300,
    goal_type: 'maintenance',
    activity_level: 'moderate'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, skipping goals fetch');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/nutrition/goals', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      if (data.goals) {
        setGoals(data.goals);
        setFormData({
          calorie_target: data.goals.calorie_target,
          protein_target: data.goals.protein_target,
          carbs_target: data.goals.carbs_target,
          fat_target: data.goals.fat_target,
          fiber_target: data.goals.fiber_target,
          sugar_target: data.goals.sugar_target,
          sodium_target: data.goals.sodium_target,
          goal_type: data.goals.goal_type,
          activity_level: data.goals.activity_level
        });
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Authentication required');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/nutrition/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save goals');
      }

      const data = await response.json();
      setGoals(data.goals);
      onGoalsUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving goals:', error);
      setError('Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserGoalsRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const goalTypeOptions: { value: GoalType; label: string; description: string }[] = [
    { value: 'maintenance', label: 'Maintenance', description: 'Maintain current weight' },
    { value: 'weight_loss', label: 'Weight Loss', description: 'Lose weight gradually' },
    { value: 'weight_gain', label: 'Weight Gain', description: 'Gain weight healthily' },
    { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle mass' }
  ];

  const activityLevelOptions: { value: ActivityLevel; label: string; description: string }[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
    { value: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Very heavy exercise, physical job' }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nutrition Goals</h2>
            <p className="text-gray-600 mt-1">Set your daily calorie and macro targets</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon name="alert-circle" className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type
            </label>
            <select
              value={formData.goal_type}
              onChange={(e) => handleInputChange('goal_type', e.target.value as GoalType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {goalTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Level
            </label>
            <select
              value={formData.activity_level}
              onChange={(e) => handleInputChange('activity_level', e.target.value as ActivityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {activityLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Macro Targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Calories
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.calorie_target}
                  onChange={(e) => handleInputChange('calorie_target', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="50"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">kcal</span>
              </div>
            </div>

            {/* Protein */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.protein_target}
                  onChange={(e) => handleInputChange('protein_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="5"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbs Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.carbs_target}
                  onChange={(e) => handleInputChange('carbs_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="5"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">g</span>
              </div>
            </div>

            {/* Fat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fat Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.fat_target}
                  onChange={(e) => handleInputChange('fat_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="5"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">g</span>
              </div>
            </div>

            {/* Fiber */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiber Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.fiber_target}
                  onChange={(e) => handleInputChange('fiber_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">g</span>
              </div>
            </div>

            {/* Sugar Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sugar Limit
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.sugar_target}
                  onChange={(e) => handleInputChange('sugar_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="5"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">g</span>
              </div>
            </div>
          </div>

          {/* Sodium Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sodium Limit
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.sodium_target}
                onChange={(e) => handleInputChange('sodium_target', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="100"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">mg</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </div>
    </div>
  );
}
