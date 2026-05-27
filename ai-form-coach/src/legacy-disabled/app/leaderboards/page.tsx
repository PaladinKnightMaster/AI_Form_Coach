"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Badge, Button, Icon } from '@/ui/DS';
import { logEvent } from '@/lib/observability/events';
import Top10Notification from '@/components/leaderboards/Top10Notification';
import TransparencyPanel from '@/components/leaderboards/TransparencyPanel';
import { 
  getLeaderboardByExercisePaginated,
  getOverallLeaderboardPaginated,
  getUserRankWithContext,
  getUserDepthSparkline,
  type LeaderboardEntry,
  type LeaderboardFilters,
  type TimeRange,
  type Exercise,
  type DepthSparklinePoint
} from '@/lib/leaderboards/query';

type LeaderboardType = 'overall' | 'exercise' | 'friends';
type SortBy = 'reps' | 'correct_rate' | 'volume' | 'integrity';

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
  
  // P10: Enhanced state for pagination and sparklines
  const [currentPage, setCurrentPage] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [sparklineData, setSparklineData] = useState<Map<string, DepthSparklinePoint[]>>(new Map());
  const [loadingSparkline, setLoadingSparkline] = useState<Set<string>>(new Set());

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

  // Load leaderboard data with pagination
  const loadLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: LeaderboardFilters = {
        timeRange,
        verifiedOnly,
        limit: 50,
        offset: currentPage * 50,
        sortBy
      };

      let data: LeaderboardEntry[] = [];

      if (activeTab === 'overall') {
        data = await getOverallLeaderboardPaginated(filters);
      } else if (activeTab === 'exercise') {
        data = await getLeaderboardByExercisePaginated(selectedExercise, filters);
      } else if (activeTab === 'friends') {
        // For now, show overall leaderboard (friends functionality can be added later)
        data = await getOverallLeaderboardPaginated(filters);
      }

      setLeaderboardData(data);
      
      // Update total entries from first entry if available
      if (data.length > 0 && data[0].total_entries) {
        setTotalEntries(data[0].total_entries);
      }
      
      // Track leaderboard view
      logEvent('leaderboard_view', {
        tab: activeTab,
        exercise: activeTab === 'exercise' ? selectedExercise : 'overall',
        timeRange,
        verifiedOnly,
        sortBy,
        page: currentPage,
        totalEntries: data.length > 0 ? data[0].total_entries : 0
      });
      
      // Load user's rank if logged in
      if (currentUser) {
        const userRankData = await getUserRankWithContext(
          currentUser.id,
          activeTab === 'overall' ? 'overall' : selectedExercise,
          { timeRange, verifiedOnly, sortBy }
        );
        setUserRank(userRankData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, timeRange, verifiedOnly, selectedExercise, currentPage, currentUser]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // Load sparkline data for a specific user
  const loadSparklineData = useCallback(async (userId: string, exercise: Exercise) => {
    if (sparklineData.has(userId) || loadingSparkline.has(userId)) return;
    
    setLoadingSparkline(prev => new Set(prev).add(userId));
    
    try {
      const data = await getUserDepthSparkline(userId, exercise, {
        timeRange,
        verifiedOnly
      });
      
      setSparklineData(prev => new Map(prev).set(userId, data));
    } catch (err) {
      console.error('Failed to load sparkline data:', err);
    } finally {
      setLoadingSparkline(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [timeRange, verifiedOnly, sparklineData, loadingSparkline]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setExpandedRow(null); // Close expanded rows when changing pages
  };

  // Reset pagination when filters change and track filter changes
  useEffect(() => {
    setCurrentPage(0);
    
    // Track filter changes (but not on initial load)
    if (leaderboardData.length > 0) {
      logEvent('leaderboard_filter_change', {
        tab: activeTab,
        exercise: activeTab === 'exercise' ? selectedExercise : 'overall',
        timeRange,
        verifiedOnly,
        sortBy
      });
    }
  }, [activeTab, sortBy, timeRange, verifiedOnly, selectedExercise, leaderboardData.length]);

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
    const userId = entry.user_id;
    const exercise = activeTab === 'overall' ? 'overall' : selectedExercise;
    
    // Load sparkline data if not already loaded
    if (!sparklineData.has(userId) && !loadingSparkline.has(userId)) {
      loadSparklineData(userId, exercise as Exercise);
    }
    
    const data = sparklineData.get(userId) || [];
    const isLoading = loadingSparkline.has(userId);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-32 h-8">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="text-gray-400 text-xs">No data</div>
      );
    }
    
    // Simple sparkline representation
    const avgDepth = data.reduce((sum, point) => sum + point.avg_depth, 0) / data.length;
    const bars = Math.ceil((avgDepth / 100) * 10);
    
    return (
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-1 rounded-sm ${
              i < bars ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            style={{ height: `${(i + 1) * 10}%` }}
          />
        ))}
        <span className="ml-2 text-xs text-gray-600">
          {avgDepth.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Top 10 Notifications */}
      {activeTab === 'exercise' && (
        <Top10Notification exercise={selectedExercise as 'squat' | 'pushup' | 'plank'} timeRange={timeRange} />
      )}
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <Badge tone="neutral" size="lg" className="bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-700 border-slate-200">
            🏆 Leaderboards
          </Badge>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
            Fitness Leaderboards
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compete with verified athletes and track your progress
          </p>
        </div>

        {/* Transparency Panel */}
        <TransparencyPanel className="mb-6" />

        {/* Filters */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">
                    Verified Only
                  </span>
                  <div className="text-xs text-gray-500">
                    {verifiedOnly ? 'Showing verified sessions only' : 'Including unverified sessions'}
                  </div>
                </div>
              </label>
            </div>

            {/* Exercise Selection (for exercise tab) */}
            {activeTab === 'exercise' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise
                </label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value as Exercise)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                >
                  <option value="reps">Total Reps</option>
                  <option value="correct_rate">Correct Rate</option>
                  <option value="volume">Volume (Reps × Quality)</option>
                  <option value="integrity">Integrity Score</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b border-gray-200">
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                <span className="ml-3 text-gray-600">Loading leaderboard...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">{error}</p>
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
                <p className="text-gray-600">No data available for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Athlete</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <div className="flex items-center">
                          Total Reps
                          <div className="ml-1 group relative">
                            <Icon name="alert-circle" className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Total number of reps completed across all sessions
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <div className="flex items-center">
                          Sessions
                          <div className="ml-1 group relative">
                            <Icon name="alert-circle" className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Number of workout sessions completed
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <div className="flex items-center">
                          Quality
                          <div className="ml-1 group relative">
                            <Icon name="alert-circle" className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Average quality score (0-100%) across all reps
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <div className="flex items-center">
                          Correct Rate
                          <div className="ml-1 group relative">
                            <Icon name="alert-circle" className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Percentage of reps scoring above 70% quality
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <div className="flex items-center">
                          Integrity
                          <div className="ml-1 group relative">
                            <Icon name="alert-circle" className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Consistency of good form throughout sessions
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <>
                        <tr
                          key={entry.user_id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            currentUser?.id === entry.user_id ? 'bg-blue-50' : ''
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
                                <div className="font-medium text-gray-900">
                                  {formatEmail(entry.user_email)}
                                </div>
                                {currentUser?.id === entry.user_id && (
                                  <div className="text-xs text-blue-600">You</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {entry.total_reps.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {entry.total_sessions}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {renderSparkline(entry)}
                              <span className="ml-2 text-sm text-gray-600">
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
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {expandedRow === index ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="py-6 px-4">
                              <div className="space-y-4">
                                {/* Performance Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Best Session</div>
                                    <div className="text-gray-600">
                                      {entry.best_session_date ? new Date(entry.best_session_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Last Session</div>
                                    <div className="text-gray-600">
                                      {entry.last_session_date ? new Date(entry.last_session_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Total Volume</div>
                                    <div className="text-gray-600">
                                      {Math.round(entry.total_volume).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Verified Sessions</div>
                                    <div className="text-gray-600">
                                      {entry.verified_sessions || 0} / {entry.total_sessions}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Depth Sparkline */}
                                <div>
                                  <div className="font-medium text-gray-700 mb-2">Performance Trend</div>
                                  <div className="bg-white rounded-lg p-4 border">
                                    {renderSparkline(entry)}
                                  </div>
                                </div>
                                
                                {/* Additional Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Average Quality</div>
                                    <div className="text-gray-600">
                                      {Math.round(entry.avg_quality_score)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Correct Rate</div>
                                    <div className="text-gray-600">
                                      {Math.round(entry.correct_rate * 100)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">Integrity Score</div>
                                    <div className="text-gray-600">
                                      {Math.round(entry.integrity_score * 100)}%
                                    </div>
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
            
            {/* Pagination Controls */}
            {leaderboardData.length > 0 && totalEntries > 50 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * 50 + 1} to {Math.min((currentPage + 1) * 50, totalEntries)} of {totalEntries} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    size="sm"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {Math.ceil(totalEntries / 50)}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={(currentPage + 1) * 50 >= totalEntries}
                    size="sm"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {/* User Rank Display */}
            {userRank && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Your Rank</h3>
                    <p className="text-sm text-blue-700">
                      You&apos;re ranked #{userRank.rank} out of {userRank.total_entries || 0} athletes
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      #{userRank.rank}
                    </div>
                    <div className="text-sm text-blue-700">
                      {userRank.total_entries ? Math.round(((userRank.total_entries - userRank.rank + 1) / userRank.total_entries) * 100) : 0}th percentile
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
