"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Badge } from '@/ui/DS';
import { 
  getTopByExercise, 
  getTopByCorrectRate, 
  getTopByVolume, 
  getOverallLeaderboard,
  type LeaderboardEntry,
  type LeaderboardFilters,
  type TimeRange,
  type Exercise
} from '@/lib/leaderboards/query';

type LeaderboardType = 'overall' | 'exercise' | 'friends';
type SortBy = 'reps' | 'correct_rate' | 'volume';

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('overall');
  const [sortBy, setSortBy] = useState<SortBy>('reps');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('squat');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || '' });
      }
    };
    loadUser();
  }, []);

  // Load leaderboard data
  const loadLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: LeaderboardFilters = {
        timeRange,
        verifiedOnly,
        limit: 50
      };

      let data: LeaderboardEntry[] = [];

      if (activeTab === 'overall') {
        data = await getOverallLeaderboard(filters);
      } else if (activeTab === 'exercise') {
        switch (sortBy) {
          case 'reps':
            data = await getTopByExercise(selectedExercise, filters);
            break;
          case 'correct_rate':
            data = await getTopByCorrectRate(selectedExercise, filters);
            break;
          case 'volume':
            data = await getTopByVolume(selectedExercise, filters);
            break;
        }
      } else if (activeTab === 'friends') {
        // For now, show overall leaderboard (friends functionality can be added later)
        data = await getOverallLeaderboard(filters);
      }

      setLeaderboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, timeRange, verifiedOnly, selectedExercise]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  const formatEmail = (email: string) => {
    const [username, domain] = email.split('@');
    return `${username.substring(0, 3)}***@${domain}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100';
    if (rank === 2) return 'text-gray-600 bg-gray-100';
    if (rank === 3) return 'text-orange-600 bg-orange-100';
    if (rank <= 10) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-50';
  };

  const renderSparkline = (entry: LeaderboardEntry) => {
    // Simple sparkline representation (in a real app, you'd use a proper charting library)
    const quality = Math.round(entry.avg_quality_score);
    const bars = Math.ceil(quality / 10);
    return (
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-1 rounded-sm ${
              i < bars ? 'bg-green-500' : 'bg-gray-200'
            }`}
            style={{ height: `${(i + 1) * 10}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900 dark:via-gray-900/30 dark:to-zinc-900/30">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <Badge tone="neutral" size="lg" className="bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800">
            🏆 Leaderboards
          </Badge>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
            Fitness Leaderboards
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Compete with verified athletes and track your progress
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Verified Only Toggle */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Verified Only
                </span>
              </label>
            </div>

            {/* Exercise Selection (for exercise tab) */}
            {activeTab === 'exercise' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exercise
                </label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value as Exercise)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="squat">Squat</option>
                  <option value="pushup">Push-up</option>
                  <option value="plank">Plank</option>
                </select>
              </div>
            )}

            {/* Sort By (for exercise tab) */}
            {activeTab === 'exercise' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="reps">Total Reps</option>
                  <option value="correct_rate">Correct Rate</option>
                  <option value="volume">Volume (Reps × Quality)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overall', label: 'Overall', icon: '🏆' },
                { key: 'exercise', label: 'By Exercise', icon: '💪' },
                { key: 'friends', label: 'Friends', icon: '👥' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as LeaderboardType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Leaderboard Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading leaderboard...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-2">⚠️ Error</div>
                <p className="text-gray-600 dark:text-gray-300">{error}</p>
                <button
                  onClick={loadLeaderboardData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-600 dark:text-gray-300">No data available for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Athlete</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Total Reps</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Sessions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Quality</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Correct Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Integrity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <>
                        <tr
                          key={entry.user_id}
                          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            currentUser?.id === entry.user_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankColor(entry.rank)}`}>
                              {getRankIcon(entry.rank)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                {entry.user_email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatEmail(entry.user_email)}
                                </div>
                                {currentUser?.id === entry.user_id && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400">You</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {entry.total_reps.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {entry.total_sessions}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {renderSparkline(entry)}
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                {Math.round(entry.avg_quality_score)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.correct_rate >= 0.8 ? 'bg-green-100 text-green-800' :
                              entry.correct_rate >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(entry.correct_rate * 100)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.integrity_score >= 0.8 ? 'bg-green-100 text-green-800' :
                              entry.integrity_score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(entry.integrity_score * 100)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                            >
                              {expandedRow === index ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr className="bg-gray-50 dark:bg-gray-800/50">
                            <td colSpan={8} className="py-4 px-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Best Session</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {entry.best_session_date ? new Date(entry.best_session_date).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Last Session</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {entry.last_session_date ? new Date(entry.last_session_date).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Total Volume</div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {Math.round(entry.total_volume).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
