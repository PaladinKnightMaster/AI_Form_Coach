/**
 * Session Integrity Checking Algorithms
 * 
 * Implements Strava-like integrity verification checks:
 * - ROM Consistency: Checks range of motion consistency across reps
 * - Tempo Realism: Verifies rep tempo is realistic
 * - Progression Naturalness: Ensures performance improvements are natural
 * - Outlier Detection: Identifies statistical anomalies
 */

import type {
  IntegrityCheckResult,
  ROMConsistencyCheck,
  TempoRealismCheck,
  ProgressionCheck,
  OutlierDetectionCheck,
  ROMConsistencyThresholds,
  TempoRealismThresholds,
  ProgressionNaturalnessThresholds,
  OutlierDetectionThresholds
} from '@/types/verification';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Calculate standard deviation of an array
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate mean of an array
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate coefficient of variation (CV)
 */
function calculateCV(values: number[]): number {
  const mean = calculateMean(values);
  if (mean === 0) return 0;
  
  const stdDev = calculateStdDev(values);
  return stdDev / mean;
}

/**
 * Calculate Z-score for a value
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// ==========================================
// Session Data Interface
// ==========================================

export interface SessionData {
  id: string;
  user_id: string;
  exercise: 'squat' | 'pushup' | 'plank';
  total_reps: number;
  total_time_seconds: number;
  avg_rom_score: number;
  avg_tempo_ms: number;
  started_at: string;
  ended_at: string;
  reps?: RepData[]; // Individual rep data if available
}

export interface RepData {
  idx: number;
  start_ms: number;
  end_ms: number;
  peak_depth?: number;
  rom_score?: number;
  avg_tempo_ms?: number;
}

export interface UserSessionHistory {
  sessions: SessionData[];
}

// ==========================================
// Check 1: ROM Consistency
// ==========================================

/**
 * Checks that range of motion scores are consistent across reps
 * 
 * Pass criteria:
 * - Average ROM score >= minimum threshold
 * - Standard deviation of ROM scores <= maximum threshold
 * - Sufficient reps for statistical significance
 */
export function checkROMConsistency(
  session: SessionData,
  thresholds: ROMConsistencyThresholds
): ROMConsistencyCheck {
  const { min_avg_rom_score, max_rom_std_deviation, min_reps_for_check } = thresholds;
  
  // Extract ROM scores from reps
  const romScores = (session.reps || [])
    .map(rep => rep.rom_score)
    .filter((score): score is number => score !== undefined && score !== null);
  
  // Not enough reps to check
  if (romScores.length < min_reps_for_check) {
    return {
      check_type: 'rom_consistency_check',
      passed: true, // Pass by default if insufficient data
      score: 1.0,
      message: `Insufficient reps for ROM consistency check (${romScores.length} < ${min_reps_for_check})`,
      details: {
        avg_rom_score: session.avg_rom_score || 0,
        rom_std_deviation: 0,
        min_rom_score: 0,
        max_rom_score: 0,
        rep_count: romScores.length,
        threshold_min_avg: min_avg_rom_score,
        threshold_max_std_dev: max_rom_std_deviation
      },
      severity: 'info'
    };
  }
  
  const avgROM = calculateMean(romScores);
  const stdDevROM = calculateStdDev(romScores);
  const minROM = Math.min(...romScores);
  const maxROM = Math.max(...romScores);
  
  // Check pass conditions
  const avgROMPass = avgROM >= min_avg_rom_score;
  const stdDevPass = stdDevROM <= max_rom_std_deviation;
  const passed = avgROMPass && stdDevPass;
  
  // Calculate score (0-1)
  const avgROMScore = Math.min(avgROM / min_avg_rom_score, 1.0);
  const stdDevScore = Math.max(1 - (stdDevROM / max_rom_std_deviation), 0);
  const score = (avgROMScore * 0.6) + (stdDevScore * 0.4); // Weight avg more than consistency
  
  // Generate message
  let message = '';
  if (!avgROMPass) {
    message = `Low average ROM score (${avgROM.toFixed(2)} < ${min_avg_rom_score})`;
  } else if (!stdDevPass) {
    message = `Inconsistent ROM across reps (std dev: ${stdDevROM.toFixed(2)})`;
  } else {
    message = `ROM consistency check passed (avg: ${avgROM.toFixed(2)}, std dev: ${stdDevROM.toFixed(2)})`;
  }
  
  return {
    check_type: 'rom_consistency_check',
    passed,
    score,
    message,
    details: {
      avg_rom_score: avgROM,
      rom_std_deviation: stdDevROM,
      min_rom_score: minROM,
      max_rom_score: maxROM,
      rep_count: romScores.length,
      threshold_min_avg: min_avg_rom_score,
      threshold_max_std_dev: max_rom_std_deviation
    },
    severity: passed ? 'info' : 'warning'
  };
}

// ==========================================
// Check 2: Tempo Realism
// ==========================================

/**
 * Checks that rep tempo is within realistic bounds
 * 
 * Pass criteria:
 * - Average tempo within min/max bounds
 * - Tempo variance not too high (not erratic)
 */
export function checkTempoRealism(
  session: SessionData,
  thresholds: TempoRealismThresholds
): TempoRealismCheck {
  const { min_tempo_ms, max_tempo_ms, max_tempo_variance } = thresholds;
  
  // Extract tempo data
  const tempoValues = (session.reps || [])
    .map(rep => rep.avg_tempo_ms || (rep.end_ms - rep.start_ms))
    .filter((tempo): tempo is number => tempo !== undefined && tempo > 0);
  
  // Use session average if no rep data
  const avgTempo = tempoValues.length > 0 
    ? calculateMean(tempoValues) 
    : session.avg_tempo_ms || 0;
  
  if (avgTempo === 0) {
    return {
      check_type: 'tempo_realism_check',
      passed: true,
      score: 1.0,
      message: 'No tempo data available',
      details: {
        avg_tempo_ms: 0,
        min_tempo_ms: 0,
        max_tempo_ms: 0,
        tempo_variance: 0,
        threshold_min_tempo: min_tempo_ms,
        threshold_max_tempo: max_tempo_ms,
        threshold_max_variance: max_tempo_variance
      },
      severity: 'info'
    };
  }
  
  const minTempo = tempoValues.length > 0 ? Math.min(...tempoValues) : avgTempo;
  const maxTempo = tempoValues.length > 0 ? Math.max(...tempoValues) : avgTempo;
  const tempoCV = tempoValues.length > 1 ? calculateCV(tempoValues) : 0;
  
  // Check pass conditions
  const tempoInRange = avgTempo >= min_tempo_ms && avgTempo <= max_tempo_ms;
  const varianceOK = tempoCV <= max_tempo_variance;
  const passed = tempoInRange && varianceOK;
  
  // Calculate score (0-1)
  let tempoScore = 1.0;
  if (avgTempo < min_tempo_ms) {
    // Too fast - suspicious
    tempoScore = avgTempo / min_tempo_ms;
  } else if (avgTempo > max_tempo_ms) {
    // Too slow - less suspicious but still penalize
    tempoScore = max_tempo_ms / avgTempo;
  }
  
  const varianceScore = Math.max(1 - (tempoCV / max_tempo_variance), 0);
  const score = (tempoScore * 0.7) + (varianceScore * 0.3); // Weight tempo range more
  
  // Generate message
  let message = '';
  if (!tempoInRange) {
    if (avgTempo < min_tempo_ms) {
      message = `Suspiciously fast tempo (${avgTempo.toFixed(0)}ms < ${min_tempo_ms}ms)`;
    } else {
      message = `Unusually slow tempo (${avgTempo.toFixed(0)}ms > ${max_tempo_ms}ms)`;
    }
  } else if (!varianceOK) {
    message = `Erratic tempo variance (CV: ${tempoCV.toFixed(2)})`;
  } else {
    message = `Tempo realism check passed (avg: ${avgTempo.toFixed(0)}ms)`;
  }
  
  return {
    check_type: 'tempo_realism_check',
    passed,
    score,
    message,
    details: {
      avg_tempo_ms: avgTempo,
      min_tempo_ms: minTempo,
      max_tempo_ms: maxTempo,
      tempo_variance: tempoCV,
      threshold_min_tempo: min_tempo_ms,
      threshold_max_tempo: max_tempo_ms,
      threshold_max_variance: max_tempo_variance
    },
    severity: passed ? 'info' : (avgTempo < min_tempo_ms ? 'error' : 'warning')
  };
}

// ==========================================
// Check 3: Progression Naturalness
// ==========================================

/**
 * Checks that performance improvements are natural and not sudden jumps
 * 
 * Pass criteria:
 * - Performance increase is within natural bounds
 * - No sudden jumps that suggest manipulation
 */
export function checkProgressionNaturalness(
  currentSession: SessionData,
  previousSessions: SessionData[],
  thresholds: ProgressionNaturalnessThresholds
): ProgressionCheck {
  const { max_rep_increase_percent, max_time_increase_percent, min_sessions_for_check } = thresholds;
  
  // Filter to same exercise only
  const sameExerciseSessions = previousSessions.filter(s => s.exercise === currentSession.exercise);
  
  // Not enough history
  if (sameExerciseSessions.length < min_sessions_for_check) {
    return {
      check_type: 'progression_check',
      passed: true,
      score: 1.0,
      message: `Insufficient session history for progression check (${sameExerciseSessions.length} < ${min_sessions_for_check})`,
      details: {
        current_performance: 0,
        previous_performance: 0,
        increase_percent: 0,
        threshold_max_increase: 0,
        sessions_analyzed: sameExerciseSessions.length
      },
      severity: 'info'
    };
  }
  
  // Get most recent previous session
  const sortedSessions = [...sameExerciseSessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  const previousSession = sortedSessions[0];
  
  // Determine metric based on exercise
  let currentPerf: number;
  let previousPerf: number;
  let maxIncrease: number;
  let metric: string;
  
  if (currentSession.exercise === 'plank') {
    // For plank, use time
    currentPerf = currentSession.total_time_seconds;
    previousPerf = previousSession.total_time_seconds;
    maxIncrease = max_time_increase_percent;
    metric = 'time';
  } else {
    // For squat/pushup, use reps
    currentPerf = currentSession.total_reps;
    previousPerf = previousSession.total_reps;
    maxIncrease = max_rep_increase_percent;
    metric = 'reps';
  }
  
  if (previousPerf === 0) {
    return {
      check_type: 'progression_check',
      passed: true,
      score: 1.0,
      message: 'First session recorded, no comparison available',
      details: {
        current_performance: currentPerf,
        previous_performance: 0,
        increase_percent: 0,
        threshold_max_increase: maxIncrease,
        sessions_analyzed: sortedSessions.length
      },
      severity: 'info'
    };
  }
  
  const increasePercent = ((currentPerf - previousPerf) / previousPerf) * 100;
  const passed = increasePercent <= maxIncrease;
  
  // Calculate score (0-1)
  let score: number;
  if (increasePercent <= 0) {
    // Performance decreased or stayed same - natural
    score = 1.0;
  } else if (increasePercent <= maxIncrease) {
    // Within natural range
    score = 1.0 - (increasePercent / maxIncrease) * 0.2; // Slight penalty for increase
  } else {
    // Suspicious increase
    score = Math.max(maxIncrease / increasePercent, 0);
  }
  
  // Generate message
  let message: string;
  if (increasePercent <= 0) {
    message = `Natural progression (${metric} ${currentPerf} vs ${previousPerf})`;
  } else if (passed) {
    message = `Realistic improvement (+${increasePercent.toFixed(1)}% ${metric})`;
  } else {
    message = `Suspicious improvement spike (+${increasePercent.toFixed(1)}% ${metric}, max ${maxIncrease}%)`;
  }
  
  return {
    check_type: 'progression_check',
    passed,
    score,
    message,
    details: {
      current_performance: currentPerf,
      previous_performance: previousPerf,
      increase_percent: increasePercent,
      threshold_max_increase: maxIncrease,
      sessions_analyzed: sortedSessions.length
    },
    severity: passed ? 'info' : 'error'
  };
}

// ==========================================
// Check 4: Outlier Detection
// ==========================================

/**
 * Detects statistical outliers compared to user's history
 * 
 * Uses Z-score to identify performances that are anomalously high
 */
export function checkOutlierDetection(
  currentSession: SessionData,
  userHistory: SessionData[],
  thresholds: OutlierDetectionThresholds
): OutlierDetectionCheck {
  const { z_score_threshold, min_sessions_for_baseline } = thresholds;
  
  // Filter to same exercise
  const sameExerciseSessions = userHistory.filter(s => s.exercise === currentSession.exercise);
  
  // Not enough history for baseline
  if (sameExerciseSessions.length < min_sessions_for_baseline) {
    return {
      check_type: 'outlier_detection',
      passed: true,
      score: 1.0,
      message: `Insufficient history for outlier detection (${sameExerciseSessions.length} < ${min_sessions_for_baseline})`,
      details: {
        current_value: 0,
        baseline_mean: 0,
        baseline_std_dev: 0,
        z_score: 0,
        threshold_z_score: z_score_threshold,
        is_outlier: false
      },
      severity: 'info'
    };
  }
  
  // Determine metric
  const values = sameExerciseSessions.map(s => 
    s.exercise === 'plank' ? s.total_time_seconds : s.total_reps
  );
  const currentValue = currentSession.exercise === 'plank' 
    ? currentSession.total_time_seconds 
    : currentSession.total_reps;
  
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const zScore = calculateZScore(currentValue, mean, stdDev);
  
  const isOutlier = Math.abs(zScore) > z_score_threshold;
  const passed = !isOutlier;
  
  // Calculate score
  const score = Math.max(1 - (Math.abs(zScore) / (z_score_threshold * 2)), 0);
  
  // Generate message
  let message: string;
  if (isOutlier) {
    if (zScore > 0) {
      message = `Statistical outlier detected (Z-score: ${zScore.toFixed(2)}, performance unusually high)`;
    } else {
      message = `Performance unusually low (Z-score: ${zScore.toFixed(2)})`;
    }
  } else {
    message = `Performance within expected range (Z-score: ${zScore.toFixed(2)})`;
  }
  
  return {
    check_type: 'outlier_detection',
    passed,
    score,
    message,
    details: {
      current_value: currentValue,
      baseline_mean: mean,
      baseline_std_dev: stdDev,
      z_score: zScore,
      threshold_z_score: z_score_threshold,
      is_outlier: isOutlier
    },
    severity: isOutlier ? (zScore > 0 ? 'error' : 'warning') : 'info'
  };
}

// ==========================================
// Combined Integrity Check
// ==========================================

/**
 * Runs all integrity checks and returns combined results
 */
export interface IntegrityCheckOptions {
  romThresholds: ROMConsistencyThresholds;
  tempoThresholds: TempoRealismThresholds;
  progressionThresholds: ProgressionNaturalnessThresholds;
  outlierThresholds: OutlierDetectionThresholds;
}

export function runAllIntegrityChecks(
  currentSession: SessionData,
  userHistory: SessionData[],
  options: IntegrityCheckOptions
): IntegrityCheckResult[] {
  const checks: IntegrityCheckResult[] = [];
  
  // Run all checks
  checks.push(checkROMConsistency(currentSession, options.romThresholds));
  checks.push(checkTempoRealism(currentSession, options.tempoThresholds));
  checks.push(checkProgressionNaturalness(currentSession, userHistory, options.progressionThresholds));
  checks.push(checkOutlierDetection(currentSession, userHistory, options.outlierThresholds));
  
  return checks;
}

/**
 * Calculate overall integrity score from all checks
 */
export function calculateOverallIntegrityScore(
  checks: IntegrityCheckResult[],
  weights: Record<string, number>
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  checks.forEach(check => {
    const weight = weights[check.check_type] || 1.0;
    totalWeightedScore += check.score * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

