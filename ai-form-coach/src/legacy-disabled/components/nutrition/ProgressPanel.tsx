"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DailyProgress } from '@/types/nutrition';

interface ProgressPanelProps {
  date: string;
  onClose: () => void;
}

interface StreakData {
  currentStreak: number;
  recentAchievements: Array<{
    date: string;
    all_goals_met: boolean;
  }>;
}

export default function ProgressPanel({ date, onClose }: ProgressPanelProps) {
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, skipping progress fetch');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/nutrition/progress?date=${date}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setError('Failed to load progress');
    }
  }, [date]);

  const fetchStreak = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, skipping streak fetch');
        return;
      }

      const response = await fetch('/api/nutrition/streak', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized access to streak API');
          return;
        }
        throw new Error('Failed to fetch streak');
      }

      const data = await response.json();
      setStreak(data);
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    fetchStreak();
  }, [fetchProgress, fetchStreak]);

  useEffect(() => {
    if (progress && streak) {
      setLoading(false);
    }
  }, [progress, streak]);

  const getProgressColor = (percentage: number, met: boolean) => {
    if (met) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage: number, met: boolean) => {
    if (met) return 'text-green-700';
    if (percentage >= 80) return 'text-yellow-700';
    if (percentage >= 50) return 'text-orange-700';
    return 'text-red-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl max-w-md">
          <div className="text-center">
            <Icon name="alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || 'Failed to load progress'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Progress</h2>
            <p className="text-gray-600 mt-1">{formatDate(date)}</p>
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
          {/* Streak Counter */}
          {streak && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Goal Streak</h3>
                  <p className="text-purple-100">Days of meeting all goals</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{streak.currentStreak}</div>
                  <div className="text-purple-100 text-sm">days</div>
                </div>
              </div>
              
              {/* Streak Visualization */}
              <div className="mt-4 flex gap-1">
                {streak.recentAchievements.slice(0, 14).map((achievement, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      achievement.all_goals_met ? 'bg-white' : 'bg-purple-300'
                    }`}
                    title={`${achievement.date}: ${achievement.all_goals_met ? 'Goals met' : 'Goals not met'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Macro Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Calories</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.calories.percentage, progress.progress.calories.met)}`}>
                  {Math.round(progress.progress.calories.current)} / {progress.progress.calories.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.calories.percentage, progress.progress.calories.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.calories.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.calories.percentage)}% of target
              </p>
            </div>

            {/* Protein */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Protein</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.protein.percentage, progress.progress.protein.met)}`}>
                  {Math.round(progress.progress.protein.current)}g / {progress.progress.protein.target}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.protein.percentage, progress.progress.protein.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.protein.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.protein.percentage)}% of target
              </p>
            </div>

            {/* Carbs */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Carbs</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.carbs.percentage, progress.progress.carbs.met)}`}>
                  {Math.round(progress.progress.carbs.current)}g / {progress.progress.carbs.target}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.carbs.percentage, progress.progress.carbs.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.carbs.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.carbs.percentage)}% of target
              </p>
            </div>

            {/* Fat */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Fat</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.fat.percentage, progress.progress.fat.met)}`}>
                  {Math.round(progress.progress.fat.current)}g / {progress.progress.fat.target}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.fat.percentage, progress.progress.fat.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.fat.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.fat.percentage)}% of target
              </p>
            </div>

            {/* Fiber */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Fiber</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.fiber.percentage, progress.progress.fiber.met)}`}>
                  {Math.round(progress.progress.fiber.current)}g / {progress.progress.fiber.target}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.fiber.percentage, progress.progress.fiber.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.fiber.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.fiber.percentage)}% of target
              </p>
            </div>

            {/* Sugar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Sugar</h4>
                <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.sugar.percentage, progress.progress.sugar.met)}`}>
                  {Math.round(progress.progress.sugar.current)}g / {progress.progress.sugar.target}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.sugar.percentage, progress.progress.sugar.met)}`}
                  style={{ width: `${Math.min(100, progress.progress.sugar.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress.progress.sugar.percentage)}% of limit
              </p>
            </div>
          </div>

          {/* Sodium */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Sodium</h4>
              <span className={`text-sm font-medium ${getProgressTextColor(progress.progress.sodium.percentage, progress.progress.sodium.met)}`}>
                {Math.round(progress.progress.sodium.current)}mg / {progress.progress.sodium.target}mg
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progress.sodium.percentage, progress.progress.sodium.met)}`}
                style={{ width: `${Math.min(100, progress.progress.sodium.percentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress.progress.sodium.percentage)}% of limit
            </p>
          </div>

          {/* Overall Progress Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Daily Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {Object.values(progress.progress).filter(p => p.met).length}
                </div>
                <div className="text-gray-600">Goals Met</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {Object.values(progress.progress).length}
                </div>
                <div className="text-gray-600">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {Math.round(Object.values(progress.progress).reduce((acc, p) => acc + p.percentage, 0) / Object.values(progress.progress).length)}%
                </div>
                <div className="text-gray-600">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {progress.totals?.meal_count || 0}
                </div>
                <div className="text-gray-600">Meals Logged</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
