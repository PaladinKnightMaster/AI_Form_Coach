"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import ActivityFeed from './ActivityFeed';
import RealTimeFeedback from '../feedback/RealTimeFeedback';
import FairCompetition from '../competition/FairCompetition';
import type { ActivityStats } from '@/types/activity';

interface EnhancedNavigationProps {
  className?: string;
}

export default function EnhancedNavigation({ className = '' }: EnhancedNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'feed' | 'feedback' | 'competition'>('feed');
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { success: showSuccess } = useToastContext();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated first
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      setIsAuthenticated(!!user);
      
      if (!user) {
        // User not authenticated, don't fetch stats
        setStats(null);
        return;
      }
      
      const response = await fetch('/api/activity/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      id: 'feed',
      label: 'Activity Feed',
      icon: 'activity',
      description: 'See what your community is up to',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'feedback',
      label: 'Real-time Feedback',
      icon: 'message-circle',
      description: 'Get instant coaching during workouts',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'competition',
      label: 'Fair Competition',
      icon: 'trophy',
      description: 'Compete with similar fitness levels',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const quickActions = [
    {
      label: 'Start Workout',
      icon: 'play',
      href: '/coach',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'View Plans',
      icon: 'calendar',
      href: '/plans',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'Nutrition',
      icon: 'apple',
      href: '/nutrition',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      label: 'Challenges',
      icon: 'target',
      href: '/challenges',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 7) return `${streak} day streak - keep it up!`;
    if (streak < 30) return `${streak} day streak - you're on fire! 🔥`;
    return `${streak} day streak - you're unstoppable! 🚀`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with Stats */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community Hub
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Stay motivated with real-time feedback and fair competition
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUserStats}
            disabled={loading}
          >
            <Icon name="refresh-cw" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalWorkouts}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.streak}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.achievements}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.challengesCompleted}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Challenges</div>
            </div>
          </div>
        )}

        {/* Streak Message */}
        {stats && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <Icon name="flame" className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {getStreakMessage(stats.streak)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as 'feed' | 'feedback' | 'competition')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Icon name={item.icon as 'activity' | 'message-circle' | 'trophy'} className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'feed' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Community Activity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See what your fitness community is up to and stay motivated
              </p>
            </div>
            {isAuthenticated ? (
              <ActivityFeed limit={5} />
            ) : (
              <div className="text-center py-8">
                <Icon name="lock" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to see community activity and connect with other fitness enthusiasts
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => router.push('/signin')}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Real-time Coaching
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get instant feedback and motivation during your workouts
              </p>
            </div>
            <RealTimeFeedback 
              exercise="squat" 
              isActive={false}
              className="max-w-2xl"
            />
          </div>
        )}

        {activeTab === 'competition' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fair Competition
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compete with users of similar fitness levels and track your progress
              </p>
            </div>
            <FairCompetition 
              exercise="squat" 
              period="weekly"
              className="max-w-4xl"
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              asChild
              className={`${action.color} text-white border-0`}
            >
              <a href={action.href}>
                <Icon name={action.icon as 'play' | 'calendar' | 'target' | 'trending-up'} className="w-4 h-4 mr-2" />
                {action.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
