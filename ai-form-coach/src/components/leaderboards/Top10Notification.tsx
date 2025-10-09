"use client";

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { checkTop10EntryEnhanced } from '@/lib/leaderboards/query';
import { logEvent } from '@/lib/observability/events';
import { useToastContext } from '@/components/ToastProvider';

interface Top10NotificationProps {
  exercise: 'squat' | 'pushup' | 'plank';
  timeRange?: 'today' | 'week' | 'month' | 'all';
}

export default function Top10Notification({ 
  exercise, 
  timeRange = 'all' 
}: Top10NotificationProps) {
  const { success } = useToastContext();
  const lastCheckedRef = useRef<number>(0);
  const lastTop10Ref = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkForTop10Entry = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Only check if we haven't checked in the last 5 minutes
        const now = Date.now();
        if (now - lastCheckedRef.current < 5 * 60 * 1000) return;
        
        lastCheckedRef.current = now;

        // Check for top 10 entry
        const result = await checkTop10EntryEnhanced(user.id, exercise, timeRange);
        
        if (result.entered && result.leaderboards.length > 0) {
          // Check if this is a new top 10 entry (not previously seen)
          const currentKey = `${exercise}-${timeRange}-${result.leaderboards.join(',')}`;
          
          if (!lastTop10Ref.current.has(currentKey)) {
            lastTop10Ref.current.add(currentKey);
            
            const getLeaderboardName = (board: string) => {
              switch (board) {
                case 'overall': return 'Overall Leaderboard';
                case 'squat': return 'Squat Leaderboard';
                case 'pushup': return 'Push-up Leaderboard';
                case 'plank': return 'Plank Leaderboard';
                default: return board;
              }
            };

            const getExerciseEmoji = (board: string) => {
              switch (board) {
                case 'overall': return '🏆';
                case 'squat': return '🦵';
                case 'pushup': return '💪';
                case 'plank': return '🧘';
                default: return '🏅';
              }
            };

            const leaderboardList = result.leaderboards
              .map(board => `${getExerciseEmoji(board)} ${getLeaderboardName(board)}`)
              .join(', ');

            const timeRangeText = timeRange === 'all' ? '' : ` this ${timeRange}`;

            success(
              '🎉 New Top 10!',
              `You've entered the top 10 in: ${leaderboardList}${timeRangeText}. Keep up the great work! 🚀`
            );

            // Track the new top rank achievement
            logEvent('new_top_rank', {
              exercise,
              timeRange,
              leaderboards: result.leaderboards,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error checking top 10 entry:', error);
      }
    };

    // Check immediately and then every 2 minutes
    checkForTop10Entry();
    const interval = setInterval(checkForTop10Entry, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [exercise, timeRange, success]);

  return null; // This component doesn't render anything, it just triggers toasts
}
