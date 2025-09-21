"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/ui/DS';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DailyProgress } from '@/types/nutrition';

interface ProteinAdvisoryProps {
  date: string;
  onDismiss?: () => void;
}

export default function ProteinAdvisory({ date, onDismiss }: ProteinAdvisoryProps) {
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetchProgress();
  }, [date]);

  const checkAuthAndFetchProgress = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('User not authenticated, skipping progress fetch');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      await fetchProgress();
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, skipping progress fetch');
        setProgress(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/nutrition/progress?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized access to progress API');
          setProgress(null);
          return;
        }
        console.error('Failed to fetch progress:', response.status, response.statusText);
        setProgress(null);
        return;
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Check if we should show the advisory
  const shouldShowAdvisory = () => {
    if (loading || dismissed || !isAuthenticated || !progress || !progress.progress) return false;

    const now = new Date();
    const currentHour = now.getHours();
    
    // Only show after 5 PM (17:00) and before midnight
    if (currentHour < 17 || currentHour >= 24) return false;

    // Check if protein is below 70% of target
    const proteinProgress = progress.progress.protein;
    if (!proteinProgress) return false;
    
    const proteinPercentage = proteinProgress.percentage;
    return proteinPercentage < 70 && !proteinProgress.met;
  };

  if (!shouldShowAdvisory()) {
    return null;
  }

  const proteinProgress = progress!.progress.protein;
  const remainingProtein = Math.max(0, proteinProgress.target - proteinProgress.current);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="alert-triangle" className="w-5 h-5" />
              <h4 className="font-semibold">Protein Reminder</h4>
            </div>
            <p className="text-orange-100 text-sm mb-2">
              You&apos;re at {Math.round(proteinProgress.percentage)}% of your protein goal for today.
            </p>
            <p className="text-orange-100 text-sm">
              Consider adding {Math.round(remainingProtein)}g more protein to reach your target.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-orange-200 hover:text-white transition-colors ml-2"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-orange-300 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, proteinProgress.percentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-orange-100 mt-1">
            <span>{Math.round(proteinProgress.current)}g</span>
            <span>{proteinProgress.target}g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
