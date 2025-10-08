/**
 * Leaderboard Query Library
 * 
 * Provides functions to query leaderboards with various filters and sorting options
 */

import { getSupabaseClient } from '@/lib/supabase/client';

export type TimeRange = 'today' | 'week' | 'month' | 'all';
export type Exercise = 'squat' | 'pushup' | 'plank';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_email: string;
  exercise: Exercise;
  total_reps: number;
  total_sessions: number;
  avg_quality_score: number;
  correct_rate: number;
  integrity_score: number;
  total_volume: number; // total_reps * avg_quality_score
  best_session_date: string;
  last_session_date: string;
}

export interface LeaderboardFilters {
  timeRange: TimeRange;
  verifiedOnly: boolean;
  exercise?: Exercise;
  limit?: number;
}

export interface UserRank {
  rank: number;
  total_entries: number;
  percentile: number;
  entry: LeaderboardEntry;
}

/**
 * Get time range filter for SQL queries
 */
function getTimeRangeFilter(timeRange: TimeRange): string {
  const now = new Date();
  
  switch (timeRange) {
    case 'today':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return `s.started_at >= '${today.toISOString()}'`;
    
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `s.started_at >= '${weekAgo.toISOString()}'`;
    
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `s.started_at >= '${monthAgo.toISOString()}'`;
    
    case 'all':
    default:
      return '1=1';
  }
}

/**
 * Get top users by exercise (total reps)
 */
export async function getTopByExercise(
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  
  const { data, error } = await supabase.rpc('get_leaderboard_by_exercise', {
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit
  });
  
  if (error) {
    console.error('Error fetching leaderboard by exercise:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get top users by correct rate
 */
export async function getTopByCorrectRate(
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  
  const { data, error } = await supabase.rpc('get_leaderboard_by_correct_rate', {
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit
  });
  
  if (error) {
    console.error('Error fetching leaderboard by correct rate:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get top users by volume (total reps * quality)
 */
export async function getTopByVolume(
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  
  const { data, error } = await supabase.rpc('get_leaderboard_by_volume', {
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit
  });
  
  if (error) {
    console.error('Error fetching leaderboard by volume:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get overall leaderboard (all exercises combined)
 */
export async function getOverallLeaderboard(
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  
  const { data, error } = await supabase.rpc('get_overall_leaderboard', {
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit
  });
  
  if (error) {
    console.error('Error fetching overall leaderboard:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get user's rank in a specific leaderboard
 */
export async function getUserRank(
  userId: string,
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<UserRank | null> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  
  const { data, error } = await supabase.rpc('get_user_rank', {
    p_user_id: userId,
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly
  });
  
  if (error) {
    console.error('Error fetching user rank:', error);
    throw error;
  }
  
  return data || null;
}

/**
 * Get user's overall rank across all exercises
 */
export async function getUserOverallRank(
  userId: string,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<UserRank | null> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  
  const { data, error } = await supabase.rpc('get_user_overall_rank', {
    p_user_id: userId,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly
  });
  
  if (error) {
    console.error('Error fetching user overall rank:', error);
    throw error;
  }
  
  return data || null;
}

/**
 * Check if user entered top 10 in any leaderboard
 */
export async function checkTop10Entry(
  userId: string,
  exercise: Exercise,
  timeRange: TimeRange = 'all'
): Promise<{ entered: boolean; leaderboards: string[] }> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(timeRange);
  
  const { data, error } = await supabase.rpc('check_top10_entry', {
    p_user_id: userId,
    p_exercise: exercise,
    p_time_filter: timeFilter
  });
  
  if (error) {
    console.error('Error checking top 10 entry:', error);
    throw error;
  }
  
  return data || { entered: false, leaderboards: [] };
}
