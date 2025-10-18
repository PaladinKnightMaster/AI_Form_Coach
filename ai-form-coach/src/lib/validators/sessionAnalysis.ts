/**
 * Session Analysis Utilities
 * 
 * This module provides functions to analyze session-level metrics
 * from enhanced rep data and calculate session summaries.
 */

import type { RepMetric, ValidatorState, FormError } from './types';

export interface SessionSummary {
  // Basic metrics
  totalReps: number;
  totalDuration: number; // milliseconds
  averageTempo: number; // milliseconds
  
  // Quality metrics
  averageQuality: number; // 0-100
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  
  // Error analysis
  totalErrors: number;
  errorRate: number; // errors per rep
  errorTypes: Record<string, number>;
  errorSeverity: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Correctness evaluation (A4)
  correctReps: number;
  correctRate: number; // 0-1
  averageConfidence: number; // 0-1
  
  // Exercise-specific metrics
  exerciseMetrics: {
    squat?: {
      averageDepth: number;
      averageTorsoAngle: number;
      averageKneeValgus: number;
      depthConsistency: number; // 0-100
    };
    pushup?: {
      averageElbowAngle: number;
      averageBodyLine: number;
      averageBodyLinePercentage: number;
      bodyLineConsistency: number; // 0-100
    };
    plank?: {
      averageBodyLine: number;
      averageBodyLinePercentage: number;
      totalHipSagDuration: number;
      hipSagRate: number; // percentage of time with hip sag
    };
  };
  
  // Improvement indicators
  improvementTrend: number; // -1 to 1 (declining to improving)
  consistencyScore: number; // 0-100
  formProgression: 'improving' | 'stable' | 'declining';
}

/**
 * Calculate session-level metrics from rep data
 */
export function calculateSessionMetrics(metrics: RepMetric[]): SessionSummary {
  if (metrics.length === 0) {
    return getEmptySessionSummary();
  }
  
  // Basic metrics
  const totalReps = metrics.length;
  const totalDuration = metrics.reduce((sum, rep) => sum + rep.duration, 0);
  const averageTempo = totalDuration / totalReps;
  
  // Quality metrics
  const averageQuality = metrics.reduce((sum, rep) => sum + rep.score, 0) / totalReps;
  const qualityDistribution = calculateQualityDistribution(metrics);
  
  // Error analysis
  const allErrors = metrics.flatMap(rep => rep.errors);
  const totalErrors = allErrors.length;
  const errorRate = totalErrors / totalReps;
  const errorTypes = calculateErrorTypes(allErrors);
  const errorSeverity = calculateErrorSeverity(allErrors);
  
  // Correctness evaluation (A4)
  const correctReps = metrics.filter(rep => rep.is_correct === true).length;
  const correctRate = totalReps > 0 ? correctReps / totalReps : 0;
  const averageConfidence = metrics.reduce((sum, rep) => sum + (rep.confidence || 0), 0) / totalReps;
  
  // Exercise-specific metrics
  const exerciseMetrics = calculateExerciseSpecificMetrics(metrics);
  
  // Improvement indicators
  const improvementTrend = calculateImprovementTrend(metrics);
  const consistencyScore = calculateConsistencyScore(metrics);
  const formProgression = determineFormProgression(improvementTrend);
  
  return {
    totalReps,
    totalDuration,
    averageTempo,
    averageQuality,
    qualityDistribution,
    totalErrors,
    errorRate,
    errorTypes,
    errorSeverity,
    correctReps,
    correctRate,
    averageConfidence,
    exerciseMetrics,
    improvementTrend,
    consistencyScore,
    formProgression
  };
}

/**
 * Calculate session metrics from validator state
 */
export function calculateSessionMetricsFromState(state: ValidatorState): SessionSummary {
  return calculateSessionMetrics(state.metrics);
}

/**
 * Get the most common error type in a session
 */
export function getMostCommonError(sessionSummary: SessionSummary): string | null {
  const errorTypes = sessionSummary.errorTypes;
  const mostCommon = Object.entries(errorTypes).reduce((max, [type, count]) => 
    count > max.count ? { type, count } : max, 
    { type: '', count: 0 }
  );
  
  return mostCommon.count > 0 ? mostCommon.type : null;
}

/**
 * Get improvement recommendations based on session analysis
 */
export function getImprovementRecommendations(sessionSummary: SessionSummary): string[] {
  const recommendations: string[] = [];
  
  // Quality-based recommendations
  if (sessionSummary.averageQuality < 60) {
    recommendations.push('Focus on form quality over quantity - slow down and maintain proper technique');
  }
  
  // Error-based recommendations
  const mostCommonError = getMostCommonError(sessionSummary);
  if (mostCommonError) {
    switch (mostCommonError) {
      case 'depth_low':
        recommendations.push('Work on achieving full range of motion - go deeper in your movements');
        break;
      case 'knee_valgus':
        recommendations.push('Focus on keeping knees aligned over toes - strengthen hip abductors');
        break;
      case 'chest_drop':
        recommendations.push('Maintain upright posture - engage your core and keep chest up');
        break;
      case 'hip_sag':
        recommendations.push('Keep your body in a straight line - engage your core muscles');
        break;
      case 'tempo_fast':
        recommendations.push('Slow down your movements for better control and muscle engagement');
        break;
      case 'tempo_slow':
        recommendations.push('Try to maintain a steady rhythm - avoid long pauses between reps');
        break;
    }
  }
  
  // Consistency recommendations
  if (sessionSummary.consistencyScore < 70) {
    recommendations.push('Work on consistency - aim for similar form across all repetitions');
  }
  
  // Progression recommendations
  if (sessionSummary.formProgression === 'declining') {
    recommendations.push('Consider taking a rest day or reducing intensity to allow for recovery');
  } else if (sessionSummary.formProgression === 'improving') {
    recommendations.push('Great progress! Continue with your current training approach');
  }
  
  return recommendations;
}

// Helper functions

function getEmptySessionSummary(): SessionSummary {
  return {
    totalReps: 0,
    totalDuration: 0,
    averageTempo: 0,
    averageQuality: 0,
    qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    totalErrors: 0,
    errorRate: 0,
    errorTypes: {},
    errorSeverity: { high: 0, medium: 0, low: 0 },
    correctReps: 0,
    correctRate: 0,
    averageConfidence: 0,
    exerciseMetrics: {},
    improvementTrend: 0,
    consistencyScore: 0,
    formProgression: 'stable'
  };
}

function calculateQualityDistribution(metrics: RepMetric[]): SessionSummary['qualityDistribution'] {
  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  
  metrics.forEach(rep => {
    distribution[rep.quality]++;
  });
  
  return distribution;
}

function calculateErrorTypes(errors: FormError[]): Record<string, number> {
  const errorTypes: Record<string, number> = {};
  
  errors.forEach(error => {
    errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
  });
  
  return errorTypes;
}

function calculateErrorSeverity(errors: FormError[]): SessionSummary['errorSeverity'] {
  const severity = { high: 0, medium: 0, low: 0 };
  
  errors.forEach(error => {
    severity[error.severity]++;
  });
  
  return severity;
}

function calculateExerciseSpecificMetrics(metrics: RepMetric[]): SessionSummary['exerciseMetrics'] {
  const exerciseMetrics: SessionSummary['exerciseMetrics'] = {};
  
  // Squat metrics
  const squatReps = metrics.filter(rep => rep.squat);
  if (squatReps.length > 0) {
    const depths = squatReps.map(rep => rep.squat!.depth);
    const torsoAngles = squatReps.map(rep => rep.squat!.torsoAngle);
    const kneeValgus = squatReps.map(rep => rep.squat!.kneeValgus);
    
    exerciseMetrics.squat = {
      averageDepth: depths.reduce((sum, d) => sum + d, 0) / depths.length,
      averageTorsoAngle: torsoAngles.reduce((sum, a) => sum + a, 0) / torsoAngles.length,
      averageKneeValgus: kneeValgus.reduce((sum, v) => sum + v, 0) / kneeValgus.length,
      depthConsistency: calculateConsistency(depths)
    };
  }
  
  // Pushup metrics
  const pushupReps = metrics.filter(rep => rep.pushup);
  if (pushupReps.length > 0) {
    const elbowAngles = pushupReps.map(rep => rep.pushup!.elbowAngle);
    const bodyLines = pushupReps.map(rep => rep.pushup!.bodyLine);
    const bodyLinePercentages = pushupReps.map(rep => rep.pushup!.bodyLinePercentage);
    
    exerciseMetrics.pushup = {
      averageElbowAngle: elbowAngles.reduce((sum, a) => sum + a, 0) / elbowAngles.length,
      averageBodyLine: bodyLines.reduce((sum, b) => sum + b, 0) / bodyLines.length,
      averageBodyLinePercentage: bodyLinePercentages.reduce((sum, p) => sum + p, 0) / bodyLinePercentages.length,
      bodyLineConsistency: calculateConsistency(bodyLinePercentages)
    };
  }
  
  // Plank metrics
  const plankReps = metrics.filter(rep => rep.plank);
  if (plankReps.length > 0) {
    const bodyLines = plankReps.map(rep => rep.plank!.bodyLine);
    const bodyLinePercentages = plankReps.map(rep => rep.plank!.bodyLinePercentage);
    const hipSagDurations = plankReps.map(rep => rep.plank!.hipSagDuration);
    const totalHipSagDuration = hipSagDurations.reduce((sum, d) => sum + d, 0);
    const totalDuration = plankReps.reduce((sum, rep) => sum + rep.duration, 0);
    
    exerciseMetrics.plank = {
      averageBodyLine: bodyLines.reduce((sum, b) => sum + b, 0) / bodyLines.length,
      averageBodyLinePercentage: bodyLinePercentages.reduce((sum, p) => sum + p, 0) / bodyLinePercentages.length,
      totalHipSagDuration,
      hipSagRate: totalDuration > 0 ? (totalHipSagDuration / totalDuration) * 100 : 0
    };
  }
  
  return exerciseMetrics;
}

function calculateImprovementTrend(metrics: RepMetric[]): number {
  if (metrics.length < 3) return 0;
  
  // Calculate trend using linear regression on quality scores
  const scores = metrics.map(rep => rep.score);
  const n = scores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = scores.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * scores[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, slope / 10));
}

function calculateConsistencyScore(metrics: RepMetric[]): number {
  if (metrics.length < 2) return 100;
  
  const scores = metrics.map(rep => rep.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to 0-100 scale (lower deviation = higher consistency)
  const maxDeviation = 50; // Assume max reasonable deviation is 50 points
  const consistency = Math.max(0, 100 - (standardDeviation / maxDeviation) * 100);
  
  return consistency;
}

function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 100;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to 0-100 scale
  const coefficientOfVariation = standardDeviation / mean;
  const consistency = Math.max(0, 100 - coefficientOfVariation * 100);
  
  return consistency;
}

function determineFormProgression(improvementTrend: number): 'improving' | 'stable' | 'declining' {
  if (improvementTrend > 0.1) return 'improving';
  if (improvementTrend < -0.1) return 'declining';
  return 'stable';
}
