"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getUserRankWithContext, type LeaderboardEntry } from '@/lib/leaderboards/query';
import { Badge } from '@/ui/DS';

interface RankWidgetProps {
  className?: string;
}

export default function RankWidget({ className = '' }: RankWidgetProps) {
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRank = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const rank = await getUserRankWithContext(user.id, 'overall', {
          timeRange: 'month',
          verifiedOnly: true,
          sortBy: 'volume'
        });

        setUserRank(rank);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rank');
      } finally {
        setLoading(false);
      }
    };

    loadUserRank();
  }, []);

  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !userRank) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">🏆</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {error ? 'Rank unavailable' : 'Complete a workout to see your rank'}
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    if (rank === 2) return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    if (rank === 3) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    if (rank <= 10) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-800/50';
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-lg">🏆</div>
          <h3 className="font-medium text-gray-900 dark:text-white">Your Rank</h3>
        </div>
        <Badge tone="info" size="sm">This Month</Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Overall Rank</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getRankColor(userRank.rank)}`}>
            {getRankIcon(userRank.rank)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Reps</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {userRank.total_reps.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {Math.round(userRank.avg_quality_score)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Verified Sessions</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {userRank.verified_sessions || 0} / {userRank.total_sessions}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Percentile</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Top {userRank.total_entries ? Math.round(((userRank.total_entries - userRank.rank + 1) / userRank.total_entries) * 100) : 0}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Athletes</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {(userRank.total_entries || 0).toLocaleString()}
          </span>
        </div>
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Reps</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {userRank.total_reps.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Quality</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(userRank.avg_quality_score)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <a
            href="/leaderboards"
            className="block w-full text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Leaderboards
          </a>
        </div>
      </div>
    </div>
  );
}
