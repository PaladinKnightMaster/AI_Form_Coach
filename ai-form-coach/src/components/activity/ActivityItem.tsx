"use client";

import { useState } from 'react';
import { Icon } from '@/ui/DS';
import type { ActivityFeedItem } from '@/types/activity';

interface ActivityItemProps {
  activity: ActivityFeedItem;
  onLike?: (activityId: string, activityType: string) => void;
  onComment?: (activityId: string, activityType: string) => void;
}

export function ActivityItem({ activity, onLike, onComment }: ActivityItemProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [, setIsCommenting] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await fetch('/api/activity/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.id,
          activityType: activity.type
        })
      });

      if (response.ok) {
        const _result = await response.json();
        if (onLike) {
          onLike(activity.id, activity.type);
        }
      }
    } catch (error) {
      console.error('Error liking activity:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(activity.id, activity.type);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {activity.userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-white">
            {activity.userName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatTimeAgo(activity.timestamp)}
          </div>
        </div>
        {activity.type === 'achievement' && (
          <div className="text-2xl">🏆</div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          {activity.description}
        </p>
        
        {/* Metrics */}
        {activity.metrics && (
          <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            {activity.metrics.duration && (
              <span className="flex items-center gap-1">
                <Icon name="clock" className="w-4 h-4" />
                {activity.metrics.duration}
              </span>
            )}
            {activity.metrics.reps && (
              <span className="flex items-center gap-1">
                <Icon name="activity" className="w-4 h-4" />
                {activity.metrics.reps} reps
              </span>
            )}
            {activity.metrics.calories && (
              <span className="flex items-center gap-1">
                <Icon name="flame" className="w-4 h-4" />
                {activity.metrics.calories} cal
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
            activity.liked
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Icon 
            name={activity.liked ? "heart" : "heart"} 
            className={`w-4 h-4 ${activity.liked ? 'fill-current' : ''}`} 
          />
          {isLiking ? '...' : activity.likes}
        </button>

        <button
          onClick={handleComment}
          disabled={isCommenting}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors duration-200"
        >
          <Icon name="message" className="w-4 h-4" />
          {activity.comments}
        </button>

        <div className="flex-1" />
        
        <div className="text-xs text-gray-400">
          {activity.privacy === 'public' ? 'Public' : 'Private'}
        </div>
      </div>
    </div>
  );
}
