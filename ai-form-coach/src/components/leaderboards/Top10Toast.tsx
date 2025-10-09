"use client";

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { checkTop10EntryEnhanced } from '@/lib/leaderboards/query';
import { useToastContext } from '@/components/ToastProvider';

interface Top10ToastProps {
  exercise: 'squat' | 'pushup' | 'plank';
}

export default function Top10Toast({ exercise }: Top10ToastProps) {
  const { success } = useToastContext();
  const lastCheckedRef = useRef<number>(0);

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
        const result = await checkTop10EntryEnhanced(user.id, exercise, 'all');
        
        if (result.entered && result.leaderboards.length > 0) {
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

          success(
            '🎉 Congratulations!',
            `You've entered the top 10 in: ${leaderboardList}. Keep up the great work! 🚀`
          );
        }
      } catch (error) {
        console.error('Error checking top 10 entry:', error);
      }
    };

    // Check immediately and then every 2 minutes
    checkForTop10Entry();
    const interval = setInterval(checkForTop10Entry, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [exercise, success]);

  return null; // This component doesn't render anything, it just triggers toasts
}
