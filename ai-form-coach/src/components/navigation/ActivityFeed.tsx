"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ActivityItem } from '@/components/activity/ActivityItem';
import type { ActivityFeedItem } from '@/types/activity';

interface ActivityFeedProps {
  className?: string;
  limit?: number;
}

export default function ActivityFeed({ className = '', limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess } = useToastContext();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated first
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User not authenticated, don't fetch activities
        setActivities([]);
        return;
      }
      
      const response = await fetch(`/api/activity/feed?limit=${limit}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleLikeActivity = async (activityId: string, activityType: string) => {
    try {
      const response = await fetch('/api/activity/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId,
          activityType
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update local state
        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { 
                ...activity, 
                likes: result.liked ? activity.likes + 1 : Math.max(0, activity.likes - 1),
                liked: result.liked
              }
            : activity
        ));
        showSuccess(
          result.liked ? 'Activity liked!' : 'Like removed!', 
          result.liked ? 'Your support has been recorded.' : 'Like has been removed.'
        );
      }
    } catch (error) {
      console.error('Error liking activity:', error);
    }
  };

  const handleCommentActivity = (activityId: string, activityType: string) => {
    // TODO: Implement comment modal or navigation
    console.log('Comment on activity:', activityId, activityType);
  };


  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Icon name="activity" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No recent activity
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Start a workout to see activity updates here
        </p>
        <Button asChild>
          <a href="/coach">Start Workout</a>
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <Button variant="secondary" size="sm" onClick={fetchActivities}>
          <Icon name="refresh" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onLike={handleLikeActivity}
          onComment={handleCommentActivity}
        />
      ))}
    </div>
  );
}
