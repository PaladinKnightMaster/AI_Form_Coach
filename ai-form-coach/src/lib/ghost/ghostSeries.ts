/**
 * Ghost Series Library
 * 
 * Provides functions to build ghost series from best verified sessions
 * and calculate live deltas for pacing comparison.
 */

import { getSupabaseClient } from '@/lib/supabase/client';

export type Exercise = 'squat' | 'pushup' | 'plank';
export type TimeRange = 'week' | 'month' | 'all';

export interface GhostDataPoint {
  timestamp: number; // milliseconds since session start
  cumulativeCorrectReps: number;
  totalReps: number;
}

export interface GhostSeries {
  exercise: Exercise;
  sessionId: string;
  sessionDate: string;
  totalDuration: number; // milliseconds
  totalReps: number;
  totalCorrectReps: number;
  dataPoints: GhostDataPoint[];
  qualityScore: number;
  integrityScore: number;
}

export interface LiveDataPoint {
  timestamp: number; // milliseconds since session start
  cumulativeCorrectReps: number;
  totalReps: number;
}

export interface LiveDelta {
  you: number; // current cumulative correct reps
  ghost: number; // ghost cumulative correct reps at same time
  delta: number; // difference (positive = ahead, negative = behind)
  percentage: number; // delta as percentage of ghost
  isAhead: boolean;
}

/**
 * Build ghost series from user's best verified session
 */
export async function buildGhostSeries(
  userId: string,
  exercise: Exercise,
  range: TimeRange = 'month'
): Promise<GhostSeries | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get best verified session for the user and exercise
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        ended_at,
        total_reps,
        total_time_seconds,
        avg_quality_score,
        integrity_score,
        correct_rate
      `)
      .eq('user_id', userId)
      .eq('exercise', exercise)
      .eq('verified', true)
      .gte('started_at', startDate.toISOString())
      .not('ended_at', 'is', null)
      .order('correct_rate', { ascending: false, nullsFirst: false })
      .order('avg_quality_score', { ascending: false, nullsFirst: false })
      .order('total_reps', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.warn('Error fetching verified session for ghost series:', sessionError);
      return null;
    }

    if (!session) {
      console.warn('No verified session found for ghost series');
      return null;
    }

    // Get rep data for the session
    const { data: reps, error: repsError } = await supabase
      .from('reps')
      .select(`
        idx,
        start_ms,
        end_ms,
        is_correct,
        quality_score
      `)
      .eq('session_id', session.id)
      .order('idx', { ascending: true });

    if (repsError || !reps || reps.length === 0) {
      console.warn('No rep data found for ghost series:', repsError);
      return null;
    }

    // Build ghost series data points
    const dataPoints: GhostDataPoint[] = [];
    
    // Calculate session duration in milliseconds
    const sessionStart = new Date(session.started_at).getTime();
    const sessionEnd = new Date(session.ended_at!).getTime();
    const totalDuration = sessionEnd - sessionStart;

    // Create data points every 5 seconds
    const intervalMs = 5000; // 5 seconds
    
    // Check if this session has correctness data (A4 feature)
    const hasCorrectnessData = reps.some(rep => rep.is_correct !== null);
    const totalCorrectReps = hasCorrectnessData 
      ? reps.filter(rep => rep.is_correct === true).length
      : reps.length; // For older sessions without correctness data, count all reps as correct

    for (let time = 0; time <= totalDuration; time += intervalMs) {
      // Count reps completed by this time
      const repsByTime = reps.filter(rep => rep.start_ms <= time);
      const correctRepsByTime = hasCorrectnessData
        ? repsByTime.filter(rep => rep.is_correct === true)
        : repsByTime; // For older sessions, count all reps as correct
      
      dataPoints.push({
        timestamp: time,
        cumulativeCorrectReps: correctRepsByTime.length,
        totalReps: repsByTime.length
      });
    }

    // Add final data point if not already included
    if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].timestamp < totalDuration) {
      dataPoints.push({
        timestamp: totalDuration,
        cumulativeCorrectReps: totalCorrectReps,
        totalReps: reps.length
      });
    }

    return {
      exercise,
      sessionId: session.id,
      sessionDate: session.started_at,
      totalDuration,
      totalReps: session.total_reps,
      totalCorrectReps: totalCorrectReps,
      dataPoints,
      qualityScore: session.avg_quality_score || 0,
      integrityScore: session.integrity_score || 0
    };

  } catch (error) {
    console.error('Error building ghost series:', error);
    return null;
  }
}

/**
 * Get live delta between current session and ghost series
 */
export function getLiveDelta(
  liveSeries: LiveDataPoint[],
  ghostSeries: GhostSeries,
  now: number // milliseconds since session start
): LiveDelta | null {
  if (liveSeries.length === 0 || ghostSeries.dataPoints.length === 0) {
    return null;
  }

  // Get current live data
  const currentLive = liveSeries[liveSeries.length - 1];
  const you = currentLive.cumulativeCorrectReps;

  // Find corresponding ghost data point
  let ghost = 0;
  let ghostDataPoint = ghostSeries.dataPoints[0];

  // Find the closest ghost data point to current time
  for (let i = 0; i < ghostSeries.dataPoints.length; i++) {
    const point = ghostSeries.dataPoints[i];
    if (point.timestamp <= now) {
      ghostDataPoint = point;
    } else {
      break;
    }
  }

  ghost = ghostDataPoint.cumulativeCorrectReps;

  // Calculate delta
  const delta = you - ghost;
  const percentage = ghost > 0 ? (delta / ghost) * 100 : 0;
  const isAhead = delta > 0;

  return {
    you,
    ghost,
    delta,
    percentage,
    isAhead
  };
}

/**
 * Interpolate ghost data point at specific time
 */
export function interpolateGhostAtTime(
  ghostSeries: GhostSeries,
  time: number
): number {
  if (ghostSeries.dataPoints.length === 0) {
    return 0;
  }

  if (time <= 0) {
    return 0;
  }

  if (time >= ghostSeries.totalDuration) {
    return ghostSeries.totalCorrectReps;
  }

  // Find surrounding data points
  let beforePoint: GhostDataPoint | null = null;
  let afterPoint: GhostDataPoint | null = null;

  for (let i = 0; i < ghostSeries.dataPoints.length; i++) {
    const point = ghostSeries.dataPoints[i];
    if (point.timestamp <= time) {
      beforePoint = point;
    } else {
      afterPoint = point;
      break;
    }
  }

  // If we're exactly on a data point
  if (beforePoint && beforePoint.timestamp === time) {
    return beforePoint.cumulativeCorrectReps;
  }

  // If we're before the first point
  if (!beforePoint) {
    return 0;
  }

  // If we're after the last point
  if (!afterPoint) {
    return beforePoint.cumulativeCorrectReps;
  }

  // Linear interpolation
  const timeDiff = afterPoint.timestamp - beforePoint.timestamp;
  const repDiff = afterPoint.cumulativeCorrectReps - beforePoint.cumulativeCorrectReps;
  const timeRatio = (time - beforePoint.timestamp) / timeDiff;

  return beforePoint.cumulativeCorrectReps + (repDiff * timeRatio);
}

/**
 * Get ghost series for current user and exercise
 */
export async function getCurrentUserGhostSeries(
  exercise: Exercise,
  range: TimeRange = 'month'
): Promise<GhostSeries | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    return await buildGhostSeries(user.id, exercise, range);
  } catch (error) {
    console.error('Error getting current user ghost series:', error);
    return null;
  }
}

/**
 * Check if ghost series is available for user and exercise
 */
export async function isGhostSeriesAvailable(
  userId: string,
  exercise: Exercise,
  range: TimeRange = 'month'
): Promise<boolean> {
  const ghostSeries = await buildGhostSeries(userId, exercise, range);
  return ghostSeries !== null;
}
