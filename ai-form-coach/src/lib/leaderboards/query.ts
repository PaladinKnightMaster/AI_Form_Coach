/**
 * Leaderboard Query Library
 * 
 * Provides functions to query leaderboards with various filters and sorting options
 */

import { getSupabaseClient } from '@/lib/supabase/client';

export type TimeRange = 'today' | 'week' | 'month' | 'all';
export type Exercise = 'squat' | 'pushup' | 'plank' | 'overall';

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
  verified_sessions?: number;
  total_entries?: number;
}

export interface LeaderboardFilters {
  timeRange: TimeRange;
  verifiedOnly: boolean;
  exercise?: Exercise;
  limit?: number;
  offset?: number;
  sortBy?: 'reps' | 'correct_rate' | 'volume' | 'integrity';
}

export interface UserRank {
  rank: number;
  total_entries: number;
  percentile: number;
  entry: LeaderboardEntry;
}

export interface DepthSparklinePoint {
  session_date: string;
  avg_depth: number;
  session_count: number;
}

export interface Top10CheckResult {
  entered: boolean;
  leaderboards: string[];
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

// =====================================================
// P10: ENHANCED LEADERBOARD FUNCTIONS
// =====================================================

/**
 * Get leaderboard by exercise with pagination and enhanced filtering
 */
export async function getLeaderboardByExercisePaginated(
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const sortBy = filters.sortBy || 'reps';
  
  const { data, error } = await supabase.rpc('get_leaderboard_by_exercise_paginated', {
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit,
    p_offset: offset,
    p_sort_by: sortBy
  });
  
  if (error) {
    console.error('Error fetching paginated leaderboard by exercise:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get overall leaderboard with pagination and enhanced filtering
 */
export async function getOverallLeaderboardPaginated(
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const sortBy = filters.sortBy || 'volume';
  
  const { data, error } = await supabase.rpc('get_overall_leaderboard_paginated', {
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit,
    p_offset: offset,
    p_sort_by: sortBy
  });
  
  if (error) {
    console.error('Error fetching paginated overall leaderboard:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get user's rank with full context including pagination info
 */
export async function getUserRankWithContext(
  userId: string,
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<LeaderboardEntry | null> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const sortBy = filters.sortBy || 'reps';
  
  const { data, error } = await supabase.rpc('get_user_rank_with_context', {
    p_user_id: userId,
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_sort_by: sortBy
  });
  
  if (error) {
    console.error('Error fetching user rank with context:', error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Get user's depth sparkline data for performance visualization
 */
export async function getUserDepthSparkline(
  userId: string,
  exercise: Exercise,
  filters: LeaderboardFilters = { timeRange: 'all', verifiedOnly: true }
): Promise<DepthSparklinePoint[]> {
  const supabase = getSupabaseClient();
  
  const timeFilter = getTimeRangeFilter(filters.timeRange);
  const limit = 20; // Default limit for sparkline data
  
  const { data, error } = await supabase.rpc('get_user_depth_sparkline', {
    p_user_id: userId,
    p_exercise: exercise,
    p_time_filter: timeFilter,
    p_verified_only: filters.verifiedOnly,
    p_limit: limit
  });
  
  if (error) {
    console.error('Error fetching user depth sparkline:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Enhanced top 10 check with better performance
 */
export async function checkTop10EntryEnhanced(
  userId: string,
  exercise: Exercise,
  timeRange: TimeRange = 'all'
): Promise<Top10CheckResult> {
  try {
    const supabase = getSupabaseClient();
    
    // Convert timeRange to the format expected by the SQL function
    const timeFilter = timeRange === 'all' ? '1=1' : timeRange;
    
    const { data, error } = await supabase.rpc('check_top_10_entry', {
      p_user_id: userId,
      p_exercise: exercise,
      p_time_filter: timeFilter
    });
    
    if (error) {
      // Check if it's a function not found error
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        console.warn('Leaderboards RPC function not available, skipping top 10 check');
        return { entered: false, leaderboards: [] };
      }
      
      // Log other errors but don't spam the console
      console.warn('Leaderboards check failed:', error.message || 'Unknown error');
      return { entered: false, leaderboards: [] };
    }
    
    const result = data?.[0];
    if (!result) {
      return { entered: false, leaderboards: [] };
    }
    
    return {
      entered: result.is_top_10 || false,
      leaderboards: result.is_top_10 ? [exercise] : []
    };
  } catch (error) {
    // Only log unexpected errors, not RPC function issues
    if (error instanceof Error && !error.message.includes('function')) {
      console.warn('Unexpected error in checkTop10EntryEnhanced:', error.message);
    }
    return { entered: false, leaderboards: [] };
  }
}
