/**
 * Micro Model Feature Extractor
 * 
 * This module extracts features for the micro model from rep metrics
 * and session context to enable on-device quality scoring.
 */

import type { RepMetric, FormError } from '@/lib/validators/types';
import type { QualityFeatures } from './types';

export interface SessionContext {
  totalReps: number;
  currentRepIndex: number;
  recentReps: RepMetric[];
  sessionDuration: number;
  exercise: 'squat' | 'pushup' | 'plank';
}

/**
 * Extract features for the micro model from rep metrics and session context
 */
export function extractQualityFeatures(
  rep: RepMetric,
  sessionContext: SessionContext
): QualityFeatures {
  // Basic rep metrics
  const duration = normalizeDuration(rep.duration, sessionContext.exercise);
  const tempo = normalizeTempo(rep.tempo);
  const rom = normalizeRom(rep.formIQ);
  
  // Error metrics
  const errorCount = normalizeErrorCount(rep.errors.length);
  const errorSeverity = calculateErrorSeverity(rep.errors);
  const criticalErrorRatio = calculateCriticalErrorRatio(rep.errors);
  
  // Exercise-specific features
  const depth = extractDepth(rep, sessionContext.exercise);
  const stability = calculateStability(rep, sessionContext.recentReps);
  const symmetry = calculateSymmetry(rep);
  
  // Context features
  const repIndex = normalizeRepIndex(sessionContext.currentRepIndex, sessionContext.totalReps);
  const sessionProgress = calculateSessionProgress(sessionContext);
  const fatigueIndicator = calculateFatigueIndicator(sessionContext.recentReps);
  
  // Pose quality features
  const visibilityScore = 1.0; // Default for now, could be enhanced
  const confidenceScore = rep.confidence || 0.8;
  
  // Exercise type encoding (one-hot)
  const exerciseType = encodeExerciseType(sessionContext.exercise);
  
  return {
    duration,
    tempo,
    rom,
    errorCount,
    errorSeverity,
    criticalErrorRatio,
    depth,
    stability,
    symmetry,
    repIndex,
    sessionProgress,
    fatigueIndicator,
    visibilityScore,
    confidenceScore,
    exerciseType
  };
}

/**
 * Convert quality features to array for model input
 */
export function featuresToArray(features: QualityFeatures): number[] {
  return [
    features.duration,
    features.tempo,
    features.rom,
    features.errorCount,
    features.errorSeverity,
    features.criticalErrorRatio,
    features.depth,
    features.stability,
    features.symmetry,
    features.repIndex,
    features.sessionProgress,
    features.fatigueIndicator,
    features.visibilityScore,
    features.confidenceScore,
    ...features.exerciseType
  ];
}

/**
 * Create a cache key for features to enable caching
 */
export function createFeatureCacheKey(features: QualityFeatures): string {
  // Create a hash-like key from the most important features
  const keyFeatures = [
    Math.round(features.duration * 100),
    Math.round(features.tempo * 100),
    Math.round(features.rom * 100),
    Math.round(features.errorCount * 100),
    Math.round(features.depth * 100),
    features.exerciseType.join('')
  ];
  
  return keyFeatures.join('_');
}

// Helper functions

function normalizeDuration(duration: number, exercise: 'squat' | 'pushup' | 'plank'): number {
  const typicalDurations = {
    squat: 3000,    // 3 seconds typical
    pushup: 2000,   // 2 seconds typical
    plank: 30000    // 30 seconds typical
  };
  
  const typical = typicalDurations[exercise];
  return Math.min(1, duration / typical);
}

function normalizeTempo(tempo: 'fast' | 'normal' | 'slow'): number {
  switch (tempo) {
    case 'fast': return 0;
    case 'normal': return 0.5;
    case 'slow': return 1;
    default: return 0.5;
  }
}

function normalizeRom(rom?: number): number {
  return (rom || 0) / 100; // Convert from 0-100 to 0-1
}

function normalizeErrorCount(errorCount: number): number {
  const maxExpectedErrors = 5;
  return Math.min(1, errorCount / maxExpectedErrors);
}

function calculateErrorSeverity(errors: FormError[]): number {
  if (errors.length === 0) return 0;
  
  const severityWeights = { low: 0.2, medium: 0.5, high: 1.0 };
  const totalSeverity = errors.reduce((sum, error) => 
    sum + (severityWeights[error.severity] || 0.5), 0);
  
  return Math.min(1, totalSeverity / errors.length);
}

function calculateCriticalErrorRatio(errors: FormError[]): number {
  if (errors.length === 0) return 0;
  
  const criticalErrors = errors.filter(error => error.severity === 'high');
  return criticalErrors.length / errors.length;
}

function extractDepth(rep: RepMetric, exercise: 'squat' | 'pushup' | 'plank'): number {
  switch (exercise) {
    case 'squat':
      if (rep.squat) {
        return Math.min(1, rep.squat.depth / 90); // 90 degrees = full depth
      }
      return rep.peakDepth ? Math.min(1, rep.peakDepth / 90) : 0;
      
    case 'pushup':
      if (rep.pushup) {
        return Math.min(1, rep.pushup.elbowAngle / 90); // 90 degrees = full depth
      }
      return rep.peakAngle ? Math.min(1, rep.peakAngle / 90) : 0;
      
    case 'plank':
      if (rep.plank) {
        return rep.plank.bodyLinePercentage / 100;
      }
      return 0.5; // Default for plank
      
    default:
      return 0;
  }
}

function calculateStability(rep: RepMetric, recentReps: RepMetric[]): number {
  if (recentReps.length < 2) return 1.0;
  
  // Calculate stability based on consistency of recent reps
  const recentScores = recentReps.slice(-5).map(r => r.score);
  
  if (recentScores.length === 0) return 1.0;
  
  const mean = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation = higher stability
  const maxDeviation = 50; // Assume max reasonable deviation is 50 points
  const stability = Math.max(0, 1 - (standardDeviation / maxDeviation));
  
  return stability;
}

function calculateSymmetry(rep: RepMetric): number {
  // Use side balance if available, otherwise default to balanced
  if (rep.sideBalance !== undefined) {
    // Convert side balance to symmetry score (0.5 = perfect balance)
    return 1 - Math.abs(rep.sideBalance - 0.5) * 2;
  }
  
  return 0.8; // Default symmetry score
}

function normalizeRepIndex(currentIndex: number, totalReps: number): number {
  if (totalReps <= 1) return 0.5;
  return currentIndex / (totalReps - 1);
}

function calculateSessionProgress(sessionContext: SessionContext): number {
  if (sessionContext.totalReps <= 1) return 0.5;
  return sessionContext.currentRepIndex / sessionContext.totalReps;
}

function calculateFatigueIndicator(recentReps: RepMetric[]): number {
  if (recentReps.length < 3) return 0;
  
  // Calculate fatigue based on declining quality in recent reps
  const recentScores = recentReps.slice(-5).map(r => r.score);
  
  if (recentScores.length < 2) return 0;
  
  // Simple linear regression to detect declining trend
  const n = recentScores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = recentScores;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Negative slope indicates fatigue
  const fatigue = Math.max(0, -slope / 10); // Normalize slope
  return Math.min(1, fatigue);
}

function encodeExerciseType(exercise: 'squat' | 'pushup' | 'plank'): [number, number, number] {
  switch (exercise) {
    case 'squat': return [1, 0, 0];
    case 'pushup': return [0, 1, 0];
    case 'plank': return [0, 0, 1];
    default: return [0, 0, 0];
  }
}
