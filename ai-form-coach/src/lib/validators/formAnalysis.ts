/**
 * Enhanced Form Analysis Utilities
 * 
 * This module provides comprehensive form analysis functions for detecting
 * errors, calculating metrics, and assessing exercise quality.
 */

import type { Landmark3D } from '../pose/engine';
import type { FormError, RepMetric } from './types';
import { angleBetween, distance3D } from '../math/poseMath';

// MediaPipe Pose Landmark indices
const POSE_LANDMARKS = {
  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  
  // Core
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
} as const;

/**
 * Calculate knee valgus (knee collapse) measurement
 * Returns the lateral drift of knees relative to hip width
 */
export function calculateKneeValgus(
  landmarks: Landmark3D[]
): { valgus: number; hipWidth: number; kneeDrift: number } {
  const hipL = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const hipR = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const kneeL = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const kneeR = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  
  if (!hipL || !hipR || !kneeL || !kneeR) {
    return { valgus: 0, hipWidth: 0, kneeDrift: 0 };
  }
  
  // Calculate hip width
  const hipWidth = distance3D(hipL, hipR);
  
  // Calculate knee drift (how much knees have moved inward from hip line)
  const hipCenter = {
    x: (hipL.x + hipR.x) / 2,
    y: (hipL.y + hipR.y) / 2,
    z: (hipL.z + hipR.z) / 2
  };
  
  const kneeCenter = {
    x: (kneeL.x + kneeR.x) / 2,
    y: (kneeL.y + kneeR.y) / 2,
    z: (kneeL.z + kneeR.z) / 2
  };
  
  // Calculate lateral drift (perpendicular to hip line)
  const hipVector = { x: hipR.x - hipL.x, y: hipR.y - hipL.y, z: hipR.z - hipL.z };
  const kneeVector = { x: kneeCenter.x - hipCenter.x, y: kneeCenter.y - hipCenter.y, z: kneeCenter.z - hipCenter.z };
  
  // Cross product to get perpendicular component
  const crossProduct = {
    x: hipVector.y * kneeVector.z - hipVector.z * kneeVector.y,
    y: hipVector.z * kneeVector.x - hipVector.x * kneeVector.z,
    z: hipVector.x * kneeVector.y - hipVector.y * kneeVector.x
  };
  
  const kneeDrift = Math.sqrt(crossProduct.x * crossProduct.x + crossProduct.y * crossProduct.y + crossProduct.z * crossProduct.z);
  
  // Convert to percentage of hip width
  const valgus = hipWidth > 0 ? (kneeDrift / hipWidth) * 100 : 0;
  
  return { valgus, hipWidth, kneeDrift };
}

/**
 * Calculate torso angle (chest position relative to hips and knees)
 * Used for detecting chest drop in squats
 */
export function calculateTorsoAngle(
  landmarks: Landmark3D[],
  bestSide: 'left' | 'right' = 'right'
): number {
  const shoulder = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const hip = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const knee = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_KNEE] : landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  
  if (!shoulder || !hip || !knee) {
    return 180; // Default to straight
  }
  
  return angleBetween(shoulder, hip, knee);
}

/**
 * Calculate body line angle (shoulder-hip-ankle alignment)
 * Used for push-ups and planks
 */
export function calculateBodyLine(
  landmarks: Landmark3D[],
  bestSide: 'left' | 'right' = 'right'
): number {
  const shoulder = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const hip = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const ankle = bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ANKLE] : landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  
  if (!shoulder || !hip || !ankle) {
    return 180; // Default to straight
  }
  
  return angleBetween(shoulder, hip, ankle);
}

/**
 * Calculate rep tempo classification
 */
export function calculateTempo(duration: number): 'fast' | 'normal' | 'slow' {
  if (duration < 600) return 'fast';
  if (duration > 2500) return 'slow';
  return 'normal';
}

/**
 * Calculate rep quality score (0-100)
 */
export function calculateRepQuality(
  errors: FormError[],
  duration: number,
  exercise: 'squat' | 'pushup' | 'plank',
  exerciseMetrics?: RepMetric['squat'] | RepMetric['pushup'] | RepMetric['plank']
): { score: number; quality: 'excellent' | 'good' | 'fair' | 'poor' } {
  let score = 100;
  
  // Deduct points for errors
  errors.forEach(error => {
    switch (error.severity) {
      case 'high':
        score -= 25;
        break;
      case 'medium':
        score -= 15;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });
  
  // Deduct points for tempo issues
  const tempo = calculateTempo(duration);
  if (tempo === 'fast') score -= 10;
  if (tempo === 'slow') score -= 15;
  
  // Exercise-specific quality adjustments
  switch (exercise) {
    case 'squat':
      if (exerciseMetrics && 'depth' in exerciseMetrics) {
        const depthScore = Math.min(100, (exerciseMetrics.depth / 90) * 100);
        score = (score + depthScore) / 2;
      }
      break;
    case 'pushup':
      if (exerciseMetrics && 'bodyLinePercentage' in exerciseMetrics) {
        const bodyLineScore = exerciseMetrics.bodyLinePercentage;
        score = (score + bodyLineScore) / 2;
      }
      break;
    case 'plank':
      if (exerciseMetrics && 'bodyLinePercentage' in exerciseMetrics) {
        const bodyLineScore = exerciseMetrics.bodyLinePercentage;
        score = (score + bodyLineScore) / 2;
      }
      break;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 90) quality = 'excellent';
  else if (score >= 75) quality = 'good';
  else if (score >= 60) quality = 'fair';
  else quality = 'poor';
  
  return { score, quality };
}

/**
 * Create a form error
 */
export function createFormError(
  type: FormError['type'],
  severity: FormError['severity'],
  duration: number,
  message: string,
  timestamp: number,
  value?: number,
  threshold?: number
): FormError {
  return {
    type,
    severity,
    duration,
    message,
    timestamp,
    value,
    threshold
  };
}

/**
 * Check if an error condition has been sustained for the required duration
 */
export function checkErrorDuration(
  errorStartTime: number | null,
  currentTime: number,
  requiredDuration: number
): boolean {
  if (!errorStartTime) return false;
  return (currentTime - errorStartTime) >= requiredDuration;
}

/**
 * Calculate depth percentage relative to calibrated depth
 */
export function calculateDepthPercentage(
  actualDepth: number,
  calibratedDepth: number
): number {
  if (calibratedDepth <= 0) return 0;
  return Math.min(100, (actualDepth / calibratedDepth) * 100);
}

/**
 * Get best side landmarks for analysis
 */
export function getBestSideLandmarks(
  landmarks: Landmark3D[],
  bestSide: 'left' | 'right'
): {
  shoulder: Landmark3D | null;
  hip: Landmark3D | null;
  knee: Landmark3D | null;
  ankle: Landmark3D | null;
  elbow: Landmark3D | null;
  wrist: Landmark3D | null;
} {
  return {
    shoulder: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_SHOULDER] : landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    hip: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_HIP] : landmarks[POSE_LANDMARKS.RIGHT_HIP],
    knee: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_KNEE] : landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    ankle: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ANKLE] : landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
    elbow: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_ELBOW] : landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
    wrist: bestSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_WRIST] : landmarks[POSE_LANDMARKS.RIGHT_WRIST],
  };
}
