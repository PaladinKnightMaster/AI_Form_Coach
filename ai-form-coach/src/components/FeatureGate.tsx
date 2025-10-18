"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/lib/subscription/subscriptionService';
import type { SubscriptionFeatures } from '@/lib/subscription/types';

interface FeatureGateProps {
  feature: keyof SubscriptionFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className = ''
}: FeatureGateProps) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      
      if (user) {
        const access = await subscriptionService.checkFeatureAccess(user.id, feature);
        setHasAccess(access);
      } else {
        // For non-authenticated users, check free tier access
        const freeFeatures = subscriptionService.getFeatureAccess('free');
        const freeAccess = freeFeatures[feature];
        setHasAccess(freeAccess);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [feature, user]);

  useEffect(() => {
    checkAccess();
  }, [feature, checkAccess]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="star" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Pro Feature
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getFeatureDescription(feature)}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link href="/pricing">
              <Button variant="primary" className="w-full sm:w-auto">
                <Icon name="star" className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          ) : (
            <Link href="/signin">
              <Button variant="primary" className="w-full sm:w-auto">
                <Icon name="user" className="w-4 h-4 mr-2" />
                Sign In to Upgrade
              </Button>
            </Link>
          )}
          
          <Link href="/pricing">
            <Button variant="secondary" className="w-full sm:w-auto">
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getFeatureDescription(feature: keyof SubscriptionFeatures): string {
  const descriptions: Record<keyof SubscriptionFeatures, string> = {
    ai_plan_generation: 'Generate personalized workout plans with AI based on your goals and preferences.',
    custom_plan_creation: 'Create and customize your own workout programs with advanced planning tools.',
    plan_optimization: 'Get AI-powered recommendations to optimize your workout plans for better results.',
    detailed_trends: 'Access detailed analytics and trends to track your fitness progress over time.',
    advanced_analytics: 'View comprehensive analytics including form quality, performance metrics, and insights.',
    export_data: 'Export your workout data and progress reports in various formats.',
    historical_insights: 'Access historical data and insights to understand your fitness journey.',
    health_data_sync: 'Sync with Apple Health, Google Fit, and other health platforms for comprehensive tracking.',
    readiness_assessment: 'Get daily readiness assessments to optimize your training schedule.',
    health_insights: 'Receive personalized health insights based on your data and goals.',
    basic_nutrition_tracking: 'Track your daily nutrition with basic macro counting and meal logging.',
    advanced_nutrition_features: 'Access advanced nutrition features including quick food search, barcode scanning, and detailed nutrition insights.',
    coach_packs_access: 'Access premium coach packs with specialized workout programs.',
    premium_programs: 'Unlock premium workout programs designed by fitness experts.',
    monthly_challenges: 'Participate in monthly fitness challenges with the community.',
    challenge_analytics: 'Track your challenge progress with detailed analytics and insights.',
    leaderboards: 'Compete with other users on leaderboards and see how you rank.',
    unlimited_sessions: 'Store unlimited workout sessions and access your complete history.',
    priority_support: 'Get priority customer support with faster response times.',
    early_access: 'Get early access to new features and updates before they\'re released to everyone.'
  };

  return descriptions[feature] || 'This feature is available with a Pro subscription.';
}

// Hook for checking feature access
export function useFeatureAccess(feature: keyof SubscriptionFeatures) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const access = await subscriptionService.checkFeatureAccess(user.id, feature);
        setHasAccess(access);
      } else {
        const freeFeatures = subscriptionService.getFeatureAccess('free');
        setHasAccess(freeFeatures[feature]);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    checkAccess();
  }, [feature, checkAccess]);

  return { hasAccess, loading, refetch: checkAccess };
}
