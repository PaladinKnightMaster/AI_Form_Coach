/**
 * Database Utilities for Enhanced Validators
 * 
 * This module provides functions to convert enhanced RepMetric data
 * to database format and handle data persistence.
 */

import type { RepMetric, FormError } from './types';

export interface DatabaseRepData {
  // Existing fields
  session_id: string;
  idx: number;
  start_ms: number;
  end_ms: number;
  peak_depth?: number;
  avg_tempo_ms?: number;
  rom_score?: number;
  cues?: string[];
  valid?: boolean;
  
  // Enhanced fields
  duration_ms?: number;
  tempo?: 'fast' | 'normal' | 'slow';
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  quality_score?: number;
  errors?: FormError[];
  error_count?: number;
  error_types?: Record<string, number>;
  exercise_metrics?: Record<string, unknown>;
}

export interface DatabaseSessionData {
  // Existing fields
  user_id: string;
  exercise: 'squat' | 'pushup' | 'plank';
  started_at: string;
  ended_at?: string;
  total_reps: number;
  total_time_seconds: number;
  avg_tempo_ms?: number;
  avg_rom_score?: number;
  notes?: string;
  goal_type?: string;
  goal_value?: number;
  rpe?: number;
  device_info?: Record<string, unknown>;
  avg_pose_quality?: number;
  
  // Enhanced fields
  avg_quality_score?: number;
  quality_distribution?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  total_errors?: number;
  error_rate?: number;
  consistency_score?: number;
  improvement_trend?: number;
  form_progression?: 'improving' | 'stable' | 'declining';
}

/**
 * Convert enhanced RepMetric to database format
 */
export function repMetricToDatabase(
  repMetric: RepMetric, 
  sessionId: string, 
  index: number
): DatabaseRepData {
  // Calculate error types summary
  const errorTypes: Record<string, number> = {};
  repMetric.errors.forEach(error => {
    errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
  });
  
  // Prepare exercise-specific metrics
  const exerciseMetrics: Record<string, unknown> = {};
  if (repMetric.squat) {
    exerciseMetrics.squat = repMetric.squat;
  }
  if (repMetric.pushup) {
    exerciseMetrics.pushup = repMetric.pushup;
  }
  if (repMetric.plank) {
    exerciseMetrics.plank = repMetric.plank;
  }
  
  return {
    // Existing fields
    session_id: sessionId,
    idx: index,
    start_ms: repMetric.startTs,
    end_ms: repMetric.endTs,
    peak_depth: repMetric.peakDepth,
    avg_tempo_ms: repMetric.duration,
    rom_score: repMetric.formIQ,
    cues: [], // Will be populated from session cues
    valid: repMetric.valid !== false,
    
    // Enhanced fields
    duration_ms: repMetric.duration,
    tempo: repMetric.tempo,
    quality: repMetric.quality,
    quality_score: repMetric.score,
    errors: repMetric.errors,
    error_count: repMetric.errors.length,
    error_types: errorTypes,
    exercise_metrics: exerciseMetrics
  };
}

/**
 * Convert multiple RepMetrics to database format
 */
export function repMetricsToDatabase(
  repMetrics: RepMetric[], 
  sessionId: string
): DatabaseRepData[] {
  return repMetrics.map((rep, index) => 
    repMetricToDatabase(rep, sessionId, index)
  );
}

/**
 * Convert session summary to database format
 */
export function sessionSummaryToDatabase(
  sessionSummary: {
    totalReps: number;
    totalDuration: number;
    averageTempo: number;
    averageQuality: number;
    qualityDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    totalErrors: number;
    errorRate: number;
    consistencyScore: number;
    improvementTrend: number;
    formProgression: 'improving' | 'stable' | 'declining';
  },
  baseSessionData: Partial<DatabaseSessionData>
): DatabaseSessionData {
  return {
    ...baseSessionData,
    total_reps: sessionSummary.totalReps,
    total_time_seconds: Math.round(sessionSummary.totalDuration / 1000),
    avg_tempo_ms: Math.round(sessionSummary.averageTempo),
    avg_quality_score: sessionSummary.averageQuality,
    quality_distribution: sessionSummary.qualityDistribution,
    total_errors: sessionSummary.totalErrors,
    error_rate: sessionSummary.errorRate,
    consistency_score: sessionSummary.consistencyScore,
    improvement_trend: sessionSummary.improvementTrend,
    form_progression: sessionSummary.formProgression
  } as DatabaseSessionData;
}

/**
 * Convert database rep data back to RepMetric format
 */
export function databaseToRepMetric(dbRep: DatabaseRepData): RepMetric {
  const repMetric: RepMetric = {
    startTs: dbRep.start_ms,
    endTs: dbRep.end_ms,
    duration: dbRep.duration_ms || (dbRep.end_ms - dbRep.start_ms),
    tempo: dbRep.tempo || 'normal',
    errors: dbRep.errors || [],
    quality: dbRep.quality || 'fair',
    score: dbRep.quality_score || 0,
    valid: dbRep.valid !== false
  };
  
  // Add optional fields if present
  if (dbRep.peak_depth !== undefined) {
    repMetric.peakDepth = dbRep.peak_depth;
  }
  if (dbRep.rom_score !== undefined) {
    repMetric.formIQ = dbRep.rom_score;
  }
  
  // Add exercise-specific metrics if present
  if (dbRep.exercise_metrics) {
    if (dbRep.exercise_metrics.squat) {
      repMetric.squat = dbRep.exercise_metrics.squat as RepMetric['squat'];
    }
    if (dbRep.exercise_metrics.pushup) {
      repMetric.pushup = dbRep.exercise_metrics.pushup as RepMetric['pushup'];
    }
    if (dbRep.exercise_metrics.plank) {
      repMetric.plank = dbRep.exercise_metrics.plank as RepMetric['plank'];
    }
  }
  
  return repMetric;
}

/**
 * Convert database session data to session summary format
 */
export function databaseToSessionSummary(dbSession: DatabaseSessionData) {
  return {
    totalReps: dbSession.total_reps,
    totalDuration: dbSession.total_time_seconds * 1000,
    averageTempo: dbSession.avg_tempo_ms || 0,
    averageQuality: dbSession.avg_quality_score || 0,
    qualityDistribution: dbSession.quality_distribution || {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    },
    totalErrors: dbSession.total_errors || 0,
    errorRate: dbSession.error_rate || 0,
    consistencyScore: dbSession.consistency_score || 0,
    improvementTrend: dbSession.improvement_trend || 0,
    formProgression: dbSession.form_progression || 'stable'
  };
}

/**
 * Validate RepMetric data before database insertion
 */
export function validateRepMetric(repMetric: RepMetric): string[] {
  const errors: string[] = [];
  
  // Required fields
  if (!repMetric.startTs || !repMetric.endTs) {
    errors.push('Missing startTs or endTs');
  }
  
  if (repMetric.duration <= 0) {
    errors.push('Duration must be positive');
  }
  
  if (!['fast', 'normal', 'slow'].includes(repMetric.tempo)) {
    errors.push('Invalid tempo value');
  }
  
  if (!['excellent', 'good', 'fair', 'poor'].includes(repMetric.quality)) {
    errors.push('Invalid quality value');
  }
  
  if (repMetric.score < 0 || repMetric.score > 100) {
    errors.push('Score must be between 0 and 100');
  }
  
  // Validate errors array
  if (!Array.isArray(repMetric.errors)) {
    errors.push('Errors must be an array');
  } else {
    repMetric.errors.forEach((error, index) => {
      if (!error.type || !error.severity || !error.message) {
        errors.push(`Error at index ${index} is missing required fields`);
      }
    });
  }
  
  return errors;
}

/**
 * Get error summary from RepMetric
 */
export function getErrorSummary(repMetric: RepMetric): {
  totalErrors: number;
  errorTypes: Record<string, number>;
  severityCounts: Record<string, number>;
} {
  const errorTypes: Record<string, number> = {};
  const severityCounts: Record<string, number> = { high: 0, medium: 0, low: 0 };
  
  repMetric.errors.forEach(error => {
    errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    severityCounts[error.severity]++;
  });
  
  return {
    totalErrors: repMetric.errors.length,
    errorTypes,
    severityCounts
  };
}
