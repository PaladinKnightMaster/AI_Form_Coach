/**
 * Feature Vector Extraction
 * 
 * This module extracts feature vectors from rep and session data
 * for similarity search and personalization.
 */

import type { RepMetric, FormError } from '@/lib/validators/types';
import type { SessionSummary } from '@/lib/validators/sessionAnalysis';
import type { 
  RepFeatureVector, 
  SessionFeatureVector
} from './types';

/**
 * Extract feature vector from a single rep
 */
export function extractRepFeatureVector(
  rep: RepMetric,
  exercise: 'squat' | 'pushup' | 'plank'
): RepFeatureVector {
  // Normalize duration by exercise type
  const duration = normalizeDuration(rep.duration, exercise);
  
  // Normalize tempo (fast=0, normal=0.5, slow=1)
  const tempo = normalizeTempo(rep.tempo);
  
  // Normalize quality (0-100 -> 0-1)
  const quality = rep.score / 100;
  
  // Normalize ROM (0-100 -> 0-1)
  const rom = (rep.formIQ || 0) / 100;
  
  // Extract depth metrics
  const peakDepth = extractPeakDepth(rep, exercise);
  const depthConsistency = calculateDepthConsistency();
  
  // Extract error metrics
  const errorRate = calculateErrorRate(rep.errors);
  const errorSeverity = calculateErrorSeverity(rep.errors);
  const errorTypes = encodeErrorTypes(rep.errors);
  
  // Extract symmetry metrics
  const leftRightBalance = calculateLeftRightBalance();
  const symmetryScore = calculateSymmetryScore();
  
  // Extract visibility and confidence
  const visibilityScore = 1.0; // Default visibility score
  const confidence = rep.confidence || 0.8;
  
  // Encode exercise type
  const exerciseType = encodeExerciseType(exercise);
  
  // Extract exercise-specific metrics
  const exerciseMetrics = extractExerciseSpecificMetrics(rep, exercise);
  
  return {
    duration,
    tempo,
    quality,
    rom,
    peakDepth,
    depthConsistency,
    errorRate,
    errorSeverity,
    errorTypes,
    leftRightBalance,
    symmetryScore,
    visibilityScore,
    confidence,
    exerciseType,
    exerciseMetrics
  };
}

/**
 * Extract feature vector from session summary
 */
export function extractSessionFeatureVector(
  sessionSummary: SessionSummary,
  exercise: 'squat' | 'pushup' | 'plank',
  sessionMetadata: {
    totalReps: number;
    sessionDuration: number;
    createdAt: Date;
    sessionNumber: number;
  }
): SessionFeatureVector {
  // Normalize basic metrics
  const avgDuration = normalizeDuration(sessionSummary.averageTempo, exercise);
  const avgTempo = 0.5; // Default to normal tempo for session-level
  const avgQuality = sessionSummary.averageQuality / 100;
  const avgRom = calculateAverageRom(sessionSummary);
  
  // Normalize session metrics
  const totalReps = normalizeRepCount(sessionMetadata.totalReps, exercise);
  const sessionDuration = normalizeSessionDuration(sessionMetadata.sessionDuration);
  
  // Extract consistency and trend
  const consistencyScore = sessionSummary.consistencyScore / 100;
  const improvementTrend = (sessionSummary.improvementTrend + 1) / 2; // -1,1 -> 0,1
  
  // Extract error patterns
  const totalErrorRate = sessionSummary.errorRate / 10; // Normalize by max expected errors
  const errorPatterns = encodeErrorPatterns(sessionSummary.errorTypes);
  const errorSeverity = calculateSessionErrorSeverity(sessionSummary.errorSeverity);
  
  // Extract quality distribution
  const qualityDistribution = encodeQualityDistribution(sessionSummary.qualityDistribution);
  const qualityVariance = calculateQualityVariance();
  
  // Encode exercise type
  const exerciseType = encodeExerciseType(exercise);
  
  // Extract exercise-specific session metrics
  const exerciseSessionMetrics = extractSessionExerciseMetrics(sessionSummary, exercise);
  
  // Extract temporal features
  const timeOfDay = sessionMetadata.createdAt.getHours() / 24;
  const dayOfWeek = sessionMetadata.createdAt.getDay() / 7;
  const sessionNumber = normalizeSessionNumber(sessionMetadata.sessionNumber);
  
  return {
    avgDuration,
    avgTempo,
    avgQuality,
    avgRom,
    totalReps,
    sessionDuration,
    consistencyScore,
    improvementTrend,
    totalErrorRate,
    errorPatterns,
    errorSeverity,
    qualityDistribution,
    qualityVariance,
    exerciseType,
    exerciseSessionMetrics,
    timeOfDay,
    dayOfWeek,
    sessionNumber
  };
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

function extractPeakDepth(rep: RepMetric, exercise: 'squat' | 'pushup' | 'plank'): number {
  switch (exercise) {
    case 'squat':
      return rep.squat ? Math.min(1, rep.squat.depth / 90) : 0; // 90 degrees = full depth
    case 'pushup':
      return rep.pushup ? Math.min(1, rep.pushup.elbowAngle / 90) : 0; // 90 degrees = full depth
    case 'plank':
      return rep.plank ? Math.min(1, rep.plank.bodyLinePercentage / 100) : 0;
    default:
      return 0;
  }
}

function calculateDepthConsistency(): number {
  // For now, return a default consistency score
  // In a full implementation, this would analyze depth variation within the rep
  return 0.8;
}

function calculateErrorRate(errors: FormError[]): number {
  const maxExpectedErrors = 5; // Maximum expected errors per rep
  return Math.min(1, errors.length / maxExpectedErrors);
}

function calculateErrorSeverity(errors: FormError[]): number {
  if (errors.length === 0) return 0;
  
  const severityWeights = { low: 0.2, medium: 0.5, high: 1.0 };
  const totalSeverity = errors.reduce((sum, error) => 
    sum + (severityWeights[error.severity] || 0.5), 0);
  
  return Math.min(1, totalSeverity / errors.length);
}

function encodeErrorTypes(errors: FormError[]): number[] {
  const errorTypes = [
    'depth_low', 'knee_valgus', 'chest_drop', 'hip_sag', 'tempo_fast', 'tempo_slow',
    'bodyline_poor', 'excessive_forward_lean', 'back_rounding', 'knees_out',
    'go_deeper', 'chest_up', 'shoulders_back', 'head_neutral', 'breathing_control',
    'pace_up', 'pace_down', 'smooth_movement', 'consistent_tempo'
  ];
  
  const encoded = new Array(errorTypes.length).fill(0);
  errors.forEach(error => {
    const index = errorTypes.indexOf(error.type);
    if (index !== -1) {
      encoded[index] = 1;
    }
  });
  
  return encoded;
}

function calculateLeftRightBalance(): number {
  // For bilateral exercises, calculate left/right balance
  // For now, return a default balanced score
  return 0.5;
}

function calculateSymmetryScore(): number {
  // Calculate overall symmetry score
  // For now, return a default score
  return 0.8;
}

function encodeExerciseType(exercise: 'squat' | 'pushup' | 'plank'): number[] {
  const exercises = ['squat', 'pushup', 'plank'];
  const encoded = new Array(exercises.length).fill(0);
  const index = exercises.indexOf(exercise);
  if (index !== -1) {
    encoded[index] = 1;
  }
  return encoded;
}

function extractExerciseSpecificMetrics(rep: RepMetric, exercise: 'squat' | 'pushup' | 'plank'): number[] {
  const metrics: number[] = [];
  
  switch (exercise) {
    case 'squat':
      if (rep.squat) {
        metrics.push(
          rep.squat.torsoAngle / 180,      // Normalize angle
          rep.squat.kneeValgus / 30,       // Normalize valgus
          rep.squat.depth / 90             // Normalize depth
        );
      } else {
        metrics.push(0, 0, 0);
      }
      break;
      
    case 'pushup':
      if (rep.pushup) {
        metrics.push(
          rep.pushup.elbowAngle / 90,      // Normalize angle
          rep.pushup.bodyLine / 100,       // Normalize body line
          rep.pushup.bodyLinePercentage / 100 // Normalize percentage
        );
      } else {
        metrics.push(0, 0, 0);
      }
      break;
      
    case 'plank':
      if (rep.plank) {
        metrics.push(
          rep.plank.bodyLine / 100,        // Normalize body line
          rep.plank.bodyLinePercentage / 100, // Normalize percentage
          rep.plank.hipSagDuration / 1000  // Normalize duration
        );
      } else {
        metrics.push(0, 0, 0);
      }
      break;
  }
  
  return metrics;
}

function calculateAverageRom(sessionSummary: SessionSummary): number {
  // Calculate average ROM from exercise-specific metrics
  if (sessionSummary.exerciseMetrics.squat) {
    return sessionSummary.exerciseMetrics.squat.averageDepth / 90;
  } else if (sessionSummary.exerciseMetrics.pushup) {
    return sessionSummary.exerciseMetrics.pushup.averageElbowAngle / 90;
  } else if (sessionSummary.exerciseMetrics.plank) {
    return sessionSummary.exerciseMetrics.plank.averageBodyLinePercentage / 100;
  }
  return 0.5; // Default
}

function normalizeRepCount(totalReps: number, exercise: 'squat' | 'pushup' | 'plank'): number {
  const typicalReps = {
    squat: 20,
    pushup: 15,
    plank: 3
  };
  
  const typical = typicalReps[exercise];
  return Math.min(1, totalReps / typical);
}

function normalizeSessionDuration(duration: number): number {
  const typicalDuration = 600000; // 10 minutes in milliseconds
  return Math.min(1, duration / typicalDuration);
}

function encodeErrorPatterns(errorTypes: Record<string, number>): number[] {
  const errorTypesList = [
    'depth_low', 'knee_valgus', 'chest_drop', 'hip_sag', 'tempo_fast', 'tempo_slow',
    'bodyline_poor', 'excessive_forward_lean', 'back_rounding', 'knees_out'
  ];
  
  const encoded = new Array(errorTypesList.length).fill(0);
  errorTypesList.forEach((type, index) => {
    encoded[index] = Math.min(1, (errorTypes[type] || 0) / 10); // Normalize by max expected
  });
  
  return encoded;
}

function calculateSessionErrorSeverity(errorSeverity: { high: number; medium: number; low: number }): number {
  const total = errorSeverity.high + errorSeverity.medium + errorSeverity.low;
  if (total === 0) return 0;
  
  const weighted = (errorSeverity.high * 1.0 + errorSeverity.medium * 0.5 + errorSeverity.low * 0.2);
  return Math.min(1, weighted / total);
}

function encodeQualityDistribution(qualityDistribution: { excellent: number; good: number; fair: number; poor: number }): number[] {
  const total = qualityDistribution.excellent + qualityDistribution.good + qualityDistribution.fair + qualityDistribution.poor;
  if (total === 0) return [0, 0, 0, 0];
  
  return [
    qualityDistribution.poor / total,
    qualityDistribution.fair / total,
    qualityDistribution.good / total,
    qualityDistribution.excellent / total
  ];
}

function calculateQualityVariance(): number {
  // Calculate variance in quality scores
  // For now, return a default variance
  return 0.2;
}

function extractSessionExerciseMetrics(sessionSummary: SessionSummary, exercise: 'squat' | 'pushup' | 'plank'): number[] {
  const metrics: number[] = [];
  
  switch (exercise) {
    case 'squat':
      if (sessionSummary.exerciseMetrics.squat) {
        const squat = sessionSummary.exerciseMetrics.squat;
        metrics.push(
          squat.averageDepth / 90,
          squat.averageTorsoAngle / 180,
          squat.averageKneeValgus / 30,
          squat.depthConsistency / 100
        );
      } else {
        metrics.push(0, 0, 0, 0);
      }
      break;
      
    case 'pushup':
      if (sessionSummary.exerciseMetrics.pushup) {
        const pushup = sessionSummary.exerciseMetrics.pushup;
        metrics.push(
          pushup.averageElbowAngle / 90,
          pushup.averageBodyLine / 100,
          pushup.averageBodyLinePercentage / 100,
          pushup.bodyLineConsistency / 100
        );
      } else {
        metrics.push(0, 0, 0, 0);
      }
      break;
      
    case 'plank':
      if (sessionSummary.exerciseMetrics.plank) {
        const plank = sessionSummary.exerciseMetrics.plank;
        metrics.push(
          plank.averageBodyLine / 100,
          plank.averageBodyLinePercentage / 100,
          plank.totalHipSagDuration / 1000,
          plank.hipSagRate / 100
        );
      } else {
        metrics.push(0, 0, 0, 0);
      }
      break;
  }
  
  return metrics;
}

function normalizeSessionNumber(sessionNumber: number): number {
  // Normalize session number (assume max 1000 sessions)
  return Math.min(1, sessionNumber / 1000);
}
